const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { getApps, initializeApp } = require('firebase-admin/app');

if (getApps().length === 0) initializeApp();

module.exports = onSchedule(
  { schedule: 'every 1 minutes', region: 'us-central1', timeZone: 'Etc/UTC' },
  async () => {
    const db = getFirestore();
    const messaging = getMessaging();

    const now = new Date();

    // Task due in 1 hour
    const target = new Date(now.getTime() + 60 * 60 * 1000);
    target.setSeconds(0, 0);

    // ±1 minute window around target
    const windowStart = new Date(target.getTime() - 60 * 1000);
    const windowEnd = new Date(target.getTime() + 60 * 1000);

    const windowStartIso = windowStart.toISOString();
    const windowEndIso = windowEnd.toISOString();

    console.log('[scheduler] now:', now.toISOString());
    console.log('[scheduler] target:', target.toISOString());
    console.log('[scheduler] windowStart:', windowStartIso);
    console.log('[scheduler] windowEnd:', windowEndIso);

    const qSnap = await db
      .collection('tasks')
      .where('send_reminder', '==', true)
      .where('notification_sent', '==', false)
      .where('due_date', '>=', windowStartIso)
      .where('due_date', '<', windowEndIso)
      .get();

    console.log('[scheduler] tasks to notify:', qSnap.size);

    for (const docSnap of qSnap.docs) {
      const taskRef = docSnap.ref;

      try {
        const { task, user } = await db.runTransaction(async (tx) => {
          const fresh = await tx.get(taskRef);
          if (!fresh.exists) throw new Error('Missing task');
          const data = fresh.data();

          if (data.notification_sent === true || data._sending_lock === true) {
            throw new Error('Already sent or locked');
          }
          if (data.status === 'completed') {
            throw new Error('Completed task');
          }

          const userRef = db.collection('users').doc(data.groom_id);
          const userSnap = await tx.get(userRef);
          if (!userSnap.exists) throw new Error('Missing user');

          tx.update(taskRef, {
            _sending_lock: true,
            _sending_lock_at: FieldValue.serverTimestamp(),
            _last_attempt_at: FieldValue.serverTimestamp(),
            _last_skip_reason: FieldValue.delete(),
            _last_error: FieldValue.delete(),
          });

          return {
            task: { id: fresh.id, ...data },
            user: { id: userSnap.id, ...userSnap.data() },
          };
        });

        if (!user.fcm_token) {
          console.log(
            `[scheduler] skipping task ${task.id} for user ${user.id}: missing_fcm_token`
          );
          await taskRef.update({
            _sending_lock: FieldValue.delete(),
            _sending_lock_at: FieldValue.delete(),
            _last_skip_reason: 'missing_fcm_token',
          });
          continue;
        }

        const title = String('Task Due Today');
        const body = String(
          `${task.name || 'Task'} for ${
            task.horse_name || 'your horse'
          } expires in one hour`
        );


        let dueISO = '';
        if (typeof task.due_date === 'string') {
          const d = new Date(task.due_date);
          if (!isNaN(d.getTime())) dueISO = d.toISOString();
        } else if (task.due_date?.toDate?.()) {
          dueISO = task.due_date.toDate().toISOString();
        }

        const message = {
          token: String(user.fcm_token),
          notification: { title, body },
          data: {
            taskId: String(task.id || ''),
            horseName: String(task.horse_name || ''),
            dueDate: String(dueISO || ''),
            screen: String('taskDetail'),
            title: String(title),
            body: String(body),
          },
          android: {
            priority: 'high',
            notification: { channelId: 'on_stride_notifications' },
          },
          apns: {
            headers: {
              'apns-push-type': 'alert',
              'apns-priority': '10',
            },
            payload: {
              aps: {
                sound: 'default',
              },
            },
          },
          webpush: {
            notification: { title, body },
          },
        };

        let sent = false;
        try {
          const res = await messaging.send(message);
          console.log(
            `[scheduler] notification sent for task ${task.id} to user ${user.id}:`,
            res
          );
          sent = true;
        } catch (err) {
          console.error(
            `[scheduler] error sending message for task ${task.id} to user ${user.id}:`,
            err
          );

          await taskRef.update({
            _last_error: String(err?.code || err?.message || err),
          });

          if (
            err?.code === 'messaging/registration-token-not-registered' ||
            err?.code === 'messaging/invalid-registration-token'
          ) {
            await db
              .collection('users')
              .doc(user.id)
              .update({ fcm_token: FieldValue.delete() });
          }
        }

        await taskRef.update(
          sent
            ? {
                notification_sent: true,
                notification_sent_at: FieldValue.serverTimestamp(),
                _sending_lock: FieldValue.delete(),
                _sending_lock_at: FieldValue.delete(),
              }
            : {
                _sending_lock: FieldValue.delete(),
                _sending_lock_at: FieldValue.delete(),
              }
        );
      } catch (e) {
        console.error('[scheduler] unexpected error inside loop:', e);
        try {
          await taskRef.update({
            _sending_lock: FieldValue.delete(),
            _sending_lock_at: FieldValue.delete(),
            _last_error: String(e?.message || e),
          });
        } catch {}
      }
    }

    return null;
  }
);
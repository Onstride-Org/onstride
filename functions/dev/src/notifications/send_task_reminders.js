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
        const { task } = await db.runTransaction(async (tx) => {
          const fresh = await tx.get(taskRef);
          if (!fresh.exists) throw new Error('Missing task');
          const data = fresh.data();

          if (data.notification_sent === true || data._sending_lock === true) {
            throw new Error('Already sent or locked');
          }
          if (data.status === 'completed') {
            throw new Error('Completed task');
          }

          tx.update(taskRef, {
            _sending_lock: true,
            _sending_lock_at: FieldValue.serverTimestamp(),
            _last_attempt_at: FieldValue.serverTimestamp(),
            _last_skip_reason: FieldValue.delete(),
            _last_error: FieldValue.delete(),
          });

          return {
            task: { id: fresh.id, ...data },
          };
        });

        // -----------------------------
        // Resolve dueDate (string or Timestamp)
        // -----------------------------
        let dueISO = '';
        if (typeof task.due_date === 'string') {
          const d = new Date(task.due_date);
          if (!isNaN(d.getTime())) dueISO = d.toISOString();
        } else if (task.due_date?.toDate?.()) {
          dueISO = task.due_date.toDate().toISOString();
        }

        // -----------------------------
        // Resolve horses (new model) + legacy fallback
        // -----------------------------
        const horseNames = Array.isArray(task.horses)
          ? task.horses
              .map((h) => (h?.name ? String(h.name).trim() : ''))
              .filter((n) => n.length > 0)
          : [];

        const legacyHorseName =
          task.horse_name != null ? String(task.horse_name).trim() : '';

        const horsesLabel =
          horseNames.length > 0
            ? horseNames.join(', ')
            : legacyHorseName || 'your horse';

        // -----------------------------
        // Resolve assignees (new model) + legacy fallback
        // -----------------------------
        const assigneeIds = Array.isArray(task.assignees)
          ? task.assignees
              .map((a) => (a?.id ? String(a.id) : ''))
              .filter((id) => id.length > 0)
          : [];

        const legacyGroomId =
          task.groom_id != null ? String(task.groom_id) : '';

        const targetUserIds =
          assigneeIds.length > 0
            ? Array.from(new Set(assigneeIds))
            : legacyGroomId
              ? [legacyGroomId]
              : [];

        if (targetUserIds.length === 0) {
          console.log(`[scheduler] skipping task ${task.id}: no_assignees`);
          await taskRef.update({
            _sending_lock: FieldValue.delete(),
            _sending_lock_at: FieldValue.delete(),
            _last_skip_reason: 'no_assignees',
          });
          continue;
        }

        // Per-user sent map (prevents resending to users already notified)
        const sentTo = task.notification_sent_to || {};
        const pendingUserIds = targetUserIds.filter((uid) => sentTo[uid] !== true);

        if (pendingUserIds.length === 0) {
          console.log(
            `[scheduler] skipping task ${task.id}: already_notified_all_assignees`
          );
          await taskRef.update({
            notification_sent: true,
            notification_sent_at: FieldValue.serverTimestamp(),
            _sending_lock: FieldValue.delete(),
            _sending_lock_at: FieldValue.delete(),
          });
          continue;
        }

        // -----------------------------
        // Load all users (batch)
        // -----------------------------
        const userRefs = pendingUserIds.map((uid) => db.collection('users').doc(uid));
        const userSnaps = await db.getAll(...userRefs);

        const users = userSnaps
          .filter((s) => s.exists)
          .map((s) => ({ id: s.id, ...s.data() }));

        // Build notification content
        const title = String('Task Due Soon');
        const body = String(
          `${task.name || 'Task'} for ${horsesLabel} expires in one hour`
        );

        // Track updates for this task
        const updatePayload = {};
        let anySendFailed = false;

        for (const uid of pendingUserIds) {
          const user = users.find((u) => u.id === uid);

          if (!user) {
            console.log(`[scheduler] skipping task ${task.id} user ${uid}: missing_user`);
            updatePayload[`notification_sent_to.${uid}`] = false;
            updatePayload[`notification_skip_reason_to.${uid}`] = 'missing_user';
            anySendFailed = true;
            continue;
          }

          const token = user.fcm_token ? String(user.fcm_token) : '';
          if (!token) {
            console.log(
              `[scheduler] skipping task ${task.id} for user ${uid}: missing_fcm_token`
            );
            updatePayload[`notification_sent_to.${uid}`] = false;
            updatePayload[`notification_skip_reason_to.${uid}`] = 'missing_fcm_token';
            anySendFailed = true;
            continue;
          }

          const message = {
            token,
            notification: { title, body },
            data: {
              taskId: String(task.id || ''),
              horseNames: String(horsesLabel || ''),
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
                aps: { sound: 'default' },
              },
            },
            webpush: {
              notification: { title, body },
            },
          };

          try {
            const res = await messaging.send(message);
            console.log(
              `[scheduler] notification sent for task ${task.id} to user ${uid}:`,
              res
            );
            updatePayload[`notification_sent_to.${uid}`] = true;
            updatePayload[`notification_sent_to_at.${uid}`] =
              FieldValue.serverTimestamp();
            updatePayload[`notification_skip_reason_to.${uid}`] =
              FieldValue.delete();
          } catch (err) {
            anySendFailed = true;
            console.error(
              `[scheduler] error sending message for task ${task.id} to user ${uid}:`,
              err
            );

            updatePayload[`notification_sent_to.${uid}`] = false;
            updatePayload[`notification_error_to.${uid}`] = String(
              err?.code || err?.message || err
            );

            if (
              err?.code === 'messaging/registration-token-not-registered' ||
              err?.code === 'messaging/invalid-registration-token'
            ) {
              await db
                .collection('users')
                .doc(uid)
                .update({ fcm_token: FieldValue.delete() });

              updatePayload[`notification_skip_reason_to.${uid}`] =
                'invalid_fcm_token';
            }
          }
        }

        // If no pending sends failed, mark the whole task as notified
        const remainingAfterThisRun = targetUserIds.filter(
          (uid) => (updatePayload[`notification_sent_to.${uid}`] ?? sentTo[uid]) !== true
        );

        const allNotified = remainingAfterThisRun.length === 0 && !anySendFailed;

        await taskRef.update({
          ...updatePayload,
          notification_sent: allNotified ? true : false,
          notification_sent_at: allNotified
            ? FieldValue.serverTimestamp()
            : FieldValue.delete(),
          _sending_lock: FieldValue.delete(),
          _sending_lock_at: FieldValue.delete(),
        });
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
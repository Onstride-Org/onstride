const Task = require('../models/Task');
const Lesson = require('../models/Lesson');
const { Notification } = require('../models/Notification');

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

const sendTaskReminders = async () => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

  const tasks = await Task.find({
    sendReminder: true,
    notificationSent: false,
    status: { $ne: 'completed' },
    dueDate: { $gte: now, $lte: windowEnd },
    $or: [
      { approvalStatus: 'approved' },
      { approvalStatus: { $exists: false } }
    ],
  });

  if (!tasks.length) return;

  const notifications = [];
  const taskIds = [];

  tasks.forEach((task) => {
    taskIds.push(task._id);
    task.assignees.forEach((assignee) => {
      if (!assignee?.id) return;
      notifications.push({
        userId: assignee.id,
        type: 'task',
        title: 'Task due soon',
        body: `Reminder: ${task.name} is due within 24 hours.`,
        data: { taskId: task._id.toString() },
        action: '/app/tasks',
      });
    });
  });

  if (notifications.length) {
    await Notification.insertMany(notifications);
  }

  await Task.updateMany(
    { _id: { $in: taskIds } },
    { notificationSent: true }
  );
};

const sendLessonReminders = async () => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

  const lessons = await Lesson.find({
    reminderSent: false,
    status: 'approved',
    scheduledDate: { $gte: now, $lte: windowEnd },
  });

  if (!lessons.length) return;

  const notifications = [];
  const lessonIds = [];

  lessons.forEach((lesson) => {
    lessonIds.push(lesson._id);
    if (lesson.trainerId) {
      notifications.push({
        userId: lesson.trainerId,
        type: 'lesson',
        title: 'Lesson coming up',
        body: `Reminder: Lesson with ${lesson.clientName || 'client'} is within 24 hours.`,
        data: { lessonId: lesson._id.toString() },
        action: '/app/calendar',
      });
    }
    if (lesson.clientId) {
      notifications.push({
        userId: lesson.clientId,
        type: 'lesson',
        title: 'Lesson coming up',
        body: `Reminder: Lesson with ${lesson.trainerName || 'trainer'} is within 24 hours.`,
        data: { lessonId: lesson._id.toString() },
        action: '/app/calendar',
      });
    }
  });

  if (notifications.length) {
    await Notification.insertMany(notifications);
  }

  await Lesson.updateMany(
    { _id: { $in: lessonIds } },
    { reminderSent: true }
  );
};

const startReminderScheduler = () => {
  const run = async () => {
    try {
      await sendTaskReminders();
      await sendLessonReminders();
    } catch (error) {
      console.error('Reminder scheduler error:', error);
    }
  };

  run();
  setInterval(run, 5 * 60 * 1000);
};

module.exports = {
  startReminderScheduler,
};

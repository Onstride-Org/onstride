const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Horse = require('../src/models/Horse');
const Lesson = require('../src/models/Lesson');
const Task = require('../src/models/Task');

async function populateJanuaryCalendar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'achain123@gmail.com' });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    console.log('Found user:', user.name, '- ID:', user._id);

    const barnId = user.barnId;
    if (!barnId) {
      console.error('User has no barnId');
      process.exit(1);
    }
    console.log('Barn ID:', barnId);

    // Get horses in this barn
    const horses = await Horse.find({ barnId }).limit(5);
    console.log('Found', horses.length, 'horses');

    // Get other users in the barn to use as trainers/clients
    const barnUsers = await User.find({ barnId }).limit(10);
    console.log('Found', barnUsers.length, 'users in barn');

    // Clear existing January 2026 lessons and tasks for this barn
    const janStart = new Date('2026-01-01T00:00:00Z');
    const janEnd = new Date('2026-01-31T23:59:59Z');

    await Lesson.deleteMany({
      barnId,
      scheduledDate: { $gte: janStart, $lte: janEnd }
    });
    await Task.deleteMany({
      barnId,
      dueDate: { $gte: janStart, $lte: janEnd }
    });
    console.log('Cleared existing January 2026 data');

    // Create lessons throughout January
    const lessonTypes = ['privateSingle', 'privatePackage', 'groupLesson', 'training', 'assessment'];
    const lessonStatuses = ['approved', 'completed', 'approved', 'approved']; // Mostly approved
    const locations = ['Main Arena', 'Outdoor Ring', 'Round Pen', 'Trail', 'Indoor Arena'];

    const lessons = [];
    const tasks = [];

    // Generate lessons for each week of January
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2026, 0, day); // January 2026
      const dayOfWeek = date.getDay();

      // Skip Sundays for lessons (day off)
      if (dayOfWeek === 0) continue;

      // Morning lessons (9am, 10am, 11am)
      const morningSlots = [9, 10, 11];
      // Afternoon lessons (2pm, 3pm, 4pm, 5pm)
      const afternoonSlots = [14, 15, 16, 17];

      // Add 2-4 lessons per day
      const numLessons = Math.floor(Math.random() * 3) + 2;
      const allSlots = [...morningSlots, ...afternoonSlots];

      for (let i = 0; i < numLessons && i < allSlots.length; i++) {
        const hour = allSlots[Math.floor(Math.random() * allSlots.length)];
        const scheduledDate = new Date(2026, 0, day, hour, 0, 0);

        const trainer = barnUsers[Math.floor(Math.random() * barnUsers.length)] || user;
        const client = barnUsers[Math.floor(Math.random() * barnUsers.length)] || user;
        const horse = horses.length > 0 ? horses[Math.floor(Math.random() * horses.length)] : null;
        const lessonType = lessonTypes[Math.floor(Math.random() * lessonTypes.length)];
        const status = scheduledDate < new Date() ? 'completed' : lessonStatuses[Math.floor(Math.random() * lessonStatuses.length)];

        lessons.push({
          barnId,
          trainerId: trainer._id,
          clientId: client._id,
          horseId: horse?._id,
          scheduledDate,
          durationMinutes: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
          price: [50, 75, 100, 125, 150][Math.floor(Math.random() * 5)],
          type: lessonType,
          status,
          trainerName: trainer.name,
          clientName: client.name,
          horseName: horse?.name,
          location: locations[Math.floor(Math.random() * locations.length)],
          notes: getRandomLessonNote(lessonType),
          createdById: user._id
        });
      }

      // Add 1-2 tasks per day
      const numTasks = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numTasks; i++) {
        const taskHour = [8, 12, 18][Math.floor(Math.random() * 3)];
        const dueDate = new Date(2026, 0, day, taskHour, 0, 0);
        const isPast = dueDate < new Date();

        const taskData = getRandomTask(day);
        const assigneeList = [];
        const numAssignees = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < numAssignees; j++) {
          const assignee = barnUsers[Math.floor(Math.random() * barnUsers.length)] || user;
          assigneeList.push({
            id: assignee._id,
            name: assignee.name,
            accountType: assignee.accountType
          });
        }

        const horseList = [];
        if (taskData.includeHorse && horses.length > 0) {
          const numHorses = Math.floor(Math.random() * 2) + 1;
          for (let j = 0; j < numHorses; j++) {
            const h = horses[Math.floor(Math.random() * horses.length)];
            horseList.push({
              id: h._id,
              name: h.name
            });
          }
        }

        tasks.push({
          barnId,
          name: taskData.name,
          description: taskData.description,
          dueDate,
          status: isPast ? (Math.random() > 0.3 ? 'completed' : 'overdue') : 'notStarted',
          horses: horseList,
          assignees: assigneeList,
          sendReminder: true,
          reminderMinutesBefore: 60,
          createdById: user._id,
          completedAt: isPast && Math.random() > 0.3 ? dueDate : undefined
        });
      }
    }

    // Insert all lessons
    if (lessons.length > 0) {
      await Lesson.insertMany(lessons);
      console.log(`Created ${lessons.length} lessons`);
    }

    // Insert all tasks
    if (tasks.length > 0) {
      await Task.insertMany(tasks);
      console.log(`Created ${tasks.length} tasks`);
    }

    // Summary
    console.log('\n✅ January 2026 calendar populated successfully!');
    console.log('\nSummary:');
    console.log(`- Total lessons: ${lessons.length}`);
    console.log(`- Total tasks: ${tasks.length}`);

    // Count by type
    const lessonsByType = lessons.reduce((acc, l) => {
      acc[l.type] = (acc[l.type] || 0) + 1;
      return acc;
    }, {});
    console.log('\nLessons by type:');
    Object.entries(lessonsByType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    const lessonsByStatus = lessons.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});
    console.log('\nLessons by status:');
    Object.entries(lessonsByStatus).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function getRandomLessonNote(type) {
  const notes = {
    privateSingle: [
      'Focus on flatwork basics',
      'Working on canter transitions',
      'Dressage fundamentals',
      'Jumping course work',
      'Trail riding preparation'
    ],
    privatePackage: [
      'Part of 10-lesson package',
      'Continuing from last session',
      'Progress check-in',
      'Building on previous exercises'
    ],
    groupLesson: [
      'Beginner group - 4 riders',
      'Intermediate jumping class',
      'Adult group lesson',
      'Kids riding club meeting'
    ],
    training: [
      'Green horse training session',
      'Competition prep',
      'Behavior correction work',
      'Young horse foundation'
    ],
    assessment: [
      'Initial skill evaluation',
      'Monthly progress assessment',
      'Pre-competition readiness check',
      'New student evaluation'
    ]
  };
  const typeNotes = notes[type] || notes.privateSingle;
  return typeNotes[Math.floor(Math.random() * typeNotes.length)];
}

function getRandomTask(day) {
  const taskTemplates = [
    { name: 'Morning Feed', description: 'Feed all horses their morning grain and hay', includeHorse: false },
    { name: 'Evening Feed', description: 'Feed all horses their evening grain and hay', includeHorse: false },
    { name: 'Stall Cleaning', description: 'Clean and bed all occupied stalls', includeHorse: false },
    { name: 'Turn Out', description: 'Turn horses out to pastures', includeHorse: true },
    { name: 'Bring In', description: 'Bring horses in from pastures', includeHorse: true },
    { name: 'Farrier Visit', description: 'Farrier scheduled for hoof trimming/shoeing', includeHorse: true },
    { name: 'Vet Check', description: 'Veterinarian wellness check', includeHorse: true },
    { name: 'Tack Cleaning', description: 'Clean and condition all tack', includeHorse: false },
    { name: 'Arena Maintenance', description: 'Drag and water the arena', includeHorse: false },
    { name: 'Hay Delivery', description: 'Receive and stack hay delivery', includeHorse: false },
    { name: 'Grain Order', description: 'Place monthly grain order', includeHorse: false },
    { name: 'Blanket Check', description: 'Check and adjust horse blankets', includeHorse: true },
    { name: 'Water Trough Cleaning', description: 'Scrub and refill all water troughs', includeHorse: false },
    { name: 'Fence Inspection', description: 'Walk fence lines and check for damage', includeHorse: false },
    { name: 'Medication Admin', description: 'Administer prescribed medications', includeHorse: true },
    { name: 'Grooming Session', description: 'Full grooming including mane/tail care', includeHorse: true },
    { name: 'Deworming', description: 'Administer dewormer paste', includeHorse: true },
    { name: 'Coggins Test', description: 'Annual Coggins blood draw scheduled', includeHorse: true },
    { name: 'Dental Float', description: 'Equine dentist scheduled', includeHorse: true },
    { name: 'Trailer Maintenance', description: 'Check trailer tires, lights, and floor', includeHorse: false }
  ];

  return taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
}

populateJanuaryCalendar();

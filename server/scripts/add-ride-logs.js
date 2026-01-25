/**
 * Script to add ride logs for a horse
 * Usage: node scripts/add-ride-logs.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Horse = require('../src/models/Horse');
const RideLog = require('../src/models/RideLog');

const HORSE_ID = '69690f7d7fe4cf5e453e6cc7';

async function addRideLogs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the horse to find barnId and createdById
    const horse = await Horse.findById(HORSE_ID).setOptions({ includeDeleted: true });
    if (!horse) {
      console.error('Horse not found!');
      process.exit(1);
    }

    console.log(`Found horse: ${horse.name}`);
    console.log(`Barn ID: ${horse.barnId}`);

    const barnId = horse.barnId;
    const createdById = horse.createdById || horse.ownerId || horse.boarderId;

    if (!createdById) {
      console.error('No user ID found on horse to use as createdById');
      process.exit(1);
    }

    const now = new Date();
    const rideLogs = [
      // This week rides (recent)
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        type: 'training',
        durationMinutes: 45,
        riderName: 'Sarah Mitchell',
        notes: 'Flatwork session focusing on collection and lateral movements. Very responsive today.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        type: 'lesson',
        durationMinutes: 60,
        riderName: 'Emma Johnson',
        notes: 'Jumping lesson - worked up to 1.10m courses. Clean rounds.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        type: 'trail',
        durationMinutes: 90,
        riderName: 'Sarah Mitchell',
        notes: 'Trail ride through the back fields. Good relaxation day.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        type: 'lunging',
        durationMinutes: 30,
        riderName: 'Mike Torres',
        notes: 'Light lunging session with side reins.',
        createdById
      },

      // This month rides (older this month)
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        type: 'training',
        durationMinutes: 50,
        riderName: 'Sarah Mitchell',
        notes: 'Dressage schooling - working on half-passes.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        type: 'lesson',
        durationMinutes: 55,
        riderName: 'Emma Johnson',
        notes: 'Grid work and gymnastic jumping exercises.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        type: 'groundwork',
        durationMinutes: 25,
        riderName: 'Mike Torres',
        notes: 'In-hand work and liberty training.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000), // 17 days ago
        type: 'training',
        durationMinutes: 60,
        riderName: 'Sarah Mitchell',
        notes: 'Full training session - flat and small jumps.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        type: 'competition',
        durationMinutes: 120,
        riderName: 'Sarah Mitchell',
        notes: 'Local show - placed 2nd in 1.15m class!',
        createdById
      },

      // Older rides (past months)
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), // ~5 weeks ago
        type: 'training',
        durationMinutes: 45,
        riderName: 'Sarah Mitchell',
        notes: 'Regular training session.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        type: 'lesson',
        durationMinutes: 60,
        riderName: 'Emma Johnson',
        notes: 'Jumping practice with course work.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        type: 'trail',
        durationMinutes: 75,
        riderName: 'Sarah Mitchell',
        notes: 'Long trail ride.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
        type: 'training',
        durationMinutes: 50,
        riderName: 'Sarah Mitchell',
        notes: 'Flatwork day.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000),
        type: 'competition',
        durationMinutes: 90,
        riderName: 'Sarah Mitchell',
        notes: 'Regional show - 3rd place in 1.20m.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        type: 'lunging',
        durationMinutes: 30,
        riderName: 'Mike Torres',
        notes: 'Recovery day after competition.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000),
        type: 'training',
        durationMinutes: 55,
        riderName: 'Sarah Mitchell',
        notes: 'Pre-competition preparation.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000),
        type: 'lesson',
        durationMinutes: 60,
        riderName: 'Emma Johnson',
        notes: 'Technical jumping session.',
        createdById
      },
      {
        horseId: HORSE_ID,
        barnId,
        date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        type: 'groundwork',
        durationMinutes: 20,
        riderName: 'Mike Torres',
        notes: 'Stretching and ground exercises.',
        createdById
      }
    ];

    console.log(`\nInserting ${rideLogs.length} ride logs...`);
    await RideLog.insertMany(rideLogs);

    // Get stats
    const stats = await RideLog.getStatsForHorse(HORSE_ID);

    console.log('\n✅ Ride logs added successfully!');
    console.log('\nRide Statistics:');
    console.log('----------------');
    console.log(`Total Rides: ${stats.totalRides}`);
    console.log(`Total Minutes: ${stats.totalMinutes}`);
    console.log(`This Month: ${stats.ridesThisMonth} rides (${stats.minutesThisMonth} min)`);
    console.log(`This Week: ${stats.ridesThisWeek} rides (${stats.minutesThisWeek} min)`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

addRideLogs();

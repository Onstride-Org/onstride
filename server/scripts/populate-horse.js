/**
 * Script to populate a horse with full profile details
 * Usage: node scripts/populate-horse.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Horse = require('../src/models/Horse');

const HORSE_ID = '69690f7d7fe4cf5e453e6cc7';

const fullHorseProfile = {
  // Basic Info
  name: 'Midnight Thunder',
  photoUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800',
  birthday: new Date('2018-04-15'),
  age: 7,
  breed: {
    value: 'warmblood',
    label: 'Warmblood'
  },
  sexStatus: {
    value: 'gelding',
    label: 'Gelding'
  },
  color: 'Dark Bay',
  status: 'active',
  notes: 'Exceptional jumper with great temperament. Competed at 1.20m level. Requires daily turnout and prefers morning exercise. Gets along well with other horses.',

  // Breeding Info
  registeredName: 'MT Midnight Thunder',
  usefNumber: 'USEF123456789',
  feiNumber: 'FEI987654321',
  sireName: 'Sandro Hit',
  sireId: 'DE321210123456',
  damName: 'Bella Luna',
  damId: 'DE421000567890',
  paternalGrandsireName: 'Sandro',
  paternalGranddamName: 'Loretta',
  maternalGrandsireName: 'Contender',
  maternalGranddamName: 'Princess Belle',
  isStud: false,
  isBroodmare: false,
  colorGenetics: 'E/e A/a',

  // Stride Number
  strideNumber: 'STR-2024-00042',
  strideNumberAssignedAt: new Date('2024-06-15'),

  // Health Records
  healthRecords: [
    {
      type: 'vaccination',
      title: 'Rabies Vaccination',
      value: 'Administered',
      date: new Date('2024-11-15'),
      notes: 'Annual rabies vaccine - next due Nov 2025'
    },
    {
      type: 'vaccination',
      title: 'EWT/Flu/Rhino',
      value: 'Administered',
      date: new Date('2024-09-01'),
      notes: 'Combination vaccine - next due March 2025'
    },
    {
      type: 'deworming',
      title: 'Deworming - Ivermectin',
      value: 'Completed',
      date: new Date('2024-10-20'),
      notes: 'Fall deworming protocol'
    },
    {
      type: 'farrier',
      title: 'Farrier Visit - Full Reset',
      value: 'Front shoes replaced',
      date: new Date('2025-01-10'),
      notes: 'Good hoof condition, slight adjustment to left front'
    },
    {
      type: 'dental',
      title: 'Annual Dental Float',
      value: 'Completed',
      date: new Date('2024-08-20'),
      notes: 'Minor points floated, good dental health overall'
    },
    {
      type: 'veterinary',
      title: 'Annual Wellness Exam',
      value: 'Healthy',
      date: new Date('2024-11-15'),
      notes: 'All vitals normal. Weight stable at 1,180 lbs. Heart and lungs clear.'
    },
    {
      type: 'temperature',
      title: 'Temperature Check',
      value: '99.8°F',
      date: new Date('2025-01-20'),
      notes: 'Normal range'
    },
    {
      type: 'weight',
      title: 'Weight Measurement',
      value: '1,180 lbs',
      date: new Date('2025-01-15'),
      notes: 'Ideal weight maintained'
    },
    {
      type: 'geneticTest',
      title: 'WFFS Test',
      value: 'N/N (Clear)',
      date: new Date('2020-05-10'),
      notes: 'Warmblood Fragile Foal Syndrome - Negative',
      testName: 'WFFS',
      result: 'N/N (Clear)',
      testDate: new Date('2020-05-10'),
      laboratory: 'UC Davis VGL'
    },
    {
      type: 'injury',
      title: 'Minor Scrape - Left Hind',
      value: 'Healed',
      date: new Date('2024-07-05'),
      notes: 'Small pasture scrape, cleaned and treated. Fully healed within 10 days.'
    }
  ],

  // Documents
  documents: [
    {
      type: 'coggins',
      name: 'Coggins Test 2024',
      fileUrl: 'https://example.com/docs/coggins-2024.pdf',
      expirationDate: new Date('2025-11-15'),
      uploadedAt: new Date('2024-11-15')
    },
    {
      type: 'healthCertificate',
      name: 'Health Certificate - State Travel',
      fileUrl: 'https://example.com/docs/health-cert-2024.pdf',
      expirationDate: new Date('2025-01-30'),
      uploadedAt: new Date('2024-12-30')
    },
    {
      type: 'registration',
      name: 'USEF Registration',
      fileUrl: 'https://example.com/docs/usef-registration.pdf',
      expirationDate: new Date('2025-12-31'),
      uploadedAt: new Date('2024-01-05')
    },
    {
      type: 'vaccination',
      name: 'Vaccination Records 2024',
      fileUrl: 'https://example.com/docs/vaccinations-2024.pdf',
      uploadedAt: new Date('2024-11-15')
    },
    {
      type: 'other',
      name: 'Purchase Agreement',
      fileUrl: 'https://example.com/docs/purchase-agreement.pdf',
      uploadedAt: new Date('2020-03-15')
    }
  ]
};

async function populateHorse() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log(`\nLooking for horse with ID: ${HORSE_ID}`);

    const horse = await Horse.findById(HORSE_ID).setOptions({ includeDeleted: true });

    if (!horse) {
      console.error('Horse not found!');
      process.exit(1);
    }

    console.log(`Found horse: ${horse.name}`);
    console.log('\nUpdating horse with full profile data...');

    // Update the horse with full profile
    Object.assign(horse, fullHorseProfile);
    await horse.save();

    console.log('\n✅ Horse profile updated successfully!');
    console.log('\nUpdated profile summary:');
    console.log('------------------------');
    console.log(`Name: ${horse.name}`);
    console.log(`Registered Name: ${horse.registeredName}`);
    console.log(`Breed: ${horse.breed?.label}`);
    console.log(`Sex: ${horse.sexStatus?.label}`);
    console.log(`Color: ${horse.color}`);
    console.log(`Age: ${horse.age} years`);
    console.log(`Birthday: ${horse.birthday?.toDateString()}`);
    console.log(`USEF #: ${horse.usefNumber}`);
    console.log(`FEI #: ${horse.feiNumber}`);
    console.log(`Stride #: ${horse.strideNumber}`);
    console.log(`Sire: ${horse.sireName}`);
    console.log(`Dam: ${horse.damName}`);
    console.log(`Health Records: ${horse.healthRecords?.length || 0}`);
    console.log(`Documents: ${horse.documents?.length || 0}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

populateHorse();

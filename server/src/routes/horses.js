const express = require('express');
const { body, param, query } = require('express-validator');
const Horse = require('../models/Horse');
const RideLog = require('../models/RideLog');
const Task = require('../models/Task');
const Lesson = require('../models/Lesson');
const { authenticate, loadBarnContext, requireBarn, hasPermission, ownsResourceOrStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadDocument, uploadImage, uploadToCloud } = require('../middleware/upload');
const storageService = require('../services/storage');

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);

// Get all horses in barn
router.get('/', requireBarn, async (req, res, next) => {
  try {
    const { status, boarderId, search, page = 1, limit = 50 } = req.query;
    const user = req.user;

    // Boarders can only see horses linked to them (as owner or boarder)
    const isBoarder = user.accountType === 'boarder' ||
      (req.barnRole && req.barnRole.role === 'boarder');

    const filter = {
      barnId: req.barnId,
      ...(status && { status }),
      ...(boarderId && { boarderId })
    };

    // Boarders only see their own horses
    if (isBoarder) {
      filter.$or = [
        { boarderId: req.userId },
        { ownerId: req.userId }
      ];
    }

    let horses = await Horse.find(filter)
      .populate('boarderId', 'name email')
      .populate('ownerId', 'name email')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      horses = horses.filter(h =>
        h.name.toLowerCase().includes(searchLower) ||
        h.breed?.label?.toLowerCase().includes(searchLower)
      );
    }

    const total = await Horse.countDocuments(filter);

    res.json({
      data: horses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get horse by ID
router.get('/:id', async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id)
      .populate('boarderId', 'name email avatarUrl')
      .populate('ownerId', 'name email avatarUrl');

    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    // Get ride stats
    const rideStats = await RideLog.getStatsForHorse(horse._id);

    res.json({
      ...horse.toObject(),
      rideStats
    });
  } catch (error) {
    next(error);
  }
});

// Create horse
router.post('/', [
  requireBarn,
  hasPermission('horseManagement'),
  body('name').trim().notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const { age, birthday, ...rest } = req.body;

    // If age is provided without birthday, calculate birthday from age
    let calculatedBirthday = birthday;
    if (age !== undefined && !birthday) {
      const today = new Date();
      const birthYear = today.getFullYear() - parseInt(age);
      calculatedBirthday = new Date(birthYear, 0, 1); // January 1st of birth year
    }

    const horse = await Horse.create({
      ...rest,
      age,
      birthday: calculatedBirthday,
      barnId: req.barnId,
      createdById: req.userId
    });

    res.status(201).json(horse);
  } catch (error) {
    next(error);
  }
});

// Update horse
router.put('/:id', [
  hasPermission('horseManagement'),
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const {
      name, age, birthday, breed, sexStatus, color, status, boarderId, ownerId, notes,
      usefNumber, feiNumber, registeredName,
      sireName, sireId, damName, damId,
      paternalGrandsireName, paternalGranddamName,
      maternalGrandsireName, maternalGranddamName,
      isStud, isBroodmare, colorGenetics
    } = req.body;

    // If age is provided without birthday, calculate birthday from age
    // Set to January 1st of the birth year so calculatedAge virtual works correctly
    let calculatedBirthday = birthday;
    if (age !== undefined && birthday === undefined) {
      const today = new Date();
      const birthYear = today.getFullYear() - parseInt(age);
      calculatedBirthday = new Date(birthYear, 0, 1); // January 1st of birth year
    }

    const horse = await Horse.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(age !== undefined && { age }),
        ...(calculatedBirthday !== undefined && { birthday: calculatedBirthday }),
        ...(breed && { breed }),
        ...(sexStatus && { sexStatus }),
        ...(color !== undefined && { color }),
        ...(status && { status }),
        ...(boarderId !== undefined && { boarderId }),
        ...(ownerId !== undefined && { ownerId }),
        ...(notes !== undefined && { notes }),
        ...(usefNumber !== undefined && { usefNumber }),
        ...(feiNumber !== undefined && { feiNumber }),
        ...(registeredName !== undefined && { registeredName }),
        ...(sireName !== undefined && { sireName }),
        ...(sireId !== undefined && { sireId }),
        ...(damName !== undefined && { damName }),
        ...(damId !== undefined && { damId }),
        ...(paternalGrandsireName !== undefined && { paternalGrandsireName }),
        ...(paternalGranddamName !== undefined && { paternalGranddamName }),
        ...(maternalGrandsireName !== undefined && { maternalGrandsireName }),
        ...(maternalGranddamName !== undefined && { maternalGranddamName }),
        ...(isStud !== undefined && { isStud }),
        ...(isBroodmare !== undefined && { isBroodmare }),
        ...(colorGenetics !== undefined && { colorGenetics })
      },
      { new: true }
    );

    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    res.json(horse);
  } catch (error) {
    next(error);
  }
});

// Add health record
router.post('/:id/health', [
  hasPermission('horseManagement'),
  body('type').isIn(['temperature', 'weight', 'vaccination', 'deworming', 'dental', 'farrier', 'veterinary', 'medication', 'injury', 'geneticTest', 'other']),
  validate
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    if (!horse.healthRecords) {
      horse.healthRecords = [];
    }

    const record = {
      ...req.body,
      recordedBy: req.userId,
      date: req.body.date || new Date()
    };

    horse.healthRecords.push(record);
    await horse.save();

    res.status(201).json(horse.healthRecords);
  } catch (error) {
    next(error);
  }
});

// Get health records
router.get('/:id/health', async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    // Combine healthRecords and legacy geneticTests
    const allRecords = [
      ...(horse.healthRecords || []),
      ...(horse.geneticTests || []).map(t => ({
        ...t.toObject(),
        type: 'geneticTest',
        title: t.testName,
        value: t.result,
        date: t.testDate
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allRecords);
  } catch (error) {
    next(error);
  }
});

// Update health record
router.put('/:id/health/:recordId', [
  hasPermission('horseManagement'),
  validate
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    const record = horse.healthRecords?.id(req.params.recordId);
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }

    Object.assign(record, req.body);
    await horse.save();

    res.json(record);
  } catch (error) {
    next(error);
  }
});

// Delete health record
router.delete('/:id/health/:recordId', [
  hasPermission('horseManagement')
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    horse.healthRecords.pull(req.params.recordId);
    await horse.save();

    res.json({ message: 'Health record deleted' });
  } catch (error) {
    next(error);
  }
});

// Legacy: Add genetic test (for backward compatibility)
router.post('/:id/genetics', [
  hasPermission('horseManagement'),
  body('testName').notEmpty(),
  body('result').notEmpty(),
  validate
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    // Add to healthRecords with type geneticTest
    if (!horse.healthRecords) {
      horse.healthRecords = [];
    }

    horse.healthRecords.push({
      type: 'geneticTest',
      title: req.body.testName,
      value: req.body.result,
      date: req.body.testDate || new Date(),
      notes: req.body.notes,
      // Keep legacy fields too
      testName: req.body.testName,
      result: req.body.result,
      testDate: req.body.testDate,
      laboratory: req.body.laboratory
    });
    await horse.save();

    res.json(horse.healthRecords);
  } catch (error) {
    next(error);
  }
});

// Legacy: Update genetic test
router.put('/:id/genetics/:testId', [
  hasPermission('horseManagement'),
  validate
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    const test = horse.healthRecords?.id(req.params.testId) || horse.geneticTests?.id(req.params.testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    Object.assign(test, req.body);
    await horse.save();

    res.json(test);
  } catch (error) {
    next(error);
  }
});

// Legacy: Delete genetic test
router.delete('/:id/genetics/:testId', [
  hasPermission('horseManagement')
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    if (horse.healthRecords) {
      horse.healthRecords.pull(req.params.testId);
    }
    if (horse.geneticTests) {
      horse.geneticTests.pull(req.params.testId);
    }
    await horse.save();

    res.json({ message: 'Test deleted' });
  } catch (error) {
    next(error);
  }
});

// Upload horse photo
router.post('/:id/photo', [
  hasPermission('horseManagement'),
  uploadImage.single('photo'),
  uploadToCloud('horses')
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    // Delete old photo if exists
    if (horse.photoUrl && horse.photoUrl.includes('storage.googleapis.com')) {
      await storageService.deleteFile(horse.photoUrl);
    }

    // Use cloud URL if available, otherwise fallback to local path
    const photoUrl = req.file.cloudUrl || `/uploads/${req.file.filename}`;

    horse.photoUrl = photoUrl;
    await horse.save();

    res.json({ photoUrl });
  } catch (error) {
    next(error);
  }
});

// Delete horse photo
router.delete('/:id/photo', [
  hasPermission('horseManagement')
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    // Delete from cloud storage if it's a GCS URL
    if (horse.photoUrl && horse.photoUrl.includes('storage.googleapis.com')) {
      await storageService.deleteFile(horse.photoUrl);
    }

    horse.photoUrl = null;
    await horse.save();

    res.json({ message: 'Photo deleted' });
  } catch (error) {
    next(error);
  }
});

// Get horse documents
router.get('/:id/documents', async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    res.json(horse.documents);
  } catch (error) {
    next(error);
  }
});

// Upload document
router.post('/:id/documents', [
  hasPermission('horseManagement'),
  uploadDocument.single('file'),
  uploadToCloud('documents')
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Use cloud URL if available, otherwise fallback to local path
    const fileUrl = req.file.cloudUrl || `/uploads/${req.file.filename}`;

    const document = {
      type: req.body.type || 'other',
      name: req.body.name || req.file.originalname,
      fileUrl: fileUrl,
      expirationDate: req.body.expirationDate,
      uploadedBy: req.userId
    };

    horse.documents.push(document);
    await horse.save();

    res.status(201).json(horse.documents[horse.documents.length - 1]);
  } catch (error) {
    next(error);
  }
});

// Delete document
router.delete('/:id/documents/:docId', [
  hasPermission('horseManagement')
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    // Find the document to get the URL before removing
    const doc = horse.documents.id(req.params.docId);
    if (doc && doc.fileUrl) {
      // Delete from cloud storage if it's a GCS URL
      if (doc.fileUrl.includes('storage.googleapis.com')) {
        await storageService.deleteFile(doc.fileUrl);
      }
    }

    horse.documents.pull(req.params.docId);
    await horse.save();

    res.json({ message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
});

// Get ride logs for horse
router.get('/:id/ride-logs', async (req, res, next) => {
  try {
    const { type, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {
      horseId: req.params.id,
      ...(type && { type }),
      ...(startDate && endDate && {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    };

    const rideLogs = await RideLog.find(filter)
      .populate('riderId', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RideLog.countDocuments(filter);

    res.json({
      rideLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get tasks assigned to horse
router.get('/:id/tasks', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {
      'horses.id': req.params.id,
      ...(status && { status })
    };

    const tasks = await Task.find(filter)
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get lessons assigned to horse
router.get('/:id/lessons', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {
      horseId: req.params.id,
      ...(status && { status })
    };

    const lessons = await Lesson.find(filter)
      .populate('clientId', 'name email')
      .populate('trainerId', 'name email')
      .sort({ scheduledDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Lesson.countDocuments(filter);

    res.json({
      lessons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Export horse profile
router.post('/:id/export', async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id)
      .populate('boarderId', 'name email');

    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    const rideStats = await RideLog.getStatsForHorse(horse._id);

    // Generate export content
    const exportData = {
      horse: {
        name: horse.name,
        breed: horse.breed?.label,
        color: horse.color,
        age: horse.calculatedAge,
        sexStatus: horse.sexStatus?.label,
        registeredName: horse.registeredName,
        usefNumber: horse.usefNumber,
        feiNumber: horse.feiNumber,
        strideNumber: horse.strideNumber
      },
      breeding: {
        sire: horse.sireName,
        dam: horse.damName,
        paternalGrandsire: horse.paternalGrandsireName,
        maternalGrandsire: horse.maternalGrandsireName
      },
      stats: rideStats,
      documents: horse.documents.map(d => ({
        type: d.type,
        name: d.name,
        expirationDate: d.expirationDate
      })),
      generatedAt: new Date()
    };

    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

// Delete horse (soft delete)
router.delete('/:id', [
  hasPermission('horseManagement'),
  param('id').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const { reason } = req.body;

    const horse = await Horse.findByIdAndUpdate(
      req.params.id,
      {
        deletedAt: new Date(),
        deletedBy: req.userId,
        deletionReason: reason
      },
      { new: true }
    );

    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    res.json({ message: 'Horse deleted' });
  } catch (error) {
    next(error);
  }
});

// Get breed options (static data)
router.get('/options/breeds', async (req, res) => {
  const breeds = [
    { value: 'thoroughbred', label: 'Thoroughbred' },
    { value: 'quarter_horse', label: 'Quarter Horse' },
    { value: 'arabian', label: 'Arabian' },
    { value: 'warmblood', label: 'Warmblood' },
    { value: 'paint', label: 'Paint' },
    { value: 'appaloosa', label: 'Appaloosa' },
    { value: 'morgan', label: 'Morgan' },
    { value: 'friesian', label: 'Friesian' },
    { value: 'andalusian', label: 'Andalusian' },
    { value: 'hanoverian', label: 'Hanoverian' },
    { value: 'dutch_warmblood', label: 'Dutch Warmblood' },
    { value: 'oldenburg', label: 'Oldenburg' },
    { value: 'saddlebred', label: 'American Saddlebred' },
    { value: 'standardbred', label: 'Standardbred' },
    { value: 'tennessee_walker', label: 'Tennessee Walking Horse' },
    { value: 'mustang', label: 'Mustang' },
    { value: 'draft', label: 'Draft Horse' },
    { value: 'pony', label: 'Pony' },
    { value: 'miniature', label: 'Miniature Horse' },
    { value: 'mixed', label: 'Mixed/Grade' },
    { value: 'other', label: 'Other' }
  ];
  res.json(breeds);
});

// Get sex status options
router.get('/options/sex-status', async (req, res) => {
  const sexStatuses = [
    { value: 'mare', label: 'Mare' },
    { value: 'stallion', label: 'Stallion' },
    { value: 'gelding', label: 'Gelding' },
    { value: 'colt', label: 'Colt' },
    { value: 'filly', label: 'Filly' }
  ];
  res.json(sexStatuses);
});

module.exports = router;

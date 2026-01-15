const express = require('express');
const { body, param, query } = require('express-validator');
const Horse = require('../models/Horse');
const RideLog = require('../models/RideLog');
const { authenticate, loadBarnContext, requireBarn, hasPermission, ownsResourceOrStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadDocument } = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);

// Get all horses in barn
router.get('/', requireBarn, async (req, res, next) => {
  try {
    const { status, boarderId, search, page = 1, limit = 50 } = req.query;

    const filter = {
      barnId: req.barnId,
      ...(status && { status }),
      ...(boarderId && { boarderId })
    };

    let horses = await Horse.find(filter)
      .populate('boarderId', 'name email')
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
      .populate('boarderId', 'name email avatarUrl');

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
    const horse = await Horse.create({
      ...req.body,
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
      name, age, birthday, breed, sexStatus, color, status, boarderId,
      usefNumber, feiNumber, registeredName,
      sireName, sireId, damName, damId,
      paternalGrandsireName, paternalGranddamName,
      maternalGrandsireName, maternalGranddamName,
      isStud, isBroodmare, colorGenetics
    } = req.body;

    const horse = await Horse.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(age !== undefined && { age }),
        ...(birthday !== undefined && { birthday }),
        ...(breed && { breed }),
        ...(sexStatus && { sexStatus }),
        ...(color !== undefined && { color }),
        ...(status && { status }),
        ...(boarderId !== undefined && { boarderId }),
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

// Add genetic test
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

    horse.geneticTests.push(req.body);
    await horse.save();

    res.json(horse.geneticTests);
  } catch (error) {
    next(error);
  }
});

// Update genetic test
router.put('/:id/genetics/:testId', [
  hasPermission('horseManagement'),
  validate
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    const test = horse.geneticTests.id(req.params.testId);
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

// Delete genetic test
router.delete('/:id/genetics/:testId', [
  hasPermission('horseManagement')
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    horse.geneticTests.pull(req.params.testId);
    await horse.save();

    res.json({ message: 'Test deleted' });
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
  uploadDocument.single('file')
], async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = {
      type: req.body.type || 'other',
      name: req.body.name || req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
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

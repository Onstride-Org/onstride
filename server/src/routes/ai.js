const express = require('express');
const { body, param } = require('express-validator');
const { BreedingSuggestion, SchedulingSuggestion, ScannedDocument, HorseWorkload } = require('../models/AI');
const Horse = require('../models/Horse');
const RideLog = require('../models/RideLog');
const Lesson = require('../models/Lesson');
const { authenticate, loadBarnContext, requireBarn, hasPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadDocument } = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);
router.use(loadBarnContext);

// ============ Breeding Analysis ============

// Analyze breeding compatibility
router.post('/breeding/analyze', [
  requireBarn,
  body('mareId').isMongoId(),
  body('stallionId').isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const { mareId, stallionId } = req.body;

    // Get horses
    const [mare, stallion] = await Promise.all([
      Horse.findById(mareId),
      Horse.findById(stallionId)
    ]);

    if (!mare || !stallion) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    // Verify mare/stallion status
    if (mare.sexStatus?.value !== 'mare' && !mare.isBroodmare) {
      return res.status(400).json({ error: 'Selected horse is not a mare' });
    }
    if (stallion.sexStatus?.value !== 'stallion' && !stallion.isStud) {
      return res.status(400).json({ error: 'Selected horse is not a stallion' });
    }

    // Perform analysis (simplified - would use AI/ML in production)
    const analysis = analyzeBreeding(mare, stallion);

    // Save suggestion
    const suggestion = await BreedingSuggestion.create({
      barnId: req.barnId,
      mareId,
      stallionId,
      mareName: mare.name,
      stallionName: stallion.name,
      mareBreed: mare.breed?.label,
      stallionBreed: stallion.breed?.label,
      ...analysis,
      createdById: req.userId
    });

    res.json(suggestion);
  } catch (error) {
    next(error);
  }
});

// Helper function for breeding analysis
function analyzeBreeding(mare, stallion) {
  const positiveFactors = [];
  const negativeFactors = [];
  const neutralFactors = [];
  const geneticWarnings = [];

  // Breed compatibility
  if (mare.breed?.value === stallion.breed?.value) {
    positiveFactors.push({
      category: 'Breed',
      description: 'Same breed pairing maintains breed characteristics',
      impact: 'Offspring will be purebred',
      severity: 'positive'
    });
  } else {
    neutralFactors.push({
      category: 'Breed',
      description: 'Crossbreed pairing',
      impact: 'Offspring may have mixed characteristics',
      severity: 'info'
    });
  }

  // Check for known genetic issues
  const mareTests = mare.geneticTests || [];
  const stallionTests = stallion.geneticTests || [];

  // Example genetic check (HYPP for Quarter Horses)
  const mareHYPP = mareTests.find(t => t.testName.toLowerCase().includes('hypp'));
  const stallionHYPP = stallionTests.find(t => t.testName.toLowerCase().includes('hypp'));

  if (mareHYPP?.result === 'N/H' && stallionHYPP?.result === 'N/H') {
    geneticWarnings.push({
      condition: 'HYPP',
      description: 'Both parents are carriers for Hyperkalemic Periodic Paralysis',
      riskLevel: 'high',
      mareStatus: 'Carrier (N/H)',
      stallionStatus: 'Carrier (N/H)',
      offspringProbabilities: {
        affected: 25,
        carrier: 50,
        clear: 25
      }
    });
  }

  // Calculate compatibility score
  let score = 75; // Base score
  score += positiveFactors.length * 5;
  score -= negativeFactors.length * 10;
  score -= geneticWarnings.filter(w => w.riskLevel === 'high').length * 15;
  score -= geneticWarnings.filter(w => w.riskLevel === 'critical').length * 25;
  score = Math.max(0, Math.min(100, score));

  // Color predictions (simplified)
  const colorPredictions = predictColors(mare.color, stallion.color, mare.colorGenetics, stallion.colorGenetics);

  return {
    overallCompatibilityScore: score,
    positiveFactors,
    negativeFactors,
    neutralFactors,
    offspringPrediction: {
      possibleColors: colorPredictions,
      estimatedHeightRange: { min: 15.0, max: 16.2 },
      disciplineSuitability: [
        { discipline: 'Dressage', suitabilityScore: 80 },
        { discipline: 'Hunter/Jumper', suitabilityScore: 75 },
        { discipline: 'Trail', suitabilityScore: 85 }
      ],
      temperamentTendencies: ['Athletic', 'Willing'],
      healthConsiderations: []
    },
    geneticWarnings
  };
}

function predictColors(mareColor, stallionColor, mareGenetics, stallionGenetics) {
  // Simplified color prediction
  const colors = [];

  if (mareColor === stallionColor) {
    colors.push({ color: mareColor, probability: 70 });
    colors.push({ color: 'Bay', probability: 20 });
    colors.push({ color: 'Other', probability: 10 });
  } else {
    colors.push({ color: mareColor, probability: 35 });
    colors.push({ color: stallionColor, probability: 35 });
    colors.push({ color: 'Bay', probability: 20 });
    colors.push({ color: 'Other', probability: 10 });
  }

  return colors;
}

// Get breeding suggestions
router.get('/breeding/suggestions', requireBarn, async (req, res, next) => {
  try {
    const { mareId, stallionId, reviewed } = req.query;

    const filter = {
      barnId: req.barnId,
      ...(mareId && { mareId }),
      ...(stallionId && { stallionId }),
      ...(reviewed !== undefined && { isReviewed: reviewed === 'true' })
    };

    const suggestions = await BreedingSuggestion.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(suggestions);
  } catch (error) {
    next(error);
  }
});

// Mark suggestion as reviewed
router.put('/breeding/suggestions/:id/review', async (req, res, next) => {
  try {
    const suggestion = await BreedingSuggestion.findByIdAndUpdate(
      req.params.id,
      {
        isReviewed: true,
        userNotes: req.body.notes
      },
      { new: true }
    );

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    res.json(suggestion);
  } catch (error) {
    next(error);
  }
});

// ============ Smart Scheduling ============

// Analyze scheduling
router.post('/scheduling/analyze', requireBarn, async (req, res, next) => {
  try {
    const suggestions = [];

    // Get all horses in barn
    const horses = await Horse.find({ barnId: req.barnId, status: 'active' });

    for (const horse of horses) {
      // Calculate workload
      const workload = await analyzeHorseWorkload(horse._id, horse.name, req.barnId);

      // Check if horse needs rest
      if (workload.needsRest) {
        suggestions.push({
          barnId: req.barnId,
          type: 'horseRest',
          priority: workload.status === 'overworked' ? 'high' : 'medium',
          title: `${horse.name} needs rest`,
          description: `${horse.name} has been ridden ${workload.ridesLast7Days} times in the last 7 days (${workload.totalMinutesLast7Days} minutes)`,
          horseId: horse._id,
          horseName: horse.name,
          confidence: 85
        });
      }
    }

    // Check for scheduling conflicts in next 7 days
    const upcomingLessons = await Lesson.find({
      barnId: req.barnId,
      status: { $in: ['approved', 'requested'] },
      scheduledDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }).populate('horseId', 'name');

    // Group by horse and time
    const lessonsByHorse = {};
    upcomingLessons.forEach(lesson => {
      if (lesson.horseId) {
        const key = lesson.horseId._id.toString();
        if (!lessonsByHorse[key]) {
          lessonsByHorse[key] = [];
        }
        lessonsByHorse[key].push(lesson);
      }
    });

    // Check for double-booking
    Object.entries(lessonsByHorse).forEach(([horseId, lessons]) => {
      lessons.sort((a, b) => a.scheduledDate - b.scheduledDate);
      for (let i = 0; i < lessons.length - 1; i++) {
        const current = lessons[i];
        const next = lessons[i + 1];
        const gap = (next.scheduledDate - current.scheduledDate) / (1000 * 60);

        if (gap < current.durationMinutes + 30) { // Less than duration + 30 min rest
          suggestions.push({
            barnId: req.barnId,
            type: 'conflictResolution',
            priority: 'high',
            title: 'Scheduling conflict detected',
            description: `${current.horseName || 'Horse'} has back-to-back lessons with insufficient rest`,
            horseId,
            lessonId: next._id,
            suggestedStartTime: new Date(current.scheduledDate.getTime() + (current.durationMinutes + 60) * 60 * 1000),
            confidence: 95
          });
        }
      }
    });

    // Save suggestions
    if (suggestions.length > 0) {
      await SchedulingSuggestion.insertMany(suggestions);
    }

    res.json(suggestions);
  } catch (error) {
    next(error);
  }
});

async function analyzeHorseWorkload(horseId, horseName, barnId) {
  const stats = await RideLog.getStatsForHorse(horseId);

  const avgDailyMinutes = stats.minutesThisWeek / 7;
  const recommendedMaxDaily = 120;

  let status = 'normal';
  if (avgDailyMinutes < 15) status = 'underworked';
  else if (avgDailyMinutes > recommendedMaxDaily * 0.8) status = 'heavy';
  else if (avgDailyMinutes > recommendedMaxDaily) status = 'overworked';

  const needsRest = stats.ridesThisWeek >= 6 || avgDailyMinutes > recommendedMaxDaily * 0.9;

  return {
    horseId,
    horseName,
    barnId,
    ridesLast7Days: stats.ridesThisWeek,
    totalMinutesLast7Days: stats.minutesThisWeek,
    avgDailyMinutes: Math.round(avgDailyMinutes),
    recommendedMaxDailyMinutes: recommendedMaxDaily,
    daysSinceRest: 0, // Would calculate from ride log gaps
    recommendedRestFrequency: 7,
    needsRest,
    status,
    lastCalculatedAt: new Date()
  };
}

// Get scheduling suggestions
router.get('/scheduling/suggestions', requireBarn, async (req, res, next) => {
  try {
    const { type, resolved, priority } = req.query;

    const filter = {
      barnId: req.barnId,
      ...(type && { type }),
      ...(resolved !== undefined && { isResolved: resolved === 'true' }),
      ...(priority && { priority })
    };

    const suggestions = await SchedulingSuggestion.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .limit(50);

    res.json(suggestions);
  } catch (error) {
    next(error);
  }
});

// Resolve suggestion
router.put('/scheduling/suggestions/:id/resolve', async (req, res, next) => {
  try {
    const suggestion = await SchedulingSuggestion.findByIdAndUpdate(
      req.params.id,
      {
        isResolved: true,
        resolution: req.body.resolution,
        resolvedById: req.userId,
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    res.json(suggestion);
  } catch (error) {
    next(error);
  }
});

// Get horse workload
router.get('/workload/:horseId', async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.horseId);
    if (!horse) {
      return res.status(404).json({ error: 'Horse not found' });
    }

    const workload = await analyzeHorseWorkload(horse._id, horse.name, horse.barnId);

    // Cache the result
    await HorseWorkload.findOneAndUpdate(
      { horseId: horse._id },
      workload,
      { upsert: true }
    );

    res.json(workload);
  } catch (error) {
    next(error);
  }
});

// ============ Document Scanning ============

// Upload document for scanning
router.post('/documents/scan', [
  requireBarn,
  uploadDocument.single('file')
], async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const scannedDoc = await ScannedDocument.create({
      barnId: req.barnId,
      uploadedBy: req.userId,
      originalFileUrl: `/uploads/${req.file.filename}`,
      status: 'pending'
    });

    // In production, this would trigger OCR processing
    // For now, simulate processing
    setTimeout(async () => {
      try {
        await ScannedDocument.findByIdAndUpdate(scannedDoc._id, {
          status: 'needsReview',
          detectedType: 'coggins',
          detectedTypeConfidence: 85,
          extractedText: 'Sample extracted text from document...',
          extractedHorseName: 'Unknown Horse',
          extractedDate: new Date(),
          extractedExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });
      } catch (e) {
        console.error('OCR processing error:', e);
      }
    }, 2000);

    res.status(201).json(scannedDoc);
  } catch (error) {
    next(error);
  }
});

// Get scanned document status
router.get('/documents/:id/status', async (req, res, next) => {
  try {
    const doc = await ScannedDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

// Confirm scanned document
router.post('/documents/:id/confirm', [
  body('confirmedType').optional(),
  body('confirmedHorseId').optional().isMongoId(),
  validate
], async (req, res, next) => {
  try {
    const { confirmedType, confirmedHorseId, corrections } = req.body;

    const doc = await ScannedDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    doc.userConfirmedType = confirmedType || doc.detectedType;
    if (confirmedHorseId) {
      doc.confirmedHorseId = confirmedHorseId;
      doc.userConfirmedHorse = true;
    }
    if (corrections) {
      Object.assign(doc, corrections);
    }
    doc.status = 'completed';

    // Create actual document record if horse confirmed
    if (doc.confirmedHorseId) {
      const horse = await Horse.findById(doc.confirmedHorseId);
      if (horse) {
        horse.documents.push({
          type: doc.userConfirmedType,
          name: `Scanned ${doc.userConfirmedType}`,
          fileUrl: doc.originalFileUrl,
          expirationDate: doc.extractedExpirationDate,
          uploadedBy: doc.uploadedBy
        });
        await horse.save();
        doc.createdDocumentId = horse.documents[horse.documents.length - 1]._id;
      }
    }

    await doc.save();

    res.json(doc);
  } catch (error) {
    next(error);
  }
});

// Get all scanned documents
router.get('/documents', requireBarn, async (req, res, next) => {
  try {
    const { status } = req.query;

    const docs = await ScannedDocument.find({
      barnId: req.barnId,
      ...(status && { status })
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(docs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

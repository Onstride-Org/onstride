const mongoose = require('mongoose');

const stallSchema = new mongoose.Schema({
  stallId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  horse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Horse',
    default: null,
  },
  row: {
    type: Number,
    required: true,
  },
  column: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
    default: 'available',
  },
  notes: String,
});

const stableSchema = new mongoose.Schema(
  {
    barn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barn',
      required: true,
    },
    name: {
      type: String,
      required: true,
      default: 'Main Stable',
    },
    layout: {
      type: String,
      enum: ['l-shape', 'circular', 'aisles'],
      required: true,
    },
    totalStalls: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    stallsPerRow: {
      type: Number,
      default: 4,
    },
    stalls: [stallSchema],
    isConfigured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick barn lookup
stableSchema.index({ barn: 1 });

// Generate stalls based on layout
stableSchema.methods.generateStalls = function () {
  const stalls = [];
  const { layout, totalStalls, stallsPerRow } = this;

  if (layout === 'aisles') {
    // With Aisles: rows of stalls with aisles between
    const rows = Math.ceil(totalStalls / stallsPerRow);
    let stallCount = 0;

    for (let row = 0; row < rows && stallCount < totalStalls; row++) {
      const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
      for (let col = 0; col < stallsPerRow && stallCount < totalStalls; col++) {
        stalls.push({
          stallId: `${rowLetter}-${col + 1}`,
          label: `${rowLetter}-${col + 1}`,
          row: row,
          column: col,
          status: 'available',
        });
        stallCount++;
      }
    }
  } else if (layout === 'l-shape') {
    // L-Shape: vertical column + horizontal row at bottom
    const verticalCount = Math.ceil(totalStalls * 0.6);
    const horizontalCount = totalStalls - verticalCount;
    let stallCount = 0;

    // Vertical part (A-1, B-1, C-1, etc.)
    for (let row = 0; row < verticalCount; row++) {
      const rowLetter = String.fromCharCode(65 + row);
      stalls.push({
        stallId: `${rowLetter}-1`,
        label: `${rowLetter}-1`,
        row: row,
        column: 0,
        status: 'available',
      });
      stallCount++;
    }

    // Horizontal part at bottom (F-1, F-2, F-3, F-4)
    const lastRowLetter = String.fromCharCode(65 + verticalCount - 1);
    for (let col = 1; col < horizontalCount + 1 && stallCount < totalStalls; col++) {
      stalls.push({
        stallId: `${lastRowLetter}-${col + 1}`,
        label: `${lastRowLetter}-${col + 1}`,
        row: verticalCount - 1,
        column: col,
        status: 'available',
      });
      stallCount++;
    }
  } else if (layout === 'circular') {
    // Circular: stalls arranged in a circle
    for (let i = 0; i < totalStalls; i++) {
      stalls.push({
        stallId: `S-${i + 1}`,
        label: `Stall ${i + 1}`,
        row: 0,
        column: i,
        status: 'available',
      });
    }
  }

  this.stalls = stalls;
  return stalls;
};

// Virtual for occupied count
stableSchema.virtual('occupiedCount').get(function () {
  return this.stalls.filter((s) => s.horse).length;
});

// Virtual for available count
stableSchema.virtual('availableCount').get(function () {
  return this.stalls.filter((s) => !s.horse && s.status === 'available').length;
});

stableSchema.set('toJSON', { virtuals: true });
stableSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Stable', stableSchema);

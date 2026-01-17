const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const storageService = require('../services/storage');

// Use memory storage for GCS uploads, disk storage as fallback
const useCloudStorage = storageService.isConfigured();

// Memory storage for cloud uploads
const memoryStorage = multer.memoryStorage();

// Disk storage for local fallback
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// Select storage based on configuration
const storage = useCloudStorage ? memoryStorage : diskStorage;

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Image filter
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Document filter
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid document type'), false);
  }
};

// Create multer instances
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for images
  }
});

const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB for documents
  }
});

/**
 * Middleware to handle file upload to GCS after multer processes the file
 * Use this after multer's single/array middleware
 * @param {string} folder - Folder in GCS bucket
 */
const uploadToCloud = (folder = 'uploads') => {
  return async (req, res, next) => {
    try {
      // If GCS is not configured, use local path
      if (!storageService.isConfigured()) {
        if (req.file) {
          req.file.cloudUrl = `/uploads/${req.file.filename}`;
        }
        if (req.files && Array.isArray(req.files)) {
          req.files.forEach(file => {
            file.cloudUrl = `/uploads/${file.filename}`;
          });
        }
        return next();
      }

      // Upload single file
      if (req.file && req.file.buffer) {
        const result = await storageService.uploadFromMulter(req.file, folder);
        req.file.cloudUrl = result.url;
        req.file.cloudFilename = result.filename;
      }

      // Upload multiple files
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          if (file.buffer) {
            const result = await storageService.uploadFromMulter(file, folder);
            file.cloudUrl = result.url;
            file.cloudFilename = result.filename;
          }
        }
      }

      next();
    } catch (error) {
      console.error('Cloud upload error:', error);
      next(error);
    }
  };
};

/**
 * Combined middleware for document upload with automatic GCS upload
 */
const uploadDocumentToCloud = (folder = 'documents') => {
  return [
    uploadDocument.single('file'),
    uploadToCloud(folder)
  ];
};

/**
 * Combined middleware for image upload with automatic GCS upload
 */
const uploadImageToCloud = (folder = 'images') => {
  return [
    uploadImage.single('file'),
    uploadToCloud(folder)
  ];
};

module.exports = {
  upload,
  uploadImage,
  uploadDocument,
  uploadToCloud,
  uploadDocumentToCloud,
  uploadImageToCloud,
  useCloudStorage
};

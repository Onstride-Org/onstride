const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize Google Cloud Storage
let storage;
let bucket;

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'onstride-storage';

// Check if GCS is configured
const isConfigured = () => {
  const configured = !!(
    process.env.GCS_PROJECT_ID &&
    process.env.GCS_CLIENT_EMAIL &&
    process.env.GCS_PRIVATE_KEY
  );

  if (!configured) {
    console.log('GCS config check - Missing:', {
      hasProjectId: !!process.env.GCS_PROJECT_ID,
      hasClientEmail: !!process.env.GCS_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GCS_PRIVATE_KEY
    });
  }

  return configured;
};

// Initialize storage client
const initStorage = () => {
  if (storage) return storage;

  if (!isConfigured()) {
    console.log('Google Cloud Storage not configured. Using local storage fallback.');
    return null;
  }

  try {
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });

    bucket = storage.bucket(BUCKET_NAME);
    console.log(`Google Cloud Storage initialized with bucket: ${BUCKET_NAME}`);
    return storage;
  } catch (error) {
    console.error('Failed to initialize Google Cloud Storage:', error);
    return null;
  }
};

/**
 * Upload a file to Google Cloud Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalFilename - Original filename for extension
 * @param {string} mimetype - File MIME type
 * @param {string} folder - Folder/prefix in bucket (e.g., 'documents', 'images')
 * @returns {Promise<{url: string, filename: string}>}
 */
const uploadFile = async (fileBuffer, originalFilename, mimetype, folder = 'uploads') => {
  initStorage();

  if (!bucket) {
    throw new Error('Google Cloud Storage not configured. Check GCS_PROJECT_ID, GCS_CLIENT_EMAIL, GCS_PRIVATE_KEY, and GCS_BUCKET_NAME environment variables.');
  }

  const ext = path.extname(originalFilename);
  const filename = `${folder}/${uuidv4()}${ext}`;

  const file = bucket.file(filename);

  try {
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimetype,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
      resumable: false,
    });

    // Make file publicly readable
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;

    return {
      url: publicUrl,
      filename: filename,
      bucket: BUCKET_NAME,
    };
  } catch (error) {
    console.error('GCS upload error:', error.message);
    console.error('Bucket:', BUCKET_NAME);
    console.error('Filename:', filename);
    throw new Error(`Failed to upload file to cloud storage: ${error.message}`);
  }
};

/**
 * Upload a file from multer's memory storage
 * @param {object} file - Multer file object with buffer
 * @param {string} folder - Folder/prefix in bucket
 * @returns {Promise<{url: string, filename: string}>}
 */
const uploadFromMulter = async (file, folder = 'uploads') => {
  if (!file || !file.buffer) {
    throw new Error('No file buffer provided');
  }

  return uploadFile(file.buffer, file.originalname, file.mimetype, folder);
};

/**
 * Delete a file from Google Cloud Storage
 * @param {string} fileUrl - The public URL or filename of the file
 * @returns {Promise<boolean>}
 */
const deleteFile = async (fileUrl) => {
  initStorage();

  if (!bucket) {
    console.warn('Google Cloud Storage not configured, cannot delete file');
    return false;
  }

  try {
    // Extract filename from URL if full URL is provided
    let filename = fileUrl;
    if (fileUrl.includes('storage.googleapis.com')) {
      filename = fileUrl.split(`${BUCKET_NAME}/`)[1];
    }

    if (!filename) {
      console.warn('Could not extract filename from URL:', fileUrl);
      return false;
    }

    await bucket.file(filename).delete();
    return true;
  } catch (error) {
    console.error('Failed to delete file from GCS:', error);
    return false;
  }
};

/**
 * Generate a signed URL for temporary access
 * @param {string} filename - The filename in the bucket
 * @param {number} expiresInMinutes - URL expiration time in minutes
 * @returns {Promise<string>}
 */
const getSignedUrl = async (filename, expiresInMinutes = 60) => {
  initStorage();

  if (!bucket) {
    throw new Error('Google Cloud Storage not configured');
  }

  const [url] = await bucket.file(filename).getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
};

/**
 * Check if a file exists in the bucket
 * @param {string} filename - The filename to check
 * @returns {Promise<boolean>}
 */
const fileExists = async (filename) => {
  initStorage();

  if (!bucket) {
    return false;
  }

  try {
    const [exists] = await bucket.file(filename).exists();
    return exists;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
};

/**
 * Copy a file within the bucket
 * @param {string} sourceFilename - Source file path
 * @param {string} destFilename - Destination file path
 * @returns {Promise<string>} - New file URL
 */
const copyFile = async (sourceFilename, destFilename) => {
  initStorage();

  if (!bucket) {
    throw new Error('Google Cloud Storage not configured');
  }

  await bucket.file(sourceFilename).copy(bucket.file(destFilename));
  await bucket.file(destFilename).makePublic();

  return `https://storage.googleapis.com/${BUCKET_NAME}/${destFilename}`;
};

module.exports = {
  isConfigured,
  initStorage,
  uploadFile,
  uploadFromMulter,
  deleteFile,
  getSignedUrl,
  fileExists,
  copyFile,
  BUCKET_NAME,
};

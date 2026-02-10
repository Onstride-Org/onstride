/**
 * DocuSeal API Service
 *
 * Handles merchant application PDF templates and submissions.
 * API Docs: https://www.docuseal.com/docs/api
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const DOCUSEAL_API_URL = process.env.DOCUSEAL_API_URL || 'https://api.docuseal.co';
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;
const WINDCAVE_APPLICATION_EMAIL = 'admin@onstrideapp.com';

const api = axios.create({
  baseURL: DOCUSEAL_API_URL,
  headers: {
    'X-Auth-Token': DOCUSEAL_API_KEY,
    'Content-Type': 'application/json',
  },
});

/**
 * Check if DocuSeal is configured
 */
const isConfigured = () => {
  return !!DOCUSEAL_API_KEY;
};

// ─── Templates ────────────────────────────────────────────

/**
 * List all templates
 */
const listTemplates = async () => {
  const response = await api.get('/templates');
  // DocuSeal wraps list results in { data: [...] }
  return response.data?.data || response.data || [];
};

/**
 * Get a single template by ID
 */
const getTemplate = async (templateId) => {
  const response = await api.get(`/templates/${templateId}`);
  return response.data;
};

/**
 * Create a template from a PDF file (base64 or URL)
 * @param {string} name - Template name
 * @param {string} fileBase64 - Base64-encoded PDF content
 */
const createTemplateFromPdf = async (name, fileBase64) => {
  // DocuSeal API expects base64 with data URI prefix
  const base64WithPrefix = fileBase64.startsWith('data:')
    ? fileBase64
    : `data:application/pdf;base64,${fileBase64}`;

  const response = await api.post('/templates', {
    name,
    documents: [
      {
        name: `${name}.pdf`,
        file: base64WithPrefix,
      },
    ],
  });
  return response.data;
};

/**
 * Create a template from a PDF URL
 * @param {string} name - Template name
 * @param {string} url - URL to the PDF file
 */
const createTemplateFromUrl = async (name, url) => {
  const response = await api.post('/templates', {
    name,
    documents: [
      {
        name: `${name}.pdf`,
        url,
      },
    ],
  });
  return response.data;
};

/**
 * Delete (archive) a template
 */
const deleteTemplate = async (templateId) => {
  const response = await api.delete(`/templates/${templateId}`);
  return response.data;
};

// ─── Submissions ──────────────────────────────────────────

/**
 * Create a submission for a user to fill out a template.
 * The completed document will also be sent to the Windcave application email.
 *
 * @param {Object} options
 * @param {number} options.templateId - DocuSeal template ID
 * @param {string} options.email - Submitter's email
 * @param {string} options.name - Submitter's name
 * @param {string} [options.role] - Role name (default: first role on template)
 * @param {string} [options.completedRedirectUrl] - URL to redirect after completion
 * @param {Object} [options.prefillData] - Pre-filled field values { fieldName: value }
 * @returns {Object} Submission data with submitter slugs
 */
const createSubmission = async (options) => {
  const {
    templateId,
    email,
    name,
    role,
    completedRedirectUrl,
    prefillData,
  } = options;

  const submitters = [
    {
      ...(role && { role }),
      email,
      name,
      ...(completedRedirectUrl && { completed_redirect_url: completedRedirectUrl }),
      ...(prefillData && { values: prefillData }),
    },
  ];

  const payload = {
    template_id: templateId,
    send_email: true,
    submitters,
  };

  const response = await api.post('/submissions', payload);
  return response.data;
};

/**
 * Get a submission by ID
 */
const getSubmission = async (submissionId) => {
  const response = await api.get(`/submissions/${submissionId}`);
  return response.data;
};

/**
 * List submissions, optionally filtered by template
 */
const listSubmissions = async (templateId = null, limit = 50) => {
  const params = { limit };
  if (templateId) params.template_id = templateId;
  const response = await api.get('/submissions', { params });
  return response.data?.data || response.data || [];
};

/**
 * Get the embed URL for a submitter to fill out their form
 * @param {string} slug - Submitter slug from submission creation
 */
const getFormEmbedUrl = (slug) => {
  return `https://docuseal.co/d/${slug}`;
};

/**
 * Get the Windcave application email recipient
 */
const getApplicationRecipientEmail = () => {
  return WINDCAVE_APPLICATION_EMAIL;
};

/**
 * Generate a JWT token for the DocuSeal embedded builder
 * @param {number} templateId - The template ID to edit
 * @returns {string} JWT token for the builder
 */
const generateBuilderToken = (templateId) => {
  if (!DOCUSEAL_API_KEY) return null;

  const payload = {
    template_id: templateId,
    // Token expires in 1 hour
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  // DocuSeal uses the API key as the JWT secret
  return jwt.sign(payload, DOCUSEAL_API_KEY);
};

module.exports = {
  isConfigured,
  listTemplates,
  getTemplate,
  createTemplateFromPdf,
  createTemplateFromUrl,
  deleteTemplate,
  createSubmission,
  getSubmission,
  listSubmissions,
  getFormEmbedUrl,
  getApplicationRecipientEmail,
  generateBuilderToken,
};

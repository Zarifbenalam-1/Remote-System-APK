const Joi = require('joi');

const deviceRegistrationSchema = Joi.object({
  deviceId: Joi.string().alphanum().min(3).max(50).required(),
  name: Joi.string().min(1).max(100).required(),
  model: Joi.string().max(100).optional(),
  androidVersion: Joi.string().max(20).optional(),
  ipAddress: Joi.string().ip().optional(),
  token: Joi.string().required(),
  capabilities: Joi.array().items(Joi.string().valid(
    'screen_capture', 'camera', 'microphone', 'gps', 
    'sms', 'files', 'apps', 'notifications'
  )).optional()
});

const clientRegistrationSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  token: Joi.string().required(),
  type: Joi.string().valid('windows', 'web', 'mobile').default('windows')
});

const commandSchema = Joi.object({
  deviceId: Joi.string().required(),
  command: Joi.object({
    action: Joi.string().valid(
      'get_screen', 'get_camera', 'get_location', 'get_sms',
      'file_manager', 'app_list', 'send_notification', 'get_device_info'
    ).required(),
    params: Joi.object().optional()
  }).required()
});

const fileUploadSchema = Joi.object({
  originalname: Joi.string().required(),
  mimetype: Joi.string().required(),
  size: Joi.number().max(50 * 1024 * 1024).required() // 50MB
});

const validateDeviceRegistration = (req, res, next) => {
  const { error, value } = deviceRegistrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  req.validatedData = value;
  next();
};

const validateClientRegistration = (req, res, next) => {
  const { error, value } = clientRegistrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  req.validatedData = value;
  next();
};

const validateCommand = (data) => {
  const { error, value } = commandSchema.validate(data);
  return { error, value };
};

const validateFileUpload = (file) => {
  const { error, value } = fileUploadSchema.validate(file);
  return { error, value };
};

// Sanitize input strings
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim();
};

// Sanitize object recursively
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

module.exports = {
  validateDeviceRegistration,
  validateClientRegistration,
  validateCommand,
  validateFileUpload,
  sanitizeString,
  sanitizeObject
};

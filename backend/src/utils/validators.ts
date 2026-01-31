import Joi from 'joi';

// URL validation schema
export const urlSchema = Joi.object({
  url: Joi.string()
    .uri({
      scheme: ['http', 'https'],
    })
    .required()
    .messages({
      'string.uri': 'Please provide a valid HTTP or HTTPS URL',
      'any.required': 'URL is required',
    }),
});

// Scrape request validation
export const scrapeRequestSchema = Joi.object({
  url: Joi.string()
    .uri({
      scheme: ['http', 'https'],
    })
    .required(),
  waitForSelector: Joi.string().optional(),
  timeout: Joi.number().min(5000).max(60000).optional().default(30000),
  userAgent: Joi.string().optional(),
});

// Component generation validation
export const generateComponentSchema = Joi.object({
  html: Joi.string().required().min(10).max(500000),
  css: Joi.string().optional().allow('').max(100000),
  sectionType: Joi.string()
    .valid('hero', 'pricing', 'features', 'testimonials', 'footer', 'navbar', 'cta', 'other')
    .optional(),
  componentName: Joi.string()
    .pattern(/^[A-Z][a-zA-Z0-9]*$/)
    .optional()
    .messages({
      'string.pattern.base': 'Component name must be in PascalCase',
    }),
  requirements: Joi.string().optional().max(1000),
});

// Refinement request validation
export const refineComponentSchema = Joi.object({
  code: Joi.string().required().min(10).max(100000),
  instruction: Joi.string().required().min(3).max(1000),
  componentName: Joi.string()
    .pattern(/^[A-Z][a-zA-Z0-9]*$/)
    .optional(),
});

// Validate data against schema
export const validate = <T>(schema: Joi.Schema, data: unknown): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    throw new Error(message);
  }

  return value as T;
};
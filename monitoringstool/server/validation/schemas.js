import Joi from 'joi';

// Question validation schema
export const questionSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.max': 'Title must be less than 255 characters',
      'any.required': 'Title is required'
    }),
    
  description: Joi.string()
    .trim()
    .max(5000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must be less than 5000 characters'
    }),
    
  category: Joi.string()
    .trim()
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Category must be less than 100 characters',
      'string.pattern.base': 'Category contains invalid characters'
    }),
    
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .messages({
      'any.only': 'Priority must be low, medium, or high'
    }),
    
  status: Joi.string()
    .valid('active', 'inactive', 'archived')
    .default('active')
    .messages({
      'any.only': 'Status must be active, inactive, or archived'
    }),
    
  mode: Joi.string()
    .valid('regular', 'ouder_kind')
    .default('regular')
    .messages({
      'any.only': 'Mode must be regular or ouder_kind'
    }),
    
  created_by: Joi.string()
    .trim()
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_.@]+$/)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Created by must be less than 100 characters',
      'string.pattern.base': 'Created by contains invalid characters'
    })
});

// Question update schema (all fields optional except UUID)
export const questionUpdateSchema = Joi.object({
  uuid: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Invalid UUID format',
      'any.required': 'UUID is required'
    }),
    
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Title cannot be empty',
      'string.max': 'Title must be less than 255 characters'
    }),
    
  description: Joi.string()
    .trim()
    .max(5000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must be less than 5000 characters'
    }),
    
  category: Joi.string()
    .trim()
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Category must be less than 100 characters',
      'string.pattern.base': 'Category contains invalid characters'
    }),
    
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': 'Priority must be low, medium, or high'
    }),
    
  status: Joi.string()
    .valid('active', 'inactive', 'archived')
    .optional()
    .messages({
      'any.only': 'Status must be active, inactive, or archived'
    })
});

// UUID parameter schema
export const uuidParamSchema = Joi.object({
  uuid: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Invalid UUID format',
      'any.required': 'UUID is required'
    })
});

// Query parameters schema for listing questions
export const questionsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
    
  category: Joi.string()
    .trim()
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .optional()
    .messages({
      'string.max': 'Category must be less than 100 characters',
      'string.pattern.base': 'Category contains invalid characters'
    }),
    
  status: Joi.string()
    .valid('active', 'inactive', 'archived')
    .optional()
    .messages({
      'any.only': 'Status must be active, inactive, or archived'
    }),
    
  mode: Joi.string()
    .valid('regular', 'ouder_kind')
    .optional()
    .messages({
      'any.only': 'Mode must be regular or ouder_kind'
    }),
    
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': 'Priority must be low, medium, or high'
    }),
    
  search: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_.]+$/)
    .optional()
    .messages({
      'string.min': 'Search term must be at least 3 characters',
      'string.max': 'Search term must be less than 100 characters',
      'string.pattern.base': 'Search term contains invalid characters'
    }),
    
  sortBy: Joi.string()
    .valid('created_at', 'updated_at', 'title', 'priority')
    .default('created_at')
    .messages({
      'any.only': 'Sort by must be created_at, updated_at, title, or priority'
    }),
    
  sortOrder: Joi.string()
    .valid('ASC', 'DESC')
    .default('ASC')
    .messages({
      'any.only': 'Sort order must be ASC or DESC'
    })
});

// Responses list query schema
export const responsesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  question_uuid: Joi.string().uuid().optional(),
});

// Response validation schema for question responses
export const questionResponseSchema = Joi.object({
  question_uuid: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Invalid question UUID format',
      'any.required': 'Question UUID is required'
    }),
    
  response_data: Joi.object()
    .required()
    .messages({
      'any.required': 'Response data is required'
    }),
    
  user_identifier: Joi.string()
    .trim()
    .max(255)
    .pattern(/^[a-zA-Z0-9\s\-_.@]+$/)
    .optional()
    .messages({
      'string.max': 'User identifier must be less than 255 characters',
      'string.pattern.base': 'User identifier contains invalid characters'
    })
});

// Batch responses schema - AANGEPAST MET LOCATION
export const batchQuestionResponsesSchema = Joi.object({
  responses: Joi.array().items(questionResponseSchema).min(1).required(),
  survey_type: Joi.string()
    .valid('regular', 'ouder_kind')
    .default('regular')
    .messages({
      'any.only': 'Survey type must be regular or ouder_kind'
    }),
  location: Joi.string()
    .valid('Zaanstad', 'Veenhuizen', 'Almelo')
    .required()
    .messages({
      'any.only': 'Selecteer een geldige locatie (Zaanstad, Veenhuizen of Almelo)',
      'any.required': 'Locatie is verplicht'
    }),
});

// Validation middleware factory
export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    req.body = value;
    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Parameter validation failed',
        details: errors
      });
    }
    
    req.params = value;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Query validation failed',
        details: errors
      });
    }
    
    req.query = value;
    next();
  };
}
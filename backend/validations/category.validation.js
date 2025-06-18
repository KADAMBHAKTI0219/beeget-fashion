const Joi = require('joi');
const mongoose = require('mongoose');

// Custom validation for MongoDB ObjectId
const objectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

// Category validation schema
const categorySchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .trim()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least {#limit} characters long',
            'string.max': 'Name cannot exceed {#limit} characters'
        }),

    description: Joi.string()
        .max(500)
        .allow('')
        .trim()
        .messages({
            'string.max': 'Description cannot exceed {#limit} characters'
        }),

    image: Joi.string()
        .uri()
        .allow('')
        .messages({
            'string.uri': 'Image must be a valid URL'
        }),

    active: Joi.boolean()
        .default(true),

    order: Joi.number()
        .integer()
        .min(0)
        .default(0)
        .messages({
            'number.base': 'Order must be a number',
            'number.min': 'Order cannot be negative'
        }),

    parent: Joi.string()
        .custom(objectId)
        .allow(null)
        .messages({
            'string.pattern.name': 'Invalid parent category ID format'
        })
});

// Middleware to validate category
exports.validateCategory = (req, res, next) => {
    const { error } = categorySchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errors = error.details.map(detail => ({
            field: detail.path[0],
            message: detail.message
        }));
        
        return res.status(400).json({
            success: false,
            errors
        });
    }

    next();
};
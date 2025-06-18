const Joi = require('joi');

// Collection validation schema
const collectionSchema = Joi.object({
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

    startDate: Joi.date()
        .default(Date.now)
        .messages({
            'date.base': 'Start date must be a valid date'
        }),

    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .allow(null)
        .messages({
            'date.base': 'End date must be a valid date',
            'date.min': 'End date must be after start date'
        })
});

// Middleware to validate collection
exports.validateCollection = (req, res, next) => {
    const { error } = collectionSchema.validate(req.body, { abortEarly: false });
    
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
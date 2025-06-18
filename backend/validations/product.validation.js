const Joi = require('joi');
const mongoose = require('mongoose');

// Custom validation for MongoDB ObjectId
const objectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

// Product validation schema
const productSchema = Joi.object({
    title: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .messages({
            'string.empty': 'Title is required',
            'string.min': 'Title must be at least {#limit} characters long',
            'string.max': 'Title cannot exceed {#limit} characters'
        }),

    description: Joi.string()
        .min(10)
        .trim()
        .messages({
            'string.empty': 'Description is required',
            'string.min': 'Description must be at least {#limit} characters long'
        }),

    images: Joi.array()
        .items(Joi.string().uri())
        .messages({
            'array.base': 'Images must be an array',
            'string.uri': 'Image must be a valid URL'
        }),

    price: Joi.number()
        .min(0)
        .messages({
            'number.base': 'Price must be a number',
            'number.min': 'Price cannot be negative'
        }),

    salePrice: Joi.number()
        .min(0)
        .max(Joi.ref('price'))
        .messages({
            'number.base': 'Sale price must be a number',
            'number.min': 'Sale price cannot be negative',
            'number.max': 'Sale price must be less than or equal to regular price'
        }),

    categories: Joi.array()
        .items(Joi.string().custom(objectId))
        .messages({
            'array.base': 'Categories must be an array',
            'any.invalid': 'Invalid category ID'
        }),

    collections: Joi.array()
        .items(Joi.string().custom(objectId))
        .messages({
            'array.base': 'Collections must be an array',
            'any.invalid': 'Invalid collection ID'
        }),

    tags: Joi.array()
        .items(Joi.string().trim())
        .messages({
            'array.base': 'Tags must be an array'
        }),

    inventoryCount: Joi.number()
        .min(0)
        .messages({
            'number.base': 'Inventory count must be a number',
            'number.min': 'Inventory count cannot be negative'
        })
});

module.exports = {
    validateProduct: (req, res, next) => {
        const { error } = productSchema.validate(req.body, {
            abortEarly: false,
            allowUnknown: true
        });

        if (error) {
            const errorMessages = error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                errors: errorMessages
            });
        }

        next();
    }
};

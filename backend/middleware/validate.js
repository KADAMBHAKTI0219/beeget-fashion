const mongoose = require('mongoose');

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true
        });

        if (error) {
            const errorMessages = error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message
            }));

            return res.status(400).json({
                message: 'Validation error',
                errors: errorMessages
            });
        }

        next();
    };
};

const validateObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

module.exports = {
    validateRequest,
    validateObjectId
};
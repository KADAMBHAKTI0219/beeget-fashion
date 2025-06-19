const Contact = require('../models/contact.model');

// Create new contact message
exports.createContact = async (req, res) => {
    try {
        // Add IP and user agent info
        const contactData = {
            ...req.body,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        };

        const contact = new Contact(contactData);
        await contact.save();

        // TODO: Send email notification to admin

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon.'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all contact messages (admin only)
exports.getContacts = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

        // Build query
        const query = {};
        if (status) query.status = status;

        // Count total documents
        const total = await Contact.countDocuments(query);

        // Execute query with pagination and sorting
        const contacts = await Contact.find(query)
            .populate('assignedTo', 'name email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: contacts,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get single contact message (admin only)
exports.getContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id)
            .populate('assignedTo', 'name email');

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contact message not found'
            });
        }

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update contact message status (admin only)
exports.updateContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            {
                status: req.body.status,
                assignedTo: req.body.assignedTo,
                responseMessage: req.body.responseMessage,
                responseDate: req.body.responseMessage ? Date.now() : undefined
            },
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name email');

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contact message not found'
            });
        }

        // TODO: Send email notification if status changed to 'replied'

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete contact message (admin only)
exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contact message not found'
            });
        }

        res.json({
            success: true,
            message: 'Contact message deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
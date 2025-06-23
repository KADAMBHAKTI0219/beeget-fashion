const Contact = require('../models/contact.model');
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

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

        // Send email notification to admin
        try {
            await transporter.sendMail({
                from: `"${process.env.FROM_EMAIL || 'Beeget Fashion'}" <${process.env.SMTP_USER}>`,
                to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
                subject: `New Contact Form Submission: ${contactData.subject}`,
                html: `
                    <h2>New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${contactData.name}</p>
                    <p><strong>Email:</strong> ${contactData.email}</p>
                    <p><strong>Subject:</strong> ${contactData.subject}</p>
                    <p><strong>Message:</strong></p>
                    <p>${contactData.message.replace(/\n/g, '<br>')}</p>
                    <hr>
                    <p><small>Submitted on: ${new Date().toLocaleString()}</small></p>
                    <p><small>IP Address: ${contactData.ipAddress}</small></p>
                `
            });
            console.log('Contact form notification email sent to admin');
        } catch (emailError) {
            console.error('Failed to send admin notification email:', emailError);
            // Continue execution even if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon.'
        });
    } catch (error) {
        console.error('Contact form submission error:', error);
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
        // Get the contact before update to check if status is changing
        const previousContact = await Contact.findById(req.params.id);
        if (!previousContact) {
            return res.status(404).json({
                success: false,
                error: 'Contact message not found'
            });
        }

        // Update the contact
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

        // Send email notification if status changed to 'replied' and there's a response message
        if (req.body.status === 'replied' && 
            previousContact.status !== 'replied' && 
            req.body.responseMessage) {
            
            try {
                await transporter.sendMail({
                    from: `"${process.env.FROM_EMAIL || 'Beeget Fashion'}" <${process.env.SMTP_USER}>`,
                    to: contact.email,
                    subject: `Re: ${contact.subject} - Response from Beeget Fashion`,
                    html: `
                        <h2>Response to Your Inquiry</h2>
                        <p>Dear ${contact.name},</p>
                        <p>Thank you for contacting Beeget Fashion. Here is our response to your inquiry:</p>
                        <div style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4fd1c5; margin: 20px 0;">
                            ${req.body.responseMessage.replace(/\n/g, '<br>')}
                        </div>
                        <p>Your original message:</p>
                        <div style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #ccc; margin: 20px 0;">
                            <p><strong>Subject:</strong> ${contact.subject}</p>
                            <p>${contact.message.replace(/\n/g, '<br>')}</p>
                        </div>
                        <p>If you have any further questions, please don't hesitate to contact us again.</p>
                        <p>Best regards,<br>The Beeget Fashion Team</p>
                    `
                });
                console.log(`Response email sent to ${contact.email}`);
            } catch (emailError) {
                console.error('Failed to send response email:', emailError);
                // Continue execution even if email fails
            }
        }

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('Update contact error:', error);
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
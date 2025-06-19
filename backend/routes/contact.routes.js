const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createContact,
    getContacts,
    getContact,
    updateContact,
    deleteContact
} = require('../controllers/contact.controller');

// Public routes
router.post('/', createContact);

// Admin only routes
router.use(auth('admin'));
router.get('/', getContacts);
router.get('/:id', getContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

module.exports = router;
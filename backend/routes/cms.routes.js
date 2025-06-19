const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createPage,
    getPages,
    getPage,
    getHomePage,
    updatePage,
    deletePage
} = require('../controllers/cms.controller');

// Public routes
router.get('/homepage', getHomePage);
router.get('/', getPages);
router.get('/:slug', getPage);

// Admin only routes
router.use(auth('admin'));
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

module.exports = router;
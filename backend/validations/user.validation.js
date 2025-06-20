const { check } = require('express-validator');

const addressValidation = [
  check('label', 'Address label is required').not().isEmpty(),
  check('line1', 'Address line is required').not().isEmpty(),
  check('city', 'City is required').not().isEmpty(),
  check('state', 'State is required').not().isEmpty(),
  check('zip', 'ZIP code is required').not().isEmpty(),
  check('country', 'Country is required').not().isEmpty()
];

module.exports = {
  addressValidation
};
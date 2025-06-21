const express = require("express");
const router = express.Router();
const geocodeController = require("../controllers/geocodeController");

// Extract location and geocode
router.post("/", geocodeController.extractAndGeocode);

module.exports = router;

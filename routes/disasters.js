const express = require("express");
const router = express.Router();
const disastersController = require("../controllers/disastersController");

// Create a disaster
router.post("/", disastersController.createDisaster);
// Get disasters (with optional tag filter)
router.get("/", disastersController.getDisasters);
// Update a disaster
router.put("/:id", disastersController.updateDisaster);
// Delete a disaster
router.delete("/:id", disastersController.deleteDisaster);
// Get social media reports for a disaster
router.get("/:id/social-media", disastersController.getSocialMediaReports);
// Get resources near a disaster
router.get("/:id/resources", disastersController.getNearbyResources);
// Get official updates for a disaster
router.get("/:id/official-updates", disastersController.getOfficialUpdates);
// Verify an image for a disaster
router.post("/:id/verify-image", disastersController.verifyImage);
// Update disaster coordinates
router.patch("/:id", disastersController.updateDisasterCoordinates);

module.exports = router;

const express = require("express");
const router = express.Router();
const mockSocialMediaController = require("../controllers/mockSocialMediaController");

// Get general mock social media posts
router.get("/", mockSocialMediaController.getMockSocialMedia);

// Get social media posts for specific disaster
router.get("/disaster/:id", mockSocialMediaController.getDisasterSocialMedia);

// Create new social media post
router.post("/create", mockSocialMediaController.createSocialMediaPost);

// Get user posts for a disaster
router.get("/user-posts/:disaster_id", mockSocialMediaController.getUserPosts);

module.exports = router;

const { extractLocation } = require("../services/geminiService");
const { geocodeLocation } = require("../services/geocodingService");

exports.extractAndGeocode = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description)
      return res.status(400).json({ error: "Description is required" });
    const locationName = await extractLocation(description);
    if (!locationName)
      return res.status(404).json({ error: "No location found" });
    const geocode = await geocodeLocation(locationName);
    if (!geocode) return res.status(404).json({ error: "No geocode found" });
    res.json({ location_name: locationName, geocode });
  } catch (err) {
    res
      .status(500)
      .json({
        error: "Failed to extract and geocode location",
        details: err.message,
      });
  }
};

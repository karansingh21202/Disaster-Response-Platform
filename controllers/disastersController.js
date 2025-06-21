// controllers/disasterController.js
const supabase = require("../services/supabase");
const { logAction } = require("../services/logService");
const axios = require("axios");
const { getCache, setCache } = require("../services/cacheService");
const { verifyImage: geminiVerifyImage } = require("../services/geminiService");
const cheerio = require("cheerio");

// Create Disaster
exports.createDisaster = async (req, res) => {
  try {
    const { title, description, location_name, tags } = req.body;
    const user_id = req.headers["x-user-id"] || "anonymous";

    if (!title || !description || !location_name) {
      return res.status(400).json({
        error: "Title, description, and location_name are required",
      });
    }

    // Try to geocode the location
    let lat = null;
    let lng = null;

    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        location_name
      )}`;
      const geocodeRes = await axios.get(geocodeUrl, {
        headers: { "User-Agent": "DisasterResponseApp/1.0" },
        timeout: 5000,
      });

      if (geocodeRes.data && geocodeRes.data.length > 0) {
        lat = parseFloat(geocodeRes.data[0].lat);
        lng = parseFloat(geocodeRes.data[0].lon);
      }
    } catch (geocodeError) {
      console.log(
        "Geocoding failed, continuing without coordinates:",
        geocodeError.message
      );
    }

    // Create disaster object with coordinates
    const disaster = {
      title,
      description,
      location_name,
      tags: Array.isArray(tags)
        ? tags
        : tags
        ? tags.split(",").map((t) => t.trim())
        : [],
      owner_id: user_id,
    };

    // Store in Supabase
    const { data, error } = await supabase
      .from("disasters")
      .insert([disaster])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({ error: error.message });
    }

    logAction("Disaster created", {
      disaster_id: data.id,
      title,
      location_name,
      user_id,
      has_coordinates: !!(lat && lng),
    });

    res.status(201).json({
      message: "Disaster created successfully!",
      disaster: data,
    });
  } catch (error) {
    console.error("Error creating disaster:", error);
    res.status(500).json({
      error: "Failed to create disaster",
      details: error.message,
    });
  }
};

// Get Disasters
exports.getDisasters = async (req, res) => {
  try {
    const { tag } = req.query;
    let query = supabase.from("disasters").select("*");
    if (tag) query = query.contains("tags", [tag]);
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    logAction("Disasters fetched", { tag });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch disasters", details: err.message });
  }
};

// Update Disaster
exports.updateDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location_name, description, tags } = req.body;
    // Fetch existing disaster
    const { data: existing, error: fetchError } = await supabase
      .from("disasters")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !existing)
      return res.status(404).json({ error: "Disaster not found" });

    // TEMPORARILY DISABLED: Authentication check for debugging
    // if (req.user.role !== "admin" && req.user.id !== existing.owner_id)
    //  return res.status(403).json({ error: "Forbidden" });

    const audit_trail = existing.audit_trail || [];
    audit_trail.push({
      action: "update",
      user_id: "anonymous", // Default user for now
      timestamp: new Date().toISOString(),
    });
    const { data, error } = await supabase
      .from("disasters")
      .update({ title, location_name, description, tags, audit_trail })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    logAction("Disaster updated", { id, user_id: "anonymous" });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update disaster", details: err.message });
  }
};

// Delete Disaster
exports.deleteDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch existing disaster
    const { data: existing, error: fetchError } = await supabase
      .from("disasters")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !existing)
      return res.status(404).json({ error: "Disaster not found" });

    // TEMPORARILY DISABLED: Authentication check for debugging
    // if (req.user.role !== "admin" && req.user.id !== existing.owner_id)
    //  return res.status(403).json({ error: "Forbidden" });

    const { error } = await supabase.from("disasters").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    logAction("Disaster deleted", { id, user_id: "anonymous_dev" }); // Hardcoded for now
    res.json({ message: "Disaster deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete disaster", details: err.message });
  }
};

// Social Media Reports (mock or real)
exports.getSocialMediaReports = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `social_media_${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);
    // For now, use mock endpoint
    const { data } = await axios.get("http://localhost:4000/mock-social-media");
    await setCache(cacheKey, data, 300);
    logAction("Social media reports fetched", { disaster_id: id });
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch social media reports",
      details: err.message,
    });
  }
};

// Nearby Resources
exports.getNearbyResources = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lon } = req.query;
    if (!lat || !lon)
      return res.status(400).json({ error: "lat and lon are required" });
    // 10km radius
    const { data, error } = await supabase.rpc("get_nearby_resources", {
      disaster_id: id,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      radius: 10000,
    });
    if (error) return res.status(400).json({ error: error.message });
    logAction("Nearby resources fetched", { disaster_id: id, lat, lon });
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch nearby resources",
      details: err.message,
    });
  }
};

// Helper function to parse various date formats from scraped content
const parseScrapedDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString();

  const now = new Date();
  const lowerCaseDateStr = dateStr.toLowerCase();

  try {
    // Handle formats like "X hours ago", "Y days ago"
    if (lowerCaseDateStr.includes("ago")) {
      const parts = lowerCaseDateStr.split(" ");
      const value = parseInt(parts[1], 10);
      if (isNaN(value)) return now.toISOString();

      if (lowerCaseDateStr.includes("hour")) {
        now.setHours(now.getHours() - value);
        return now.toISOString();
      }
      if (lowerCaseDateStr.includes("day")) {
        now.setDate(now.getDate() - value);
        return now.toISOString();
      }
    }

    // Handle formats like "Posted on 21 Jul 2024"
    const parsedDate = new Date(dateStr.replace("Posted on", "").trim());
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  } catch (e) {
    console.error(`Could not parse date: "${dateStr}"`, e.message);
  }

  // Fallback to the current time if parsing fails
  return now.toISOString();
};

// Official Updates using Web Scraping (Cheerio)
exports.getOfficialUpdates = async (req, res) => {
  const { id } = req.params;
  const { title, location_name, refresh } = req.query;

  const searchTerm = ((location_name || "") + " " + (title || "")).trim();
  if (!searchTerm) {
    return res
      .status(400)
      .json({ error: "Search term is required for updates." });
  }

  const cacheKey = `official_updates_scraping_v1_${searchTerm.replace(
    /\s+/g,
    "_"
  )}`;

  try {
    // Check cache first (unless refresh is requested)
    if (!refresh) {
      const cached = await getCache(cacheKey);
      if (cached) {
        logAction("Official updates (scraped) fetched from cache", {
          disaster_id: id,
          searchTerm,
        });
        return res.json(cached);
      }
    }

    let updates = [];
    const MAX_UPDATES = 10;
    const RELIEFWEB_LIMIT = 5;
    let scrapingSuccess = false;

    // 1. Scrape ReliefWeb
    try {
      const reliefWebUrl = `https://reliefweb.int/updates?search=${encodeURIComponent(
        searchTerm
      )}`;
      const { data: reliefHtml } = await axios.get(reliefWebUrl, {
        headers: { "User-Agent": "DisasterResponseApp/1.0" },
      });
      const $ = cheerio.load(reliefHtml);

      $("article.rw-river-article").each((i, el) => {
        if (updates.length >= RELIEFWEB_LIMIT) return false; // Stop after 5

        const updateTitle = $(el).find("h3 a").text().trim();
        let updateUrl = $(el).find("h3 a").attr("href");
        if (updateUrl && !updateUrl.startsWith("http")) {
          updateUrl = "https://reliefweb.int" + updateUrl;
        }
        const sourceAgency = $(el)
          .find(".rw-river-article__source")
          .text()
          .trim();
        const dateStr = $(el).find(".rw-river-article__date").text().trim();

        if (updateTitle && updateUrl) {
          updates.push({
            id: `rw-${$(el).data("id") || i}`,
            agency: sourceAgency || "ReliefWeb",
            update_text: updateTitle,
            timestamp: parseScrapedDate(dateStr),
            url: updateUrl,
            source: "ReliefWeb",
          });
        }
      });
      scrapingSuccess = true;
    } catch (err) {
      console.error("Error scraping ReliefWeb:", err.message);
    }

    // 2. Scrape FEMA News Releases if we need more updates
    if (updates.length < MAX_UPDATES) {
      try {
        const femaUrl = `https://www.fema.gov/news-releases?search=${encodeURIComponent(
          searchTerm
        )}`;
        const { data: femaHtml } = await axios.get(femaUrl, {
          headers: { "User-Agent": "DisasterResponseApp/1.0" },
        });
        const $ = cheerio.load(femaHtml);

        $(".views-row").each((i, el) => {
          if (updates.length >= MAX_UPDATES) return false; // Stop when we reach 10 total

          const updateTitle = $(el).find("h2.field-content a").text().trim();
          let updateUrl = $(el).find("h2.field-content a").attr("href");
          if (updateUrl && !updateUrl.startsWith("http")) {
            updateUrl = "https://www.fema.gov" + updateUrl;
          }
          const dateStr = $(el)
            .find(".field--name-field-release-date .field__item")
            .text()
            .trim();

          if (updateTitle && updateUrl) {
            updates.push({
              id: `fema-news-${i}`,
              agency: "FEMA",
              update_text: updateTitle,
              timestamp: parseScrapedDate(dateStr),
              url: updateUrl,
              source: "FEMA News",
            });
          }
        });
        scrapingSuccess = true;
      } catch (femaError) {
        console.error("Error scraping FEMA News:", femaError.message);
      }
    }

    // If scraping was successful, cache the results
    if (scrapingSuccess && updates.length > 0) {
      updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const finalUpdates = updates.slice(0, MAX_UPDATES);
      await setCache(cacheKey, finalUpdates, 3600); // Cache for 1 hour

      logAction("Official updates scraped", {
        disaster_id: id,
        count: finalUpdates.length,
        refresh: !!refresh,
      });
      res.json(finalUpdates);
    } else {
      // If scraping failed and refresh was requested, try to return cached data
      if (refresh) {
        const cached = await getCache(cacheKey);
        if (cached) {
          logAction("Official updates fallback to cache after failed refresh", {
            disaster_id: id,
            searchTerm,
          });
          return res.json(cached);
        }
      }

      // If no cached data available, return empty array
      logAction("Official updates scraping failed, no cache available", {
        disaster_id: id,
        searchTerm,
      });
      res.json([]);
    }
  } catch (err) {
    console.error("Error in getOfficialUpdates (scraping):", err.message);
    res.status(500).json({ error: "Server error fetching official updates." });
  }
};

// Verify Image via Gemini
exports.verifyImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, description } = req.body;
    if (!image_url)
      return res.status(400).json({ error: "image_url is required" });
    const result = await geminiVerifyImage(image_url, description);
    logAction("Image verified", { disaster_id: id, image_url });
    res.json({ result });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to verify image", details: err.message });
  }
};

// (Optional) Geocode endpoint if needed
exports.handleGeocodeExternal = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "address is required" });
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "DisasterResponseApp/1.0" },
    });
    if (data && data.length > 0) {
      const first = data[0];
      res.json({
        lat: first.lat,
        lon: first.lon,
        address: first.display_name,
      });
    } else {
      res.status(404).json({ error: "No coordinates found for this address." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coordinates." });
  }
};

// Update Disaster Coordinates
exports.updateDisasterCoordinates = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: "lat and lng are required",
      });
    }

    // Update coordinates in Supabase
    const { data, error } = await supabase
      .from("disasters")
      .update({ lat: parseFloat(lat), lng: parseFloat(lng) })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({ error: error.message });
    }

    logAction("Disaster coordinates updated", {
      disaster_id: id,
      lat,
      lng,
    });

    res.json({
      message: "Coordinates updated successfully!",
      disaster: data,
    });
  } catch (error) {
    console.error("Error updating disaster coordinates:", error);
    res.status(500).json({
      error: "Failed to update coordinates",
      details: error.message,
    });
  }
};

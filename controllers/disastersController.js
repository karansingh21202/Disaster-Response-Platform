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
      user_id,
      created_at: new Date().toISOString(),
      lat,
      lng,
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
    if (req.user.role !== "admin" && req.user.id !== existing.owner_id)
      return res.status(403).json({ error: "Forbidden" });
    const audit_trail = existing.audit_trail || [];
    audit_trail.push({
      action: "update",
      user_id: req.user.id,
      timestamp: new Date().toISOString(),
    });
    const { data, error } = await supabase
      .from("disasters")
      .update({ title, location_name, description, tags, audit_trail })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    logAction("Disaster updated", { id, user_id: req.user.id });
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
    if (req.user.role !== "admin" && req.user.id !== existing.owner_id)
      return res.status(403).json({ error: "Forbidden" });
    const { error } = await supabase.from("disasters").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    logAction("Disaster deleted", { id, user_id: req.user.id });
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

// Official Updates via USA.gov FEMA search
exports.getOfficialUpdates = async (req, res) => {
  const { id } = req.params;
  const { title, location_name } = req.query;

  // Build searchTerm from location_name + title
  let searchTerm = "";
  if (location_name && title) {
    searchTerm = `${location_name} ${title}`;
  } else if (title) {
    searchTerm = title;
  } else if (location_name) {
    searchTerm = location_name;
  } else {
    // fallback: fetch from DB
    try {
      const { data: disaster, error: dErr } = await supabase
        .from("disasters")
        .select("title, location_name, tags")
        .eq("id", id)
        .single();
      if (!dErr && disaster) {
        const parts = [];
        if (disaster.location_name) parts.push(disaster.location_name);
        if (disaster.title) parts.push(disaster.title);
        if (parts.length === 0 && disaster.tags && disaster.tags.length > 0)
          parts.push(disaster.tags[0]);
        searchTerm = parts.join(" ");
      }
    } catch (e) {
      console.error(
        "Error fetching disaster for fallback searchTerm:",
        e.message
      );
    }
  }

  searchTerm = (searchTerm || "").trim();
  if (!searchTerm) {
    return res
      .status(400)
      .json({ error: "No search term available for official updates." });
  }

  // Cache key safe: replace spaces
  const cacheKey = `official_updates_combined_${searchTerm.replace(
    /\s+/g,
    "_"
  )}`;

  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      logAction("Official updates fetched from cache (combined)", {
        disaster_id: id,
        searchTerm,
      });
      return res.json(cached);
    }

    // 1. Try ReliefWeb (Primary source)
    let updates = [];
    try {
      const reliefWebUrl = `https://reliefweb.int/updates?search=${encodeURIComponent(
        searchTerm
      )}`;
      const { data: reliefHtml } = await axios.get(reliefWebUrl, {
        headers: { "User-Agent": "DisasterResponseApp/1.0" },
      });
      const $ = cheerio.load(reliefHtml);
      $("article").each((i, el) => {
        if (updates.length >= 5) return;
        const title = $(el).find("h3.rw-river-article__title a").text().trim();
        let link = $(el).find("h3.rw-river-article__title a").attr("href");
        if (link && !link.startsWith("http"))
          link = "https://reliefweb.int" + link;
        const summary = $(el)
          .find("div.rw-river-article__body p")
          .first()
          .text()
          .trim();
        if (title && link) {
          updates.push({ title, summary, link, source: "ReliefWeb" });
        }
      });
    } catch (err) {
      console.error("Error fetching ReliefWeb:", err.message);
    }

    // 2. Try FEMA Official API (Secondary source)
    if (updates.length < 5) {
      try {
        console.log(`Attempting FEMA API search for: ${searchTerm}`);

        // Extract disaster type from search term
        const disasterTypes = {
          hurricane: "Hurricane",
          flood: "Flood",
          fire: "Fire",
          wildfire: "Fire",
          earthquake: "Earthquake",
          tornado: "Tornado",
          storm: "Severe Storm",
          tsunami: "Tsunami",
          volcano: "Volcano",
        };

        let incidentType = null;
        const searchLower = searchTerm.toLowerCase();
        for (const [key, value] of Object.entries(disasterTypes)) {
          if (searchLower.includes(key)) {
            incidentType = value;
            break;
          }
        }

        // Build FEMA API URL
        let femaApiUrl =
          "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$top=5&$orderby=incidentBeginDate desc";

        if (incidentType) {
          femaApiUrl += `&$filter=incidentType eq '${incidentType}'`;
        }

        console.log(`FEMA API URL: ${femaApiUrl}`);

        const femaResponse = await axios.get(femaApiUrl, {
          headers: {
            "User-Agent": "DisasterResponseApp/1.0",
            Accept: "application/json",
          },
          timeout: 10000,
        });

        if (
          femaResponse.data &&
          femaResponse.data.DisasterDeclarationsSummaries
        ) {
          const femaDisasters = femaResponse.data.DisasterDeclarationsSummaries;
          console.log(`Found ${femaDisasters.length} FEMA disasters`);

          femaDisasters.forEach((disaster, index) => {
            if (updates.length >= 5) return; // Max 5 FEMA updates

            const title =
              disaster.title || `${disaster.incidentType} in ${disaster.state}`;
            const summary = `Disaster #${disaster.disasterNumber} - ${disaster.incidentType} declared on ${disaster.incidentBeginDate}`;
            const link = `https://www.fema.gov/disaster/${disaster.disasterNumber}`;

            updates.push({
              title,
              summary,
              link,
              source: "FEMA API",
              date: disaster.incidentBeginDate,
              disasterNumber: disaster.disasterNumber,
              state: disaster.state,
              incidentType: disaster.incidentType,
            });
          });
        }
      } catch (femaError) {
        console.error("Error fetching from FEMA API:", femaError.message);

        // Fallback to Ready.gov if FEMA API fails
        try {
          console.log("FEMA API failed, trying Ready.gov as fallback...");
          const readyUrl = `https://www.ready.gov/search?search_api_fulltext=${encodeURIComponent(
            searchTerm
          )}`;
          const { data: readyHtml } = await axios.get(readyUrl, {
            headers: { "User-Agent": "DisasterResponseApp/1.0" },
          });
          const $ = cheerio.load(readyHtml);

          $(".search-result, .result-item, article").each((i, el) => {
            if (updates.length >= 10) return;
            const title = $(el)
              .find("h3 a, h2 a, .title a")
              .first()
              .text()
              .trim();
            let link = $(el).find("h3 a, h2 a, .title a").first().attr("href");
            const summary = $(el)
              .find(".summary, .description, p")
              .first()
              .text()
              .trim();

            if (title && link) {
              if (!link.startsWith("http")) {
                link = "https://www.ready.gov" + link;
              }
              updates.push({
                title,
                summary,
                link,
                source: "Ready.gov",
              });
            }
          });
        } catch (readyError) {
          console.error("Error fetching Ready.gov:", readyError.message);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(404).json({
        message: `No search results found for "${searchTerm}" from available sources.`,
      });
    }

    // Cache for 1 hour
    await setCache(cacheKey, updates, 3600);
    logAction("Official updates fetched from multiple sources and cached", {
      disaster_id: id,
      searchTerm,
      sources: [...new Set(updates.map((u) => u.source))],
    });
    res.json(updates);
  } catch (err) {
    console.error("Error in getOfficialUpdates:", err.message);
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

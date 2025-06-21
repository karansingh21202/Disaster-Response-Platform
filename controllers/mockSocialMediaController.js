const { getCache, setCache, clearCache } = require("../services/cacheService");
const { logAction } = require("../services/logService");
const supabase = require("../services/supabase");

// Mock Social Media Posts Generator
const generateMockPosts = (disasterType, location) => {
  const basePosts = [
    {
      id: "1",
      post: `#${disasterType}relief Need immediate assistance in ${location}. Roads are blocked and people need help evacuating.`,
      user: "citizen_emergency",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      likes: 45,
      retweets: 12,
      verified: false,
      platform: "Twitter",
    },
    {
      id: "2",
      post: `Just saw emergency vehicles heading towards ${location}. Stay safe everyone! #${disasterType} #emergency`,
      user: "local_reporter",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
      likes: 89,
      retweets: 23,
      verified: true,
      platform: "Twitter",
    },
    {
      id: "3",
      post: `FEMA teams are on the ground in ${location}. If you need shelter, go to the community center on Main St. #${disasterType}response`,
      user: "FEMA_Official",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      likes: 156,
      retweets: 67,
      verified: true,
      platform: "Twitter",
    },
    {
      id: "4",
      post: `Power is out in ${location}. Red Cross is setting up emergency shelters. Please share this information. #${disasterType} #help`,
      user: "redcross_volunteer",
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
      likes: 234,
      retweets: 89,
      verified: true,
      platform: "Twitter",
    },
    {
      id: "5",
      post: `Anyone have information about the ${disasterType} in ${location}? My family is there and I can't reach them. #worried`,
      user: "concerned_family",
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      likes: 67,
      retweets: 34,
      verified: false,
      platform: "Twitter",
    },
    {
      id: "6",
      post: `Local hospitals in ${location} are at capacity. Please only go to ER for life-threatening emergencies. #${disasterType} #healthcare`,
      user: "health_official",
      timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(), // 2.5 hours ago
      likes: 189,
      retweets: 45,
      verified: true,
      platform: "Twitter",
    },
    {
      id: "7",
      post: `Volunteers needed for ${disasterType} relief in ${location}. Contact @local_emergency for coordination. #volunteer #help`,
      user: "emergency_coord",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
      likes: 123,
      retweets: 56,
      verified: true,
      platform: "Twitter",
    },
    {
      id: "8",
      post: `Breaking: ${disasterType} has affected ${location}. Authorities are asking residents to stay indoors. #breaking #${disasterType}`,
      user: "news_alert",
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
      likes: 456,
      retweets: 234,
      verified: true,
      platform: "Twitter",
    },
  ];

  // Add Bluesky-style posts
  const blueskyPosts = [
    {
      id: "9",
      post: `Just checked in with local authorities. The ${disasterType} situation in ${location} is being managed. Stay informed and follow official updates.`,
      user: "bsky.emergency.info",
      timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      likes: 78,
      retweets: 23,
      verified: true,
      platform: "Bluesky",
    },
    {
      id: "10",
      post: `Community support is amazing! People in ${location} are helping each other during this ${disasterType}. Humanity at its best.`,
      user: "bsky.community.helper",
      timestamp: new Date(Date.now() - 1000 * 60 * 105).toISOString(),
      likes: 145,
      retweets: 67,
      verified: false,
      platform: "Bluesky",
    },
  ];

  return [...basePosts, ...blueskyPosts];
};

// Get Mock Social Media Posts
exports.getMockSocialMedia = async (req, res) => {
  try {
    const { disasterType = "disaster", location = "affected area" } = req.query;
    const cacheKey = `social_media_${disasterType}_${location}`;

    // Check cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      logAction("Social media posts fetched from cache", {
        disasterType,
        location,
      });
      return res.json(cached);
    }

    // Generate mock posts
    const posts = generateMockPosts(disasterType, location);

    // Add some randomization to make it feel more real
    const randomizedPosts = posts.map((post) => ({
      ...post,
      likes: Math.floor(post.likes * (0.8 + Math.random() * 0.4)), // ±20% variation
      retweets: Math.floor(post.retweets * (0.8 + Math.random() * 0.4)),
    }));

    // Cache for 5 minutes (social media updates frequently)
    await setCache(cacheKey, randomizedPosts, 300);

    logAction("Mock social media posts generated", {
      disasterType,
      location,
      postCount: randomizedPosts.length,
    });

    res.json({
      posts: randomizedPosts,
      metadata: {
        total_posts: randomizedPosts.length,
        disaster_type: disasterType,
        location: location,
        generated_at: new Date().toISOString(),
        source: "Mock Social Media API",
      },
    });
  } catch (error) {
    console.error("Error generating mock social media:", error);
    res.status(500).json({
      error: "Failed to generate social media posts",
      details: error.message,
    });
  }
};

// Get Social Media Posts for Specific Disaster
exports.getDisasterSocialMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location_name } = req.query;

    // Extract disaster type from title
    let disasterType = "disaster";
    if (title) {
      const titleLower = title.toLowerCase();
      if (titleLower.includes("flood")) disasterType = "flood";
      else if (titleLower.includes("fire") || titleLower.includes("wildfire"))
        disasterType = "fire";
      else if (titleLower.includes("hurricane")) disasterType = "hurricane";
      else if (titleLower.includes("earthquake")) disasterType = "earthquake";
      else if (titleLower.includes("tornado")) disasterType = "tornado";
      else if (titleLower.includes("storm")) disasterType = "storm";
    }

    const location = location_name || "affected area";
    const cacheKey = `disaster_social_${id}_${disasterType}`;

    // Check cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      logAction("Disaster social media posts fetched from cache", {
        disaster_id: id,
      });
      return res.json(cached);
    }

    // Generate posts specific to this disaster
    const posts = generateMockPosts(disasterType, location);

    // Cache for 5 minutes
    await setCache(cacheKey, posts, 300);

    logAction("Disaster social media posts generated", {
      disaster_id: id,
      disasterType,
      location,
      postCount: posts.length,
    });

    res.json({
      posts,
      metadata: {
        disaster_id: id,
        disaster_type: disasterType,
        location: location,
        total_posts: posts.length,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error generating disaster social media:", error);
    res.status(500).json({
      error: "Failed to generate disaster social media posts",
      details: error.message,
    });
  }
};

// Create Social Media Post
exports.createSocialMediaPost = async (req, res) => {
  try {
    const { disaster_id, content, platform = "Twitter", user_id } = req.body;

    if (!disaster_id || !content) {
      return res.status(400).json({
        error: "disaster_id and content are required",
      });
    }

    // Create post object
    const post = {
      disaster_id,
      content,
      platform,
      user_id: user_id || "netrunnerX",
      likes: 0,
      retweets: 0,
      verified: false,
      timestamp: new Date().toISOString(),
      source: "User Generated",
    };

    // Store in Supabase
    const { data, error } = await supabase
      .from("social_media_posts")
      .insert([post])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({ error: error.message });
    }

    // Clear cache for this disaster's social media posts
    const cacheKey = `disaster_social_${disaster_id}_*`;
    await clearCache(cacheKey);

    // Also clear the general social media cache to ensure fresh data
    await clearCache("disaster_social_*");

    logAction("Social media post created", {
      disaster_id,
      platform,
      user_id: post.user_id,
    });

    res.status(201).json({
      message: `Post successfully created on ${platform}!`,
      post: data,
    });
  } catch (error) {
    console.error("Error creating social media post:", error);
    res.status(500).json({
      error: "Failed to create social media post",
      details: error.message,
    });
  }
};

// Get User Posts for a Disaster
exports.getUserPosts = async (req, res) => {
  try {
    const { disaster_id } = req.params;

    const { data, error } = await supabase
      .from("social_media_posts")
      .select("*")
      .eq("disaster_id", disaster_id)
      .order("timestamp", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      posts: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      error: "Failed to fetch user posts",
      details: error.message,
    });
  }
};

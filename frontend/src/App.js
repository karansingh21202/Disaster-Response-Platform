import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DisasterMap from "./DisasterMap";
// FontAwesome imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faMapMarkerAlt,
  faSearch,
  faGlobe,
  faNewspaper,
  faMap,
  faPlus,
  faEye,
  faEdit,
  faCheck,
  faTimes,
  faSpinner,
  faImage,
  faComments,
  faInfoCircle,
  faShieldAlt,
  faHeart,
  faRetweet,
  faShare,
  faClock,
  faUser,
  faCheckCircle,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import { faTwitter as faTwitterBrand } from "@fortawesome/free-brands-svg-icons";

const API = "https://disaster-response-platform-c1tf.onrender.com";

// Add a helper for concise, web-app friendly Gemini prompts
const GEMINI_LOCATION_SYSTEM_PROMPT = `You are an assistant for a disaster response web app. When asked for flood locations, always search for the most recent, exact locations affected, and output ONLY a concise, point-wise list of locations (district, city, village, or area), each with a one-liner description if needed. Do not include explanations, context, or historical summaries. Your output must be ready for direct display in a web app.`;

function App() {
  // Disaster States
  const [disasters, setDisasters] = useState([]);
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    location_name: "",
    tags: "",
  });

  // Gemini States
  const [geminiMode, setGeminiMode] = useState("location");
  const [geminiText, setGeminiText] = useState("");
  const [geminiImageUrl, setGeminiImageUrl] = useState("");
  const [geminiResult, setGeminiResult] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);

  // Geocode States
  const [geocodeAddress, setGeocodeAddress] = useState("");
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  // Official Updates State
  const [officialUpdates, setOfficialUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);

  // Social Media State
  const [socialMediaPosts, setSocialMediaPosts] = useState([]);
  const [socialMediaLoading, setSocialMediaLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [postingLoading, setPostingLoading] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

  // Map State
  const [showMap, setShowMap] = useState(false);

  // Fetch all disasters on mount
  useEffect(() => {
    fetchDisasters();
  }, []);

  // Fetch disasters from backend
  const fetchDisasters = async () => {
    try {
      const res = await axios.get(`${API}/disasters`);
      setDisasters(res.data);
    } catch (error) {
      toast.error("Error fetching disasters. Is the backend running?");
      console.error(error);
    }
  };

  // Fetch official updates using FEMA search via USA.gov
  const fetchOfficialUpdates = async (
    disasterId,
    disasterTitle,
    disasterLocation
  ) => {
    if (!disasterId) return;
    setUpdatesLoading(true);
    setOfficialUpdates([]);
    try {
      const res = await axios.get(
        `${API}/disasters/${disasterId}/official-updates`,
        {
          params: {
            title: disasterTitle,
            location_name: disasterLocation,
          },
        }
      );
      setOfficialUpdates(res.data);
    } catch (error) {
      console.error("Error fetching official updates:", error);
    } finally {
      setUpdatesLoading(false);
    }
  };

  // Fetch social media posts for a disaster
  const fetchSocialMediaPosts = async (
    disasterId,
    disasterTitle,
    disasterLocation
  ) => {
    if (!disasterId) return;
    setSocialMediaLoading(true);
    // Don't clear posts immediately - let them show until new ones load
    try {
      // Fetch mock posts
      const mockRes = await axios.get(
        `${API}/mock-social-media/disaster/${disasterId}`,
        {
          params: {
            title: disasterTitle,
            location_name: disasterLocation,
          },
        }
      );

      // Fetch user posts
      const userRes = await axios.get(
        `${API}/mock-social-media/user-posts/${disasterId}`
      );

      // Combine mock posts and user posts
      const mockPosts = mockRes.data.posts || [];
      const userPosts = userRes.data.posts || [];

      // Convert user posts to match mock post format
      const formattedUserPosts = userPosts.map((post) => ({
        id: post.id,
        post: post.content,
        user: post.user_id,
        timestamp: post.timestamp,
        likes: post.likes,
        retweets: post.retweets,
        verified: post.verified,
        platform: post.platform,
        source: post.source,
      }));

      // Combine and sort by timestamp (newest first)
      const allPosts = [...formattedUserPosts, ...mockPosts].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setSocialMediaPosts(allPosts);
    } catch (error) {
      console.error("Error fetching social media posts:", error);
    } finally {
      setSocialMediaLoading(false);
    }
  };

  // Create social media post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!selectedDisaster || !newPostContent.trim()) {
      toast.info("Please select a disaster and enter post content.");
      return;
    }

    setPostingLoading(true);
    try {
      const res = await axios.post(`${API}/mock-social-media/create`, {
        disaster_id: selectedDisaster.id,
        content: newPostContent,
        platform: "Twitter",
        user_id: "netrunnerX",
      });

      toast.success(res.data.message);
      setNewPostContent("");

      // Add a small delay to show the refresh
      setTimeout(() => {
        // Refresh social media posts
        fetchSocialMediaPosts(
          selectedDisaster.id,
          selectedDisaster.title,
          selectedDisaster.location_name
        );
      }, 500);
    } catch (error) {
      toast.error("Failed to create post. Please try again.");
      console.error(error);
    } finally {
      setPostingLoading(false);
    }
  };

  const handleSelectDisaster = (disaster) => {
    setSelectedDisaster(disaster);
    fetchOfficialUpdates(disaster.id, disaster.title, disaster.location_name);
    fetchSocialMediaPosts(disaster.id, disaster.title, disaster.location_name);
  };

  // Create Disaster
  const handleCreateDisaster = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/disasters`,
        {
          ...createForm,
          tags: createForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t),
        },
        { headers: { "x-user-id": "netrunnerX" } }
      );
      toast.success("Disaster created!");
      setCreateForm({
        title: "",
        description: "",
        location_name: "",
        tags: "",
      });
      fetchDisasters();
    } catch (error) {
      toast.error("Error creating disaster.");
      console.error(error);
    }
  };

  // Gemini Location: backend geocode
  const handleGeminiLocation = async (e) => {
    e.preventDefault();
    setGeminiLoading(true);
    setGeminiResult("");
    try {
      const res = await axios.post(`${API}/gemini/extract-location`, {
        text: geminiText,
      });
      // Assuming the result from backend is directly the extracted location text
      if (res.data.result) {
        setGeminiResult(`Extracted Location: ${res.data.result}`);
      } else {
        setGeminiResult("No location found or could not extract.");
      }
    } catch (error) {
      console.error(error);
      setGeminiResult(error.response?.data?.error || "An error occurred.");
    } finally {
      setGeminiLoading(false);
    }
  };

  // Gemini Image: analyze general image
  const handleGeminiImage = async (e) => {
    e.preventDefault();
    if (!geminiImageUrl) {
      toast.info("Please enter an image URL to analyze.");
      return;
    }
    setGeminiLoading(true);
    setGeminiResult("");
    try {
      const res = await axios.post(`${API}/gemini/analyze-image`, {
        image_url: geminiImageUrl,
        text_context: geminiText, // Pass geminiText as context for image analysis
      });
      setGeminiResult(res.data.result || "Could not analyze image.");
    } catch (error) {
      console.error(error);
      setGeminiResult(error.response?.data?.error || "An error occurred.");
    } finally {
      setGeminiLoading(false);
    }
  };

  // Direct Geocode via OpenStreetMap
  const handleGeocode = async (e) => {
    e.preventDefault();
    setGeocodeLoading(true);
    setGeocodeResult(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        geocodeAddress
      )}`;
      const res = await axios.get(url, {
        headers: { "User-Agent": "DisasterResponseApp/1.0" },
      });
      if (res.data && res.data.length > 0) {
        setGeocodeResult({
          lat: res.data[0].lat,
          lon: res.data[0].lon,
          address: res.data[0].display_name,
        });
      } else {
        setGeocodeResult({ error: "No coordinates found for this address." });
      }
    } catch (error) {
      console.error(error);
      setGeocodeResult({ error: "Failed to fetch coordinates." });
    } finally {
      setGeocodeLoading(false);
    }
  };

  // In the Gemini location extraction form/handler:
  const handleGeminiLocationExtract = async (userPrompt) => {
    const prompt = `${GEMINI_LOCATION_SYSTEM_PROMPT}\n${userPrompt}`;
    // ... existing code to call backend or Gemini API with this prompt ...
  };

  return (
    <div className="app-container">
      {/* Modern Header */}
      <div className="app-header">
        <h1 className="app-title">
          <FontAwesomeIcon
            icon={faShieldAlt}
            style={{ marginRight: "10px", color: "var(--favicon-primary)" }}
          />
          Disaster Response Coordination Platform
        </h1>
        <p className="app-subtitle">
          Real-time disaster monitoring, social media integration, and
          AI-powered analysis
        </p>
      </div>

      {/* Create Disaster Section */}
      <div className="modern-card">
        <h2 className="section-header">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            style={{ marginRight: "8px", color: "var(--favicon-danger)" }}
          />
          Create a New Disaster Report
        </h2>
        <form onSubmit={handleCreateDisaster} className="modern-form">
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon
                icon={faEdit}
                style={{
                  marginRight: "5px",
                  color: "var(--favicon-secondary)",
                }}
              />
              Disaster Title
            </label>
            <input
              value={createForm.title}
              onChange={(e) =>
                setCreateForm({ ...createForm, title: e.target.value })
              }
              placeholder="e.g., Major Flood in Downtown Area"
              required
              className="modern-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon
                icon={faInfoCircle}
                style={{
                  marginRight: "5px",
                  color: "var(--favicon-secondary)",
                }}
              />
              Description
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
              placeholder="Provide detailed description of the disaster..."
              required
              className="modern-input modern-textarea"
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                style={{
                  marginRight: "5px",
                  color: "var(--favicon-secondary)",
                }}
              />
              Location
            </label>
            <input
              value={createForm.location_name}
              onChange={(e) =>
                setCreateForm({ ...createForm, location_name: e.target.value })
              }
              placeholder="e.g., New York City, NY"
              required
              className="modern-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon
                icon={faHashtag}
                style={{
                  marginRight: "5px",
                  color: "var(--favicon-secondary)",
                }}
              />
              Tags
            </label>
            <input
              value={createForm.tags}
              onChange={(e) =>
                setCreateForm({ ...createForm, tags: e.target.value })
              }
              placeholder="flood, emergency, evacuation (comma-separated)"
              className="modern-input"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-large">
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: "8px" }} />
            Create Disaster Report
          </button>
        </form>
      </div>

      {/* Disaster List Section */}
      <div className="modern-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-header">
            <FontAwesomeIcon
              icon={faEye}
              style={{ marginRight: "8px", color: "var(--favicon-primary)" }}
            />
            Active Disasters
          </h2>
          <button onClick={fetchDisasters} className="btn btn-secondary">
            <FontAwesomeIcon icon={faSpinner} style={{ marginRight: "5px" }} />
            Refresh
          </button>
        </div>

        <ul className="modern-list">
          {disasters.length === 0 ? (
            <li className="list-item">
              <div className="text-center py-8">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  style={{
                    fontSize: "2rem",
                    color: "var(--favicon-secondary)",
                    marginBottom: "10px",
                  }}
                />
                <p className="text-gray-500">
                  No disasters found. Create your first disaster report above.
                </p>
              </div>
            </li>
          ) : (
            disasters.map((d) => (
              <li
                key={d.id}
                onClick={() => handleSelectDisaster(d)}
                className={`list-item ${
                  selectedDisaster?.id === d.id ? "selected" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{d.title}</h3>
                    <p className="text-gray-600 mb-2">
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        style={{
                          marginRight: "5px",
                          color: "var(--favicon-secondary)",
                        }}
                      />
                      {d.location_name}
                    </p>
                    <p className="text-gray-500 text-sm mb-3">
                      {d.description}
                    </p>
                    {Array.isArray(d.tags) && d.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {d.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="disaster-badge badge-flood"
                          >
                            <FontAwesomeIcon
                              icon={faHashtag}
                              style={{ marginRight: "3px", fontSize: "0.8em" }}
                            />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {d.lat && d.lng && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      <FontAwesomeIcon
                        icon={faCheck}
                        style={{ marginRight: "3px" }}
                      />
                      Located
                    </span>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Map Section */}
        <div className="mt-8">
          <button
            onClick={() => setShowMap(!showMap)}
            className="btn btn-primary btn-large"
          >
            {showMap ? (
              <>
                <FontAwesomeIcon
                  icon={faTimes}
                  style={{ marginRight: "8px" }}
                />
                Hide Interactive Map
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faMap} style={{ marginRight: "8px" }} />
                Show Interactive Map
              </>
            )}
          </button>

          {showMap && (
            <div className="mt-6 map-container">
              <DisasterMap
                disasters={disasters}
                selectedDisaster={selectedDisaster}
                onDisasterSelect={handleSelectDisaster}
                socialMediaPosts={socialMediaPosts}
                officialUpdates={officialUpdates}
              />
            </div>
          )}
        </div>

        {/* Selected Disaster Details */}
        {selectedDisaster && (
          <div className="mt-8">
            <div className="modern-card">
              <h3 className="section-header">
                <FontAwesomeIcon
                  icon={faNewspaper}
                  style={{ marginRight: "8px", color: "var(--favicon-info)" }}
                />
                Official Updates for: {selectedDisaster.title}
              </h3>
              {updatesLoading ? (
                <div className="loading-text">
                  <div className="loading-spinner"></div>
                  <FontAwesomeIcon
                    icon={faNewspaper}
                    style={{ marginRight: "5px" }}
                  />
                  Loading official updates...
                </div>
              ) : officialUpdates.length > 0 ? (
                <ul className="modern-list">
                  {officialUpdates.map((update, index) => (
                    <li key={index} className="list-item">
                      <a
                        href={update.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:text-blue-600 transition-colors"
                      >
                        <h4 className="font-semibold mb-2">{update.title}</h4>
                        {update.summary && (
                          <p className="text-gray-600 text-sm">
                            {update.summary}
                          </p>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  <FontAwesomeIcon
                    icon={faNewspaper}
                    style={{
                      marginRight: "5px",
                      color: "var(--favicon-secondary)",
                    }}
                  />
                  No official updates found.
                </p>
              )}
            </div>

            {/* Social Media Section */}
            <div className="modern-card mt-6">
              <h3 className="section-header">
                <FontAwesomeIcon
                  icon={faComments}
                  style={{
                    marginRight: "8px",
                    color: "var(--favicon-success)",
                  }}
                />
                Social Media Updates for: {selectedDisaster.title}
              </h3>

              {/* Post Creation */}
              <div className="mb-6">
                <button
                  onClick={() => setShowPostForm(!showPostForm)}
                  className={`btn ${
                    showPostForm ? "btn-danger" : "btn-success"
                  }`}
                >
                  {showPostForm ? (
                    <>
                      <FontAwesomeIcon
                        icon={faTimes}
                        style={{ marginRight: "5px" }}
                      />
                      Cancel
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faEdit}
                        style={{ marginRight: "5px" }}
                      />
                      Create Post
                    </>
                  )}
                </button>
              </div>

              {showPostForm && (
                <div className="modern-card mb-6">
                  <h4 className="font-semibold mb-4">
                    <FontAwesomeIcon
                      icon={faEdit}
                      style={{
                        marginRight: "5px",
                        color: "var(--favicon-secondary)",
                      }}
                    />
                    Create a Social Media Post
                  </h4>
                  <form onSubmit={handleCreatePost} className="modern-form">
                    <div className="form-group">
                      <label className="form-label">
                        <FontAwesomeIcon
                          icon={faComments}
                          style={{
                            marginRight: "5px",
                            color: "var(--favicon-secondary)",
                          }}
                        />
                        Post Content
                      </label>
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Share your thoughts about this disaster..."
                        className="modern-input modern-textarea"
                        maxLength={280}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500">
                          <FontAwesomeIcon
                            icon={faHashtag}
                            style={{ marginRight: "3px", fontSize: "0.8em" }}
                          />
                          {newPostContent.length}/280 characters
                        </span>
                        <button
                          type="submit"
                          disabled={postingLoading || !newPostContent.trim()}
                          className="btn btn-primary"
                        >
                          {postingLoading ? (
                            <>
                              <FontAwesomeIcon
                                icon={faSpinner}
                                style={{ marginRight: "5px" }}
                              />
                              Posting...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon
                                icon={faShare}
                                style={{ marginRight: "5px" }}
                              />
                              Post
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Social Media Posts */}
              {socialMediaLoading ? (
                <div className="loading-text text-center py-8">
                  <div className="loading-spinner"></div>
                  <p>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      style={{ marginRight: "5px" }}
                    />
                    Refreshing social media posts...
                  </p>
                  <p className="text-sm text-gray-500">
                    <FontAwesomeIcon
                      icon={faComments}
                      style={{ marginRight: "3px", fontSize: "0.8em" }}
                    />
                    Fetching latest posts and updates...
                  </p>
                </div>
              ) : socialMediaPosts.length > 0 ? (
                <div>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() =>
                        fetchSocialMediaPosts(
                          selectedDisaster.id,
                          selectedDisaster.title,
                          selectedDisaster.location_name
                        )
                      }
                      className="btn btn-secondary btn-small"
                    >
                      <FontAwesomeIcon
                        icon={faSpinner}
                        style={{ marginRight: "5px" }}
                      />
                      Refresh Posts
                    </button>
                  </div>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {socialMediaPosts.map((post, index) => (
                      <div key={post.id || index} className="social-post">
                        <div className="post-header">
                          <div className="post-user">
                            <FontAwesomeIcon
                              icon={faUser}
                              style={{
                                marginRight: "5px",
                                color: "var(--favicon-secondary)",
                              }}
                            />
                            <strong>@{post.user}</strong>
                            {post.verified && (
                              <FontAwesomeIcon
                                icon={faCheckCircle}
                                style={{
                                  marginLeft: "5px",
                                  color: "var(--favicon-success)",
                                }}
                              />
                            )}
                          </div>
                          <span className="post-timestamp">
                            <FontAwesomeIcon
                              icon={faClock}
                              style={{
                                marginRight: "3px",
                                color: "var(--favicon-secondary)",
                              }}
                            />
                            {new Date(post.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="post-content">{post.post}</p>
                        <div className="post-stats">
                          <span>
                            <FontAwesomeIcon
                              icon={faHeart}
                              style={{
                                marginRight: "3px",
                                color: "var(--favicon-danger)",
                              }}
                            />
                            {post.likes}
                          </span>
                          <span>
                            <FontAwesomeIcon
                              icon={faRetweet}
                              style={{
                                marginRight: "3px",
                                color: "var(--favicon-success)",
                              }}
                            />
                            {post.retweets}
                          </span>
                          <span className="post-platform">
                            <FontAwesomeIcon
                              icon={faTwitterBrand}
                              style={{
                                marginRight: "3px",
                                color: "var(--favicon-info)",
                              }}
                            />
                            {post.platform}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  <FontAwesomeIcon
                    icon={faComments}
                    style={{
                      marginRight: "5px",
                      color: "var(--favicon-secondary)",
                    }}
                  />
                  No social media posts found.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Section */}
      <div className="modern-card">
        <h2 className="section-header">
          <FontAwesomeIcon
            icon={faSearch}
            style={{ marginRight: "8px", color: "var(--favicon-warning)" }}
          />
          AI-Powered Analysis
        </h2>

        <div className="btn-group">
          <button
            onClick={() => setGeminiMode("location")}
            className={`btn ${
              geminiMode === "location" ? "btn-primary" : "btn-secondary"
            }`}
          >
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              style={{ marginRight: "5px" }}
            />
            Extract Location from Text
          </button>
          <button
            onClick={() => setGeminiMode("image")}
            className={`btn ${
              geminiMode === "image" ? "btn-primary" : "btn-secondary"
            }`}
          >
            <FontAwesomeIcon icon={faImage} style={{ marginRight: "5px" }} />
            Analyze Disaster Image
          </button>
        </div>

        {geminiMode === "location" ? (
          <form onSubmit={handleGeminiLocation} className="modern-form">
            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  style={{
                    marginRight: "5px",
                    color: "var(--favicon-secondary)",
                  }}
                />
                Text for Location Extraction
              </label>
              <textarea
                value={geminiText}
                onChange={(e) => setGeminiText(e.target.value)}
                placeholder="Enter text containing location information..."
                className="modern-input modern-textarea"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <FontAwesomeIcon icon={faSearch} style={{ marginRight: "5px" }} />
              Extract Location
            </button>
          </form>
        ) : (
          <form onSubmit={handleGeminiImage} className="modern-form">
            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon
                  icon={faImage}
                  style={{
                    marginRight: "5px",
                    color: "var(--favicon-secondary)",
                  }}
                />
                Image URL
              </label>
              <input
                value={geminiImageUrl}
                onChange={(e) => setGeminiImageUrl(e.target.value)}
                placeholder="Enter image URL for disaster analysis..."
                className="modern-input"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <FontAwesomeIcon icon={faSearch} style={{ marginRight: "5px" }} />
              Analyze Image
            </button>
          </form>
        )}

        {geminiLoading && (
          <div className="loading-text mt-4">
            <div className="loading-spinner"></div>
            <FontAwesomeIcon icon={faSpinner} style={{ marginRight: "5px" }} />
            Processing with AI...
          </div>
        )}

        {geminiResult && (
          <div className="modern-card mt-4">
            <h4 className="font-semibold mb-3">
              <FontAwesomeIcon
                icon={faSearch}
                style={{ marginRight: "5px", color: "var(--favicon-warning)" }}
              />
              AI Analysis Result
            </h4>
            <p className="text-gray-700">{geminiResult}</p>
          </div>
        )}
      </div>

      {/* Geocoding Section */}
      <div className="modern-card">
        <h2 className="section-header">
          <FontAwesomeIcon
            icon={faGlobe}
            style={{ marginRight: "8px", color: "var(--favicon-info)" }}
          />
          Coordinate Finder
        </h2>
        <form onSubmit={handleGeocode} className="modern-form">
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                style={{
                  marginRight: "5px",
                  color: "var(--favicon-secondary)",
                }}
              />
              Address or Place Name
            </label>
            <input
              value={geocodeAddress}
              onChange={(e) => setGeocodeAddress(e.target.value)}
              placeholder="Enter any address or place name for coordinates"
              className="modern-input"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <FontAwesomeIcon icon={faGlobe} style={{ marginRight: "5px" }} />
            Get Coordinates
          </button>
        </form>

        {geocodeLoading && (
          <div className="loading-text mt-4">
            <div className="loading-spinner"></div>
            <FontAwesomeIcon icon={faGlobe} style={{ marginRight: "5px" }} />
            Fetching coordinates...
          </div>
        )}

        {geocodeResult && (
          <div className="modern-card mt-4">
            {geocodeResult.error ? (
              <div className="text-red-600">
                <strong>
                  <FontAwesomeIcon
                    icon={faTimes}
                    style={{
                      marginRight: "5px",
                      color: "var(--favicon-danger)",
                    }}
                  />
                  Error:
                </strong>{" "}
                {geocodeResult.error}
              </div>
            ) : (
              <div>
                <h4 className="font-semibold mb-3">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    style={{
                      marginRight: "5px",
                      color: "var(--favicon-success)",
                    }}
                  />
                  Location Found
                </h4>
                <p className="mb-2">
                  <strong>
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      style={{
                        marginRight: "5px",
                        color: "var(--favicon-secondary)",
                      }}
                    />
                    Address:
                  </strong>{" "}
                  {geocodeResult.address}
                </p>
                <p className="mb-4">
                  <strong>
                    <FontAwesomeIcon
                      icon={faGlobe}
                      style={{
                        marginRight: "5px",
                        color: "var(--favicon-info)",
                      }}
                    />
                    Coordinates:
                  </strong>{" "}
                  {geocodeResult.lat}, {geocodeResult.lon}
                </p>
                {selectedDisaster && !selectedDisaster.lat && (
                  <button
                    onClick={async () => {
                      try {
                        await axios.patch(
                          `${API}/disasters/${selectedDisaster.id}`,
                          {
                            lat: parseFloat(geocodeResult.lat),
                            lng: parseFloat(geocodeResult.lon),
                          }
                        );
                        toast.success("Coordinates added to disaster!");
                        fetchDisasters();
                      } catch (error) {
                        toast.error("Failed to update coordinates");
                      }
                    }}
                    className="btn btn-success"
                  >
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      style={{ marginRight: "5px" }}
                    />
                    Add to Selected Disaster
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;

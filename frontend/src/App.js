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
// const API = "http://localhost:4000";

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

  // Analysis States
  const [analysisMode, setAnalysisMode] = useState("location");
  const [analysisText, setAnalysisText] = useState("");
  const [analysisImageUrl, setAnalysisImageUrl] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);

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

  // Location extraction
  const handleLocationExtraction = async (e) => {
    e.preventDefault();
    setAnalysisLoading(true);
    setAnalysisResult("");
    try {
      const res = await axios.post(`${API}/gemini/extract-location`, {
        text: analysisText,
      });
      // Assuming the result from backend is directly the extracted location text
      if (res.data.result) {
        setAnalysisResult(`Extracted Location: ${res.data.result}`);
      } else {
        setAnalysisResult("No location found or could not extract.");
      }
    } catch (error) {
      console.error(error);
      setAnalysisResult(error.response?.data?.error || "An error occurred.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Image analysis
  const handleImageAnalysis = async (e) => {
    e.preventDefault();
    if (!analysisImageUrl) {
      toast.info("Please enter an image URL to analyze.");
      return;
    }
    setAnalysisLoading(true);
    setAnalysisResult("");
    try {
      const res = await axios.post(`${API}/gemini/analyze-image`, {
        image_url: analysisImageUrl,
        text_context: analysisText, // Pass analysisText as context for image analysis
      });
      setAnalysisResult(res.data.result || "Could not analyze image.");
    } catch (error) {
      console.error(error);
      setAnalysisResult(error.response?.data?.error || "An error occurred.");
    } finally {
      setAnalysisLoading(false);
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
          intelligent analysis
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
                  <div className="text-right">
                    <span className="text-xs text-gray-400">
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Selected Disaster Details */}
      {selectedDisaster && (
        <div className="modern-card">
          <h2 className="section-header">
            <FontAwesomeIcon
              icon={faInfoCircle}
              style={{ marginRight: "8px", color: "var(--favicon-info)" }}
            />
            Disaster Details: {selectedDisaster.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Map Section */}
            <div>
              <h3 className="font-semibold mb-3">
                <FontAwesomeIcon
                  icon={faMap}
                  style={{
                    marginRight: "5px",
                    color: "var(--favicon-primary)",
                  }}
                />
                Location Map
              </h3>
              <div className="mt-6 map-container">
                <DisasterMap
                  disasters={[selectedDisaster]}
                  selectedDisaster={selectedDisaster}
                  onDisasterSelect={handleSelectDisaster}
                  socialMediaPosts={socialMediaPosts}
                  officialUpdates={officialUpdates}
                />
              </div>
            </div>

            {/* Social Media Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">
                  <FontAwesomeIcon
                    icon={faComments}
                    style={{
                      marginRight: "5px",
                      color: "var(--favicon-info)",
                    }}
                  />
                  Social Media Updates
                </h3>
                <button
                  onClick={() => setShowPostForm(!showPostForm)}
                  className="btn btn-secondary btn-small"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    style={{ marginRight: "3px" }}
                  />
                  Add Post
                </button>
              </div>

              {showPostForm && (
                <form onSubmit={handleCreatePost} className="modern-form mb-4">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share your experience or observation..."
                    className="modern-input modern-textarea"
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={postingLoading}
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
                        Share Post
                      </>
                    )}
                  </button>
                </form>
              )}

              {socialMediaLoading ? (
                <div className="loading-text">
                  <div className="loading-spinner"></div>
                  <FontAwesomeIcon
                    icon={faComments}
                    style={{ marginRight: "5px" }}
                  />
                  Loading social media posts...
                </div>
              ) : socialMediaPosts.length > 0 ? (
                <div className="space-y-3">
                  {socialMediaPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="social-post">
                      <div className="post-header">
                        <div className="post-user">
                          <FontAwesomeIcon
                            icon={faUser}
                            style={{
                              marginRight: "5px",
                              color: "var(--favicon-secondary)",
                            }}
                          />
                          @{post.user}
                          {post.verified && (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="post-verified"
                              style={{ marginLeft: "5px" }}
                            />
                          )}
                        </div>
                        <span className="post-timestamp">
                          <FontAwesomeIcon
                            icon={faClock}
                            style={{ marginRight: "3px" }}
                          />
                          {new Date(post.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="post-content">{post.post}</div>
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
        </div>
      )}

      {/* Analysis Section */}
      <div className="modern-card">
        <h2 className="section-header">
          <FontAwesomeIcon
            icon={faSearch}
            style={{ marginRight: "8px", color: "var(--favicon-warning)" }}
          />
          Intelligent Analysis
        </h2>

        <div className="btn-group">
          <button
            onClick={() => setAnalysisMode("location")}
            className={`btn ${
              analysisMode === "location" ? "btn-primary" : "btn-secondary"
            }`}
          >
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              style={{ marginRight: "5px" }}
            />
            Extract Location from Text
          </button>
          <button
            onClick={() => setAnalysisMode("image")}
            className={`btn ${
              analysisMode === "image" ? "btn-primary" : "btn-secondary"
            }`}
          >
            <FontAwesomeIcon icon={faImage} style={{ marginRight: "5px" }} />
            Analyze Disaster Image
          </button>
        </div>

        {analysisMode === "location" ? (
          <form onSubmit={handleLocationExtraction} className="modern-form">
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
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
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
          <form onSubmit={handleImageAnalysis} className="modern-form">
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
                value={analysisImageUrl}
                onChange={(e) => setAnalysisImageUrl(e.target.value)}
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

        {analysisLoading && (
          <div className="loading-text mt-4">
            <div className="loading-spinner"></div>
            <FontAwesomeIcon icon={faSpinner} style={{ marginRight: "5px" }} />
            Processing...
          </div>
        )}

        {analysisResult && (
          <div className="modern-card mt-4">
            <h4 className="font-semibold mb-3">
              <FontAwesomeIcon
                icon={faSearch}
                style={{ marginRight: "5px", color: "var(--favicon-warning)" }}
              />
              Analysis Result
            </h4>
            <p className="text-gray-700">{analysisResult}</p>
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

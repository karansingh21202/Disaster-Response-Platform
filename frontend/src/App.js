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
  faMap,
  faPlus,
  faEye,
  faEdit,
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
  faTrash,
  faBullhorn,
  faBuilding,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faTwitter as faTwitterBrand } from "@fortawesome/free-brands-svg-icons";

// API configuration
const VERCEL_API = "https://disaster-response-platform-8kc4.vercel.app";
const RAILWAY_API = "https://disaster-response-platform-production.up.railway.app";
const RENDER_API = "https://disaster-response-platform-c1tf.onrender.com";
const LOCAL_API = "http://localhost:4000";

// API health check and fallback
const checkAPIHealth = async (url) => {
  try {
    // Real health check
    const response = await axios.get(`${url}/disasters`, { 
      timeout: 6000,
      headers: {
        'x-user-id': 'citizen1'  // Required user ID header
      }
    });
    return response.status === 200;
  } catch (error) {
    console.error(`API check failed for ${url}:`, error.message);
    return false;
  }
};

// Track if we've shown the error toast to prevent duplicates
let hasShownErrorToast = false;

const getWorkingAPI = async () => {
    const apis = [
    VERCEL_API,  // First try Vercel
    RAILWAY_API, // Then try Railway
    RENDER_API,  // Then try Render
    LOCAL_API,   // Finally try local
  ];

  // Reset error toast flag if any API is working
  let anyApiWorking = false;
  
  for (const api of apis) {
    const isHealthy = await checkAPIHealth(api);
    if (isHealthy) {
      const apiDomain = new URL(api).hostname;
      console.log(`✅ Using ${apiDomain} API`);
      anyApiWorking = true;
      hasShownErrorToast = false; // Reset since we found a working API
      return api;
    }
  }

  // If we get here, no APIs are working
  console.log("❌ No API available, using default fallback");
  
  // Only show the error toast if we haven't shown it yet and no API is working
  if (!anyApiWorking && !hasShownErrorToast) {
    toast.error("⚠️ This project's backend service is currently inactive.\n\nThis might be due to the Supabase project being paused after 7 days of inactivity.\n\nFor any queries, please contact: karansingh5112002@gmail.com", {
      autoClose: 10000,
      position: "top-center",
      pauseOnHover: true,
      draggable: true,
      toastId: 'api-error' 
    });
    hasShownErrorToast = true;
  }
  
  return VERCEL_API; 
};

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

  // Track removed disasters (local only)
  const [removedDisasterIds, setRemovedDisasterIds] = useState([]);

  // Edit disaster state
  const [editDisaster, setEditDisaster] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location_name: "",
    tags: "",
  });

  // API state
  const [currentAPI, setCurrentAPI] = useState(VERCEL_API);
  const [apiStatus, setApiStatus] = useState("checking");

  // New state for disaster to delete
  const [disasterToDelete, setDisasterToDelete] = useState(null);

  // Initialize API on component mount
  useEffect(() => {
    const initializeAPI = async () => {
      setApiStatus("checking");
      const workingAPI = await getWorkingAPI();
      setCurrentAPI(workingAPI);
      setApiStatus("ready");
    };

    initializeAPI();
  }, []);

  // Fetch all disasters on mount
  useEffect(() => {
    if (apiStatus === "ready") {
      fetchDisasters();
    }
  }, [apiStatus]);

  // Fetch disasters from backend
  const fetchDisasters = async () => {
    try {
      const res = await axios.get(`${currentAPI}/disasters`);
      setDisasters(res.data);
    } catch (error) {
      toast.error("Error fetching disasters. Checking fallback...");
      console.error(error);
      // Try to switch API if current one fails
      const workingAPI = await getWorkingAPI();
      if (workingAPI !== currentAPI) {
        setCurrentAPI(workingAPI);
        toast.info("Switched to backup API");
        // Retry fetch
        try {
          const res = await axios.get(`${workingAPI}/disasters`);
          setDisasters(res.data);
        } catch (retryError) {
          toast.error("All APIs are down");
        }
      }
    }
  };

  // Fetch official updates using FEMA search via USA.gov
  const fetchOfficialUpdates = async (
    disasterId,
    disasterTitle,
    disasterLocation,
    refresh = false
  ) => {
    if (!disasterId) return;
    setUpdatesLoading(true);
    setOfficialUpdates([]);
    try {
      const res = await axios.get(
        `${currentAPI}/disasters/${disasterId}/official-updates`,
        {
          params: {
            title: disasterTitle,
            location_name: disasterLocation,
            refresh: refresh ? "true" : undefined,
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
        `${currentAPI}/mock-social-media/disaster/${disasterId}`,
        {
          params: {
            title: disasterTitle,
            location_name: disasterLocation,
          },
        }
      );

      // Fetch user posts
      const userRes = await axios.get(
        `${currentAPI}/mock-social-media/user-posts/${disasterId}`
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
      const res = await axios.post(`${currentAPI}/mock-social-media/create`, {
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
        `${currentAPI}/disasters`,
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
      const res = await axios.post(`${currentAPI}/gemini/extract-location`, {
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
      const res = await axios.post(`${currentAPI}/gemini/analyze-image`, {
        image_url: analysisImageUrl,
        text_context: analysisText, // Passed analysisText as context for image analysis
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

  // Remove disaster from list (local only)
  const handleRemoveDisaster = (id) => {
    setRemovedDisasterIds([...removedDisasterIds, id]);
  };

  // Delete disaster from backend
  const handleDeleteDisaster = async (id) => {
    try {
      await axios.delete(`${currentAPI}/disasters/${id}`);
      toast.success("Disaster permanently deleted!");
      fetchDisasters();
      if (selectedDisaster?.id === id) {
        setSelectedDisaster(null);
      }
    } catch (error) {
      toast.error("Failed to delete disaster.");
    } finally {
      setDisasterToDelete(null); // This will close the modal
    }
  };

  // After updating coordinates, update selected disaster and map
  const handleAddCoordinates = async () => {
    try {
      await axios.patch(`${currentAPI}/disasters/${selectedDisaster.id}`, {
        lat: parseFloat(geocodeResult.lat),
        lng: parseFloat(geocodeResult.lon),
      });
      toast.success("Coordinates added to disaster!");
      await fetchDisasters();
      const updated = disasters.find((d) => d.id === selectedDisaster.id);
      if (updated) setSelectedDisaster(updated);
    } catch (error) {
      toast.error("Failed to update coordinates");
    }
  };

  // Open edit form
  const handleEditDisaster = (d) => {
    setEditDisaster(d.id);
    setEditForm({
      title: d.title,
      description: d.description,
      location_name: d.location_name,
      tags: Array.isArray(d.tags) ? d.tags.join(", ") : d.tags || "",
    });
  };

  // Save edit
  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`${currentAPI}/disasters/${id}`, {
        ...editForm,
        tags: editForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
      });
      toast.success("Disaster updated!");
      setEditDisaster(null);
      fetchDisasters();
    } catch (error) {
      toast.error("Failed to update disaster.");
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditDisaster(null);
  };

  // New state for disaster to delete
  const promptDeleteDisaster = (id) => {
    setDisasterToDelete(id);
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
            disasters
              .filter((d) => !removedDisasterIds.includes(d.id))
              .map((d) => (
                <li
                  key={d.id}
                  onClick={() => handleSelectDisaster(d)}
                  className={`list-item ${
                    selectedDisaster?.id === d.id ? "selected" : ""
                  }`}
                  style={{ position: "relative" }}
                >
                  {/* Remove (X) icon top-right */}
                  <FontAwesomeIcon
                    icon={faTimes}
                    title="Remove from list"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveDisaster(d.id);
                    }}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      color: "#bbb",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      zIndex: 2,
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "#e74c3c")
                    }
                    onMouseOut={(e) => (e.currentTarget.style.color = "#bbb")}
                  />
                  <div className="flex justify-between items-start">
                    <div style={{ width: "100%" }}>
                      {editDisaster === d.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveEdit(d.id);
                          }}
                          className="modern-form"
                          style={{
                            background: "#f9f9f9",
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            className="modern-input"
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                title: e.target.value,
                              })
                            }
                            placeholder="Title"
                            required
                          />
                          <textarea
                            className="modern-input modern-textarea"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Description"
                            required
                          />
                          <input
                            className="modern-input"
                            value={editForm.location_name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                location_name: e.target.value,
                              })
                            }
                            placeholder="Location"
                            required
                          />
                          <input
                            className="modern-input"
                            value={editForm.tags}
                            onChange={(e) =>
                              setEditForm({ ...editForm, tags: e.target.value })
                            }
                            placeholder="Tags (comma separated)"
                          />
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary btn-small"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <h3 className="font-semibold text-lg mb-2">
                            {d.title}
                          </h3>
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
                                    style={{
                                      marginRight: "3px",
                                      fontSize: "0.8em",
                                    }}
                                  />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                      {/* Delete (trash) icon */}
                      <FontAwesomeIcon
                        icon={faTrash}
                        title="Delete permanently"
                        onClick={(e) => {
                          e.stopPropagation();
                          promptDeleteDisaster(d.id);
                        }}
                        style={{
                          color: "#bbb",
                          cursor: "pointer",
                          fontSize: "1.2rem",
                          marginLeft: "12px",
                          marginTop: "8px",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.color = "#c0392b")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.color = "#bbb")
                        }
                      />
                    </div>
                  </div>
                  {/* Edit (pencil) icon bottom-right */}
                  {editDisaster !== d.id && (
                    <FontAwesomeIcon
                      icon={faEdit}
                      title="Edit disaster"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDisaster(d);
                      }}
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        color: "#3498db",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        zIndex: 2,
                      }}
                    />
                  )}
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
                  disasters={disasters}
                  selectedDisaster={selectedDisaster}
                  onDisasterSelect={handleSelectDisaster}
                  socialMediaPosts={socialMediaPosts}
                  officialUpdates={officialUpdates}
                />
              </div>
            </div>

            {/* Right Column for Feeds */}
            <div className="space-y-6">
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
                    />{" "}
                    Add Post
                  </button>
                </div>
                {showPostForm && (
                  <form
                    onSubmit={handleCreatePost}
                    className="modern-form mb-4"
                  >
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
                    <div className="loading-spinner"></div> Loading social media
                    posts...
                  </div>
                ) : socialMediaPosts.length > 0 ? (
                  <div className="space-y-3">
                    {socialMediaPosts.slice(0, 5).map((post) => (
                      <div key={post.id} className="social-post">
                        <div className="post-header">
                          <div className="post-user">
                            <FontAwesomeIcon
                              icon={faUser}
                              style={{ marginRight: "5px" }}
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
                      style={{ marginRight: "5px" }}
                    />
                    No social media posts found.
                  </p>
                )}
              </div>

              {/* Official Updates Section */}
              <div>
                <h3 className="font-semibold mb-3">
                  <FontAwesomeIcon
                    icon={faBullhorn}
                    style={{
                      marginRight: "5px",
                      color: "var(--favicon-warning)",
                    }}
                  />
                  Official Updates
                </h3>
                <button
                  onClick={() =>
                    fetchOfficialUpdates(
                      selectedDisaster.id,
                      selectedDisaster.title,
                      selectedDisaster.location_name,
                      true
                    )
                  }
                  disabled={updatesLoading}
                  className="btn btn-secondary mb-3"
                >
                  {updatesLoading ? "Loading..." : "Refresh Official Updates"}
                </button>
                {updatesLoading && <div className="loader"></div>}
                <div className="official-updates-feed">
                  {officialUpdates.length > 0 ? (
                    officialUpdates.map((update) => (
                      <div
                        key={update.id}
                        className="official-update-post clickable-update"
                        onClick={() =>
                          update.url && window.open(update.url, "_blank")
                        }
                        style={{ cursor: update.url ? "pointer" : "default" }}
                        title={update.url ? "Click to view full article" : ""}
                      >
                        <div className="post-header">
                          <span className="post-user">
                            <FontAwesomeIcon icon={faBuilding} />{" "}
                            {update.agency}
                          </span>
                          <span className="post-timestamp">
                            {new Date(update.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="post-content">{update.update_text}</p>
                        {update.url && (
                          <div className="update-link-indicator">
                            <FontAwesomeIcon
                              icon={faExternalLinkAlt}
                              style={{
                                marginRight: "5px",
                                color: "var(--favicon-info)",
                                fontSize: "12px",
                              }}
                            />
                            Click to read full article
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      <FontAwesomeIcon
                        icon={faBullhorn}
                        style={{ marginRight: "5px" }}
                      />
                      No official updates found.
                    </p>
                  )}
                </div>
              </div>
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
                    onClick={handleAddCoordinates}
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

      {disasterToDelete && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
            <p>
              Are you sure you want to permanently delete this disaster report?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setDisasterToDelete(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDisaster(disasterToDelete)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

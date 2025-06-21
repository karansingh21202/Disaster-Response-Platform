import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// FontAwesome imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMap,
  faHospital,
  faComments,
  faFire as faFireIcon,
} from "@fortawesome/free-solid-svg-icons";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom icons for different disaster types
const createDisasterIcon = (type) => {
  const colors = {
    flood: "#0066cc",
    fire: "#ff4444",
    earthquake: "#ff8800",
    hurricane: "#9933cc",
    tornado: "#666666",
    storm: "#0099cc",
    default: "#666666",
  };

  return L.divIcon({
    className: "custom-disaster-marker",
    html: `<div style="
      background-color: ${colors[type] || colors.default};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Custom icons for resources
const createResourceIcon = (type) => {
  const icons = {
    hospital: "🏥",
    shelter: "🏠",
    police: "👮",
    fire: "🚒",
    food: "🍽️",
    water: "💧",
    medical: "💊",
  };

  return L.divIcon({
    className: "custom-resource-marker",
    html: `<div style="
      font-size: 24px;
      text-align: center;
      background: white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #333;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${icons[type] || "📍"}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Map Controls Component
const MapControls = ({
  onToggleDisasters,
  onToggleResources,
  onToggleSocialMedia,
  onToggleHeatmap,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 1000,
        background: "white",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        minWidth: "200px",
      }}
    >
      <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Map Layers</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label
          style={{ display: "flex", alignItems: "center", fontSize: "12px" }}
        >
          <input type="checkbox" defaultChecked onChange={onToggleDisasters} />
          <span style={{ marginLeft: "8px" }}>
            <FontAwesomeIcon icon={faMap} style={{ marginRight: "5px" }} />
            Disasters
          </span>
        </label>
        <label
          style={{ display: "flex", alignItems: "center", fontSize: "12px" }}
        >
          <input type="checkbox" defaultChecked onChange={onToggleResources} />
          <span style={{ marginLeft: "8px" }}>
            <FontAwesomeIcon icon={faHospital} style={{ marginRight: "5px" }} />
            Resources
          </span>
        </label>
        <label
          style={{ display: "flex", alignItems: "center", fontSize: "12px" }}
        >
          <input
            type="checkbox"
            defaultChecked
            onChange={onToggleSocialMedia}
          />
          <span style={{ marginLeft: "8px" }}>
            <FontAwesomeIcon icon={faComments} style={{ marginRight: "5px" }} />
            Social Media
          </span>
        </label>
        <label
          style={{ display: "flex", alignItems: "center", fontSize: "12px" }}
        >
          <input type="checkbox" onChange={onToggleHeatmap} />
          <span style={{ marginLeft: "8px" }}>
            <FontAwesomeIcon icon={faFireIcon} style={{ marginRight: "5px" }} />
            Heat Map
          </span>
        </label>
      </div>
    </div>
  );
};

// Legend Component
const MapLegend = () => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "10px",
        left: "10px",
        zIndex: 1000,
        background: "white",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        fontSize: "12px",
      }}
    >
      <h4 style={{ margin: "0 0 8px 0", fontSize: "12px" }}>Disaster Types</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#0066cc",
              borderRadius: "50%",
              marginRight: "8px",
            }}
          ></div>
          <span>Flood</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#ff4444",
              borderRadius: "50%",
              marginRight: "8px",
            }}
          ></div>
          <span>Fire</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#ff8800",
              borderRadius: "50%",
              marginRight: "8px",
            }}
          ></div>
          <span>Earthquake</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#9933cc",
              borderRadius: "50%",
              marginRight: "8px",
            }}
          ></div>
          <span>Hurricane</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#666666",
              borderRadius: "50%",
              marginRight: "8px",
            }}
          ></div>
          <span>Other</span>
        </div>
      </div>
    </div>
  );
};

const DisasterMap = ({
  disasters = [],
  selectedDisaster,
  onDisasterSelect,
  socialMediaPosts = [],
  officialUpdates = [],
}) => {
  const [showDisasters, setShowDisasters] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showSocialMedia, setShowSocialMedia] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Center of USA
  const [mapZoom, setMapZoom] = useState(4);
  const mapRef = useRef(null);

  // Mock resource data (in real app, this would come from API)
  const resources = [
    {
      id: 1,
      name: "Central Hospital",
      type: "hospital",
      lat: 40.7128,
      lng: -74.006,
      city: "New York",
    },
    {
      id: 2,
      name: "Emergency Shelter",
      type: "shelter",
      lat: 34.0522,
      lng: -118.2437,
      city: "Los Angeles",
    },
    {
      id: 3,
      name: "Police Station",
      type: "police",
      lat: 41.8781,
      lng: -87.6298,
      city: "Chicago",
    },
    {
      id: 4,
      name: "Fire Station",
      type: "fire",
      lat: 29.7604,
      lng: -95.3698,
      city: "Houston",
    },
    {
      id: 5,
      name: "Food Distribution Center",
      type: "food",
      lat: 33.749,
      lng: -84.388,
      city: "Atlanta",
    },
    {
      id: 6,
      name: "Water Supply Station",
      type: "water",
      lat: 32.7767,
      lng: -96.797,
      city: "Dallas",
    },
    {
      id: 7,
      name: "Medical Supply Depot",
      type: "medical",
      lat: 25.7617,
      lng: -80.1918,
      city: "Miami",
    },
  ];

  // Update map center when disaster is selected
  useEffect(() => {
    if (selectedDisaster && selectedDisaster.lat && selectedDisaster.lng) {
      setMapCenter([selectedDisaster.lat, selectedDisaster.lng]);
      setMapZoom(10);
    }
  }, [selectedDisaster]);

  // Get disaster type from title
  const getDisasterType = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("flood")) return "flood";
    if (titleLower.includes("fire") || titleLower.includes("wildfire"))
      return "fire";
    if (titleLower.includes("earthquake")) return "earthquake";
    if (titleLower.includes("hurricane")) return "hurricane";
    if (titleLower.includes("tornado")) return "tornado";
    if (titleLower.includes("storm")) return "storm";
    return "default";
  };

  // Generate mock coordinates for disasters that don't have them
  const getDisasterCoordinates = (disaster, index) => {
    if (disaster.lat && disaster.lng) {
      return [disaster.lat, disaster.lng];
    }

    // Mock coordinates based on location name or index
    const mockCoords = [
      [40.7128, -74.006], // New York
      [34.0522, -118.2437], // Los Angeles
      [41.8781, -87.6298], // Chicago
      [29.7604, -95.3698], // Houston
      [33.749, -84.388], // Atlanta
      [32.7767, -96.797], // Dallas
      [25.7617, -80.1918], // Miami
      [39.9526, -75.1652], // Philadelphia
      [40.4406, -79.9959], // Pittsburgh
      [42.3601, -71.0589], // Boston
    ];

    return mockCoords[index % mockCoords.length];
  };

  // Generate mock coordinates for social media posts
  const getSocialMediaCoordinates = (post, index) => {
    // Mock coordinates around the selected disaster
    if (selectedDisaster && selectedDisaster.lat && selectedDisaster.lng) {
      const baseLat = selectedDisaster.lat;
      const baseLng = selectedDisaster.lng;
      const offset = (index * 0.01) % 0.1; // Spread posts around
      return [baseLat + offset, baseLng + offset];
    }

    // Fallback to random coordinates
    return [
      39.8283 + (Math.random() - 0.5) * 10,
      -98.5795 + (Math.random() - 0.5) * 10,
    ];
  };

  return (
    <div style={{ position: "relative", height: "600px", width: "100%" }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Disaster Markers */}
        {showDisasters &&
          disasters.map((disaster, index) => {
            const coords = getDisasterCoordinates(disaster, index);
            const disasterType = getDisasterType(disaster.title);

            return (
              <Marker
                key={`disaster-${disaster.id}`}
                position={coords}
                icon={createDisasterIcon(disasterType)}
                eventHandlers={{
                  click: () => onDisasterSelect(disaster),
                }}
              >
                <Popup>
                  <div style={{ minWidth: "200px" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
                      {disaster.title}
                    </h4>
                    <p style={{ margin: "4px 0", fontSize: "12px" }}>
                      <strong>Location:</strong> {disaster.location_name}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "12px" }}>
                      <strong>Type:</strong>{" "}
                      {disasterType.charAt(0).toUpperCase() +
                        disasterType.slice(1)}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "12px" }}>
                      <strong>Status:</strong> Active
                    </p>
                    <button
                      onClick={() => onDisasterSelect(disaster)}
                      style={{
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        cursor: "pointer",
                        marginTop: "8px",
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
                <Tooltip permanent={false}>
                  {disaster.title} - {disaster.location_name}
                </Tooltip>
              </Marker>
            );
          })}

        {/* Resource Markers */}
        {showResources &&
          resources.map((resource) => (
            <Marker
              key={`resource-${resource.id}`}
              position={[resource.lat, resource.lng]}
              icon={createResourceIcon(resource.type)}
            >
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
                    {resource.name}
                  </h4>
                  <p style={{ margin: "4px 0", fontSize: "12px" }}>
                    <strong>Type:</strong>{" "}
                    {resource.type.charAt(0).toUpperCase() +
                      resource.type.slice(1)}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: "12px" }}>
                    <strong>Location:</strong> {resource.city}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: "12px" }}>
                    <strong>Status:</strong> Available
                  </p>
                </div>
              </Popup>
              <Tooltip permanent={false}>
                {resource.name} ({resource.type})
              </Tooltip>
            </Marker>
          ))}

        {/* Social Media Post Markers */}
        {showSocialMedia &&
          socialMediaPosts.slice(0, 10).map((post, index) => {
            const coords = getSocialMediaCoordinates(post, index);

            return (
              <Marker
                key={`social-${post.id || index}`}
                position={coords}
                icon={L.divIcon({
                  className: "custom-social-marker",
                  html: `<div style="
                  background-color: #1da1f2;
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  border: 1px solid white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                "></div>`,
                  iconSize: [8, 8],
                  iconAnchor: [4, 4],
                })}
              >
                <Popup>
                  <div style={{ minWidth: "200px", maxWidth: "250px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "#1da1f2", fontSize: "12px" }}>
                        @{post.user}
                      </strong>
                      {post.verified && (
                        <span
                          style={{
                            color: "#28a745",
                            marginLeft: "5px",
                            fontSize: "12px",
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: "8px 0",
                        lineHeight: "1.3",
                        fontSize: "11px",
                      }}
                    >
                      {post.post.length > 100
                        ? post.post.substring(0, 100) + "..."
                        : post.post}
                    </p>
                    <div style={{ fontSize: "10px", color: "#6c757d" }}>
                      {new Date(post.timestamp).toLocaleString()}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Impact Radius for Selected Disaster */}
        {selectedDisaster && selectedDisaster.lat && selectedDisaster.lng && (
          <Circle
            center={[selectedDisaster.lat, selectedDisaster.lng]}
            radius={5000} // 5km radius
            pathOptions={{
              color: "#ff4444",
              fillColor: "#ff4444",
              fillOpacity: 0.1,
              weight: 2,
            }}
          >
            <Tooltip permanent={false}>
              Impact Zone: 5km radius around {selectedDisaster.title}
            </Tooltip>
          </Circle>
        )}

        {/* Heat Map Layer (Mock) */}
        {showHeatmap &&
          selectedDisaster &&
          selectedDisaster.lat &&
          selectedDisaster.lng && (
            <Circle
              center={[selectedDisaster.lat, selectedDisaster.lng]}
              radius={3000}
              pathOptions={{
                color: "#ff8800",
                fillColor: "#ff8800",
                fillOpacity: 0.3,
                weight: 1,
              }}
            >
              <Tooltip permanent={false}>High Impact Area</Tooltip>
            </Circle>
          )}
      </MapContainer>

      {/* Map Controls */}
      <MapControls
        onToggleDisasters={() => setShowDisasters(!showDisasters)}
        onToggleResources={() => setShowResources(!showResources)}
        onToggleSocialMedia={() => setShowSocialMedia(!showSocialMedia)}
        onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
      />

      {/* Map Legend */}
      <MapLegend />

      {/* Map Info Panel */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          fontSize: "12px",
          maxWidth: "200px",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", fontSize: "12px" }}>Map Info</h4>
        <p style={{ margin: "4px 0", fontSize: "11px" }}>
          <strong>Disasters:</strong> {disasters.length}
        </p>
        <p style={{ margin: "4px 0", fontSize: "11px" }}>
          <strong>Resources:</strong> {resources.length}
        </p>
        <p style={{ margin: "4px 0", fontSize: "11px" }}>
          <strong>Social Posts:</strong> {socialMediaPosts.length}
        </p>
        {selectedDisaster && (
          <p style={{ margin: "4px 0", fontSize: "11px", color: "#007bff" }}>
            <strong>Selected:</strong> {selectedDisaster.title}
          </p>
        )}
      </div>
    </div>
  );
};

export default DisasterMap;

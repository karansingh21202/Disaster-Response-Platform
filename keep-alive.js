const axios = require("axios");

const KEEP_ALIVE_URL = "https://disaster-response-platform-c1tf.onrender.com";

async function keepAlive() {
  try {
    await axios.get(KEEP_ALIVE_URL);
    console.log("✅ Server kept alive:", new Date().toISOString());
  } catch (error) {
    console.log("❌ Keep-alive failed:", error.message);
  }
}

// Ping every 10 minutes
setInterval(keepAlive, 10 * 60 * 1000);
keepAlive(); // Initial ping

console.log("🚀 Keep-alive script started for:", KEEP_ALIVE_URL);
console.log("⏰ Will ping every 10 minutes...");

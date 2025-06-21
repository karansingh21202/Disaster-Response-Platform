require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { Server } = require("socket.io");
const disastersRouter = require("./routes/disasters");
const geocodeRouter = require("./routes/geocode");
const mockSocialMediaRouter = require("./routes/mockSocialMedia");
const mockAuth = require("./utils/auth");
const { extractLocation, verifyImage } = require("./services/geminiService");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(mockAuth);

// Supabase client setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Disaster Response Coordination Platform API");
});

app.use("/disasters", disastersRouter);
app.use("/geocode", geocodeRouter);
app.use("/mock-social-media", mockSocialMediaRouter);

// New Gemini AI Analysis Routes
app.post("/gemini/extract-location", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text description is required." });
    }
    const result = await extractLocation(text);
    res.json({ result });
  } catch (error) {
    console.error("Error in /gemini/extract-location:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to extract location." });
  }
});

app.post("/gemini/analyze-image", async (req, res) => {
  try {
    const { image_url, text_context } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: "Image URL is required." });
    }
    const result = await verifyImage(image_url, text_context);
    res.json({ result });
  } catch (error) {
    console.error("Error in /gemini/analyze-image:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to analyze image." });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

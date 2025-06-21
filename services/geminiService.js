const { GoogleGenAI } = require("@google/genai");
const { getCache, setCache } = require("./cacheService");
const mimeTypes = require("mime-types");
const axios = require("axios");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function extractLocation(description) {
  const cacheKey = `gemini_location_${Buffer.from(description).toString(
    "base64"
  )}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  // System prompt for concise, web-app friendly output
  const SYSTEM_PROMPT = `You are an assistant for a disaster response web app. When asked for disaster locations, always search for the most recent, exact locations affected, and output ONLY a concise, point-wise list of locations (district, city, village, or area), each with a one-liner description if needed. Do not include explanations, context, or historical summaries. Your output must be ready for direct display in a web app.Do not concise your putput for only one type of disaster be open`;

  let prompt = `${SYSTEM_PROMPT}\n${description}`;
  if (description.length > 500) {
    prompt = `${SYSTEM_PROMPT}\nThe following description is long. Extract only the most recent, exact locations affected by  related disaster, in a concise, point-wise list. Description: "${description.slice(
      0,
      500
    )}..."`;
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const location = response.text || "";
    await setCache(cacheKey, location);
    return location;
  } catch (err) {
    console.error("Gemini SDK error:", err.message);
    return "Could not extract place names. Please try with a shorter or clearer description.";
  }
}

async function verifyImage(imageUrl, description = "") {
  const cacheKey = `gemini_verify_${Buffer.from(
    imageUrl + description
  ).toString("base64")}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  let shortDesc = description;
  if (shortDesc.length > 500) shortDesc = shortDesc.slice(0, 500) + "...";
  const promptText = `Analyze this image. ${
    shortDesc ? "Context: " + shortDesc : ""
  } (1) Does it show a real disaster scene? If yes, explain the disaster context clearly and simply (what, where, how severe). (2) Does the image appear manipulated, fake, or AI-generated? If so, mention it. Keep the answer concise but informative.`;

  try {
    // Fetch the image data
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const imageBuffer = Buffer.from(imageResponse.data);
    const imageMimeType =
      mimeTypes.lookup(imageUrl) || imageResponse.headers["content-type"];

    if (!imageMimeType || !imageMimeType.startsWith("image/")) {
      throw new Error("Invalid or unsupported image URL/type.");
    }

    const contents = [
      { text: promptText },
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: imageMimeType,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contents,
    });
    const result = response.text || "";
    await setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error("Gemini image verify error:", err.message);
    // Log the full error object for more details in development
    // console.error("Full error:", err);
    return `Could not analyze the image. Please check the image URL or try again later. Error: ${err.message}`;
  }
}

async function getGeminiResponse(prompt, imageUrl = null) {
  try {
    let contents = [{ text: prompt }];

    if (imageUrl) {
      const mimeType = mimeTypes.lookup(imageUrl);
      if (!mimeType) {
        throw new Error("Could not determine MIME type for the image URL.");
      }
      contents = [
        { text: prompt },
        {
          inlineData: {
            data: Buffer.from(await getImageBufferFromUrl(imageUrl)).toString(
              "base64"
            ),
            mimeType: mimeType,
          },
        },
      ];
      const result = await ai.models.generateContent({
        model: "gemini-pro-vision",
        contents,
      });
      const response = await result.response;
      return response.text();
    } else {
      const result = await ai.models.generateContent({
        model: "gemini-pro",
        contents,
      });
      const response = await result.response;
      return response.text();
    }
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    throw error;
  }
}

module.exports = { extractLocation, verifyImage, getGeminiResponse };

const axios = require("axios");
const { getCache, setCache } = require("./cacheService");

async function geocodeLocation(locationName) {
  const cacheKey = `geocode_${Buffer.from(locationName).toString("base64")}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    locationName
  )}`;
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "DisasterResponseApp/1.0" },
  });
  const result =
    data && data.length > 0
      ? {
          lat: data[0].lat,
          lon: data[0].lon,
          display_name: data[0].display_name,
        }
      : null;
  await setCache(cacheKey, result);
  return result;
}

module.exports = { geocodeLocation };

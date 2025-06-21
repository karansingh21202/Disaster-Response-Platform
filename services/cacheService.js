const supabase = require("./supabase");

async function getCache(key) {
  const { data, error } = await supabase
    .from("cache")
    .select("value, expires_at")
    .eq("key", key)
    .single();
  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  return data.value;
}

async function setCache(key, value, ttlSeconds = 3600) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await supabase
    .from("cache")
    .upsert({ key, value, expires_at: expiresAt }, { onConflict: ["key"] });
}

async function clearCache(pattern) {
  try {
    // Convert pattern to SQL LIKE pattern
    const likePattern = pattern.replace(/\*/g, "%");

    // First, get all matching keys
    const { data, error } = await supabase
      .from("cache")
      .select("key")
      .ilike("key", likePattern);

    if (error) {
      console.error("Error fetching cache keys for deletion:", error);
      return;
    }

    if (!data || data.length === 0) {
      console.log("No cache entries found matching pattern:", pattern);
      return;
    }

    // Extract keys to delete
    const keysToDelete = data.map((item) => item.key);

    // Delete all matching entries
    const { error: deleteError } = await supabase
      .from("cache")
      .delete()
      .in("key", keysToDelete);

    if (deleteError) {
      console.error("Error deleting cache entries:", deleteError);
    } else {
      console.log(
        `Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`
      );
    }
  } catch (error) {
    console.error("Error in clearCache:", error);
  }
}

module.exports = { getCache, setCache, clearCache };

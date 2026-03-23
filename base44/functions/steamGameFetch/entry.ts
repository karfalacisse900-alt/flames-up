import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// In-memory cache with TTL (10 minutes)
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_TTL;
}

async function fetchFromSteam(appId) {
  try {
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
    const data = await response.json();
    
    if (!data[appId].success) {
      throw new Error("Steam API error");
    }
    
    const gameData = data[appId].data;
    return {
      name: gameData.name,
      header_image: gameData.header_image,
      short_description: gameData.short_description,
      price_formatted: gameData.price_overview?.final_formatted || "Free to Play",
      platforms: {
        windows: gameData.platforms?.windows || false,
        mac: gameData.platforms?.mac || false,
        linux: gameData.platforms?.linux || false,
      },
      release_date: gameData.release_date?.date || "TBA",
      developers: gameData.developers?.[0] || "Unknown",
      publishers: gameData.publishers?.[0] || "Unknown",
    };
  } catch (error) {
    console.error(`Steam fetch error for ${appId}:`, error);
    throw error;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { appIds } = await req.json();

    if (!appIds || !Array.isArray(appIds)) {
      return Response.json({ error: "Invalid appIds" }, { status: 400 });
    }

    const results = {};

    for (const appId of appIds) {
      // Check cache first
      if (cache[appId] && isCacheValid(cache[appId].timestamp)) {
        results[appId] = cache[appId].data;
        continue;
      }

      // Fetch from Steam
      const gameData = await fetchFromSteam(appId);
      cache[appId] = {
        data: gameData,
        timestamp: Date.now(),
      };
      results[appId] = gameData;
    }

    return Response.json({ games: results });
  } catch (error) {
    console.error("Steam fetch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
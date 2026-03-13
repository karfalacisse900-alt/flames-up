import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req);

    // Parse payload from POST body
    let payload = {};
    if (req.method === 'POST') {
      try {
        payload = await req.json();
      } catch (_) {}
    }

    const query = payload.q || '';
    const limit = payload.limit || '20';
    const normalizedQuery = String(query).trim().toLowerCase();

    const apiKey = Deno.env.get('GIPHY_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GIPHY_API_KEY not configured' }, { status: 500 });
    }

    const giphyUrl = new URL(
      !normalizedQuery || normalizedQuery === 'trending'
        ? 'https://api.giphy.com/v1/gifs/trending'
        : 'https://api.giphy.com/v1/gifs/search'
    );
    giphyUrl.searchParams.append('api_key', apiKey);
    if (normalizedQuery && normalizedQuery !== 'trending') {
      giphyUrl.searchParams.append('q', query);
      giphyUrl.searchParams.append('lang', 'en');
    }
    giphyUrl.searchParams.append('limit', limit);
    giphyUrl.searchParams.append('rating', 'pg-13');

    const response = await fetch(giphyUrl.toString());

    if (!response.ok) {
      return Response.json({ error: 'GIPHY API error' }, { status: response.status });
    }

    const data = await response.json();

    // Transform to return only necessary fields
    const gifs = data.data.map((gif) => ({
      id: gif.id,
      title: gif.title,
      url: gif.images.downsized.url,
      preview: gif.images.fixed_height_small.url,
      width: gif.images.downsized.width,
      height: gif.images.downsized.height,
    }));

    return Response.json({
      data: gifs,
      gifs,
      pagination: {
        count: gifs.length,
        total: data.pagination?.total_count || 0,
      },
    });
  } catch (error) {
    console.error('GIPHY search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
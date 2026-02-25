import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '20';

    if (!query.trim()) {
      return Response.json({ data: [], pagination: { count: 0 } });
    }

    const apiKey = Deno.env.get('GIPHY_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GIPHY_API_KEY not configured' }, { status: 500 });
    }

    const giphyUrl = new URL('https://api.giphy.com/v1/gifs/search');
    giphyUrl.searchParams.append('api_key', apiKey);
    giphyUrl.searchParams.append('q', query);
    giphyUrl.searchParams.append('limit', limit);
    giphyUrl.searchParams.append('rating', 'pg-13');
    giphyUrl.searchParams.append('lang', 'en');

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
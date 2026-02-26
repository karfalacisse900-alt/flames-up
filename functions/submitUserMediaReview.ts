import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { media_id, media_type, rating, review_text } = await req.json();

    if (!media_id || !media_type || !rating || !review_text) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return Response.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const review = await base44.entities.UserMediaReview.create({
      media_id,
      media_type,
      rating,
      review_text,
      reviewer_email: user.email,
      reviewer_name: user.full_name,
      status: "pending",
    });

    return Response.json({
      success: true,
      review,
      message: "Review submitted! Awaiting admin approval."
    });
  } catch (error) {
    console.error("Review submission error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { media_type, title, creator, genre, description, image_url } = await req.json();

    if (!media_type || !title || !creator || !description) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const submission = await base44.entities.UserSubmittedMedia.create({
      media_type,
      title,
      creator,
      genre,
      description,
      image_url,
      status: "pending",
      submitted_by_email: user.email,
      submitted_by_name: user.full_name,
    });

    return Response.json({ 
      success: true,
      submission,
      message: "Submission received! Awaiting admin approval."
    });
  } catch (error) {
    console.error("Submission error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
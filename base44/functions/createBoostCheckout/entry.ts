import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const BOOST_PRICES = {
  "24h":       { cents: 300,  label: "Boost 24 Hours",       days: 1 },
  "3day":      { cents: 800,  label: "Boost 3 Days",         days: 3 },
  "spotlight": { cents: 2000, label: "Featured Spotlight",   days: 7 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { content_type, content_id, boost_level } = await req.json();
    if (!content_type || !content_id || !boost_level) {
      return Response.json({ error: "content_type, content_id, boost_level required" }, { status: 400 });
    }

    const boost = BOOST_PRICES[boost_level];
    if (!boost) return Response.json({ error: "Invalid boost_level" }, { status: 400 });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), { apiVersion: "2023-10-16" });

    const origin = req.headers.get("origin") || "https://app.base44.com";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: boost.cents,
          product_data: {
            name: boost.label,
            description: `Boost your ${content_type} for ${boost.days} day${boost.days > 1 ? "s" : ""}`,
          },
        },
        quantity: 1,
      }],
      success_url: `${origin}?boost_success=1&content_id=${content_id}`,
      cancel_url: `${origin}?boost_cancel=1`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_email: user.email,
        content_type,
        content_id,
        boost_level,
      },
    });

    // Pre-create BoostOrder record in pending state
    await base44.asServiceRole.entities.BoostOrder.create({
      content_type,
      content_id,
      user_email: user.email,
      boost_level,
      amount_cents: boost.cents,
      stripe_session_id: session.id,
      status: "pending",
    });

    console.log(`[BOOST] Created checkout session ${session.id} for ${user.email} - ${boost_level}`);
    return Response.json({ url: session.url, session_id: session.id });

  } catch (error) {
    console.error("[BOOST] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
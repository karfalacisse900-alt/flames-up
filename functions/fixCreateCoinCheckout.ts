import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@15.4.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const coinBundles = [
  { priceId: "price_1T2Fuf5bPx2iiXNaPUaZa12n", coins: 100 },
  { priceId: "price_1T2Fuf5bPx2iiXNanCtYX1oQ", coins: 500 },
  { priceId: "price_1T2Fuf5bPx2iiXNakD2rUJdx", coins: 1500 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body;

    if (!priceId) {
      return Response.json({ error: "Missing priceId" }, { status: 400 });
    }

    const bundle = coinBundles.find(b => b.priceId === priceId);
    if (!bundle) {
      return Response.json({ error: "Invalid price ID" }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/Shop?checkout=success`,
      cancel_url: `${origin}/Shop?checkout=cancelled`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_email: user.email,
        coins: bundle.coins,
      },
    });

    if (!session || !session.id) {
      throw new Error("Failed to create checkout session");
    }

    return Response.json({ 
      sessionId: session.id,
      success: true 
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ 
      error: error.message || "Failed to create checkout session",
      details: error.toString()
    }, { status: 500 });
  }
});
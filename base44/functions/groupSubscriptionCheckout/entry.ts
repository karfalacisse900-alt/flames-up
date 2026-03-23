import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.0.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), { apiVersion: "2024-12-15.acpi" });

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { groupId, groupName, monthlyFee, userEmail } = await req.json();

    if (!groupId || !monthlyFee || monthlyFee <= 0) {
      return new Response(JSON.stringify({ error: "Invalid group or price" }), { status: 400 });
    }

    // Create or retrieve product for this group
    const products = await stripe.products.list({ query: `metadata["group_id"]:"${groupId}"` });
    let product = products.data[0];

    if (!product) {
      product = await stripe.products.create({
        name: `${groupName} - Monthly Subscription`,
        description: `Monthly membership for ${groupName}`,
        metadata: { group_id: groupId },
      });
    }

    // Create price
    const prices = await stripe.prices.list({ product: product.id, active: true });
    let price = prices.data.find(p => p.unit_amount === Math.round(monthlyFee * 100));

    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(monthlyFee * 100),
        currency: "usd",
        recurring: { interval: "month" },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/Groups?subscribed=true&group=${groupId}`,
      cancel_url: `${req.headers.get("origin")}/Groups?cancelled=true`,
      customer_email: userEmail,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        group_id: groupId,
        user_email: userEmail,
        group_name: groupName,
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Store code on user entity
    await base44.auth.updateMe({ email_verify_code: code, email_verify_expires: expiresAt });

    // Send via built-in email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: "Your Flames-Up Verification Code",
      body: `Hi ${user.full_name || 'there'},\n\nYour host verification code is:\n\n  ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n— The Flames-Up Team`
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendVerificationEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
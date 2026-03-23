import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { code, type } = await req.json();

    if (type === 'email') {
      if (!user.email_verify_code || !user.email_verify_expires) {
        return Response.json({ success: false, error: 'No code found. Please request a new one.' });
      }
      if (new Date() > new Date(user.email_verify_expires)) {
        return Response.json({ success: false, error: 'Code expired. Please request a new one.' });
      }
      if (code.trim() !== user.email_verify_code) {
        return Response.json({ success: false, error: 'Incorrect code. Please try again.' });
      }
      await base44.auth.updateMe({ is_email_verified: true, email_verify_code: null, email_verify_expires: null });
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: 'Unknown verification type' });
  } catch (error) {
    console.error('checkVerificationCode error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
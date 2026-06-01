import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await base44.asServiceRole.entities.ContactMessage.create({ name, email, message, read: false });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
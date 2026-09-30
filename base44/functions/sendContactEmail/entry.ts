import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const esc = (s: unknown) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return Response.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
      return Response.json({ error: "Invalid input types." }, { status: 400 });
    }

    if (name.length > 200 || email.length > 200 || message.length > 5000) {
      return Response.json({ error: "Input exceeds allowed length." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: "Invalid email address format." }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: "Hoordad.sedaghat@gmail.com",
      subject: `Contact from ${esc(name)} <${esc(email)}>`,
      body: `Name: ${esc(name)}<br>Email: ${esc(email)}<br><br>${esc(message).replace(/\n/g, "<br>")}`,
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("sendContactEmail error:", error?.message || error);
    return Response.json({ error: error?.message || "Failed to send email." }, { status: 500 });
  }
}
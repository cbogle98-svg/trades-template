// Cloudflare Pages Function: contact form handler
//
// Endpoint: POST /api/contact
//
// Receives a form submission, verifies the Cloudflare Turnstile token,
// runs basic spam checks, and forwards the submission as an email via
// Resend to the configured recipient.
//
// Required environment variables (set as repo/CF secrets):
//   RESEND_API_KEY        — Resend API key (re_...)
//   TURNSTILE_SECRET_KEY  — Cloudflare Turnstile secret key (server-side verify)
//
// Required build-time config (in client.json → contact.recipientEmail):
//   recipientEmail        — where form submissions get delivered
//
// Returns JSON: { ok: true } on success or { ok: false, error: "..." } on failure.

interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  recipient_email?: string;
  subject_prefix?: string;
  business_name?: string;
  // Honeypot — real users never fill this; bots usually do.
  website?: string;
  // Turnstile token — required.
  "cf-turnstile-response"?: string;
}

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Strip CR/LF so user input can't inject extra email headers via subject / reply-to.
const stripCrlf = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

// Conservative per-field length caps. Blocks unbounded payloads and makes abuse cheap.
const LIMITS = {
  name: 200,
  email: 320,
  phone: 50,
  message: 5000,
  businessName: 200,
} as const;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // ── Parse the form payload ───────────────────────────────────────
  let data: ContactPayload;
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      data = Object.fromEntries(form.entries()) as ContactPayload;
    } else {
      return json(400, { ok: false, error: "Unsupported content type" });
    }
  } catch {
    return json(400, { ok: false, error: "Invalid request body" });
  }

  // ── Honeypot check ───────────────────────────────────────────────
  if (data.website && data.website.trim().length > 0) {
    // Pretend success so the bot doesn't retry.
    return json(200, { ok: true });
  }

  // ── Required fields ──────────────────────────────────────────────
  const name = (data.name || "").trim();
  const email = (data.email || "").trim();
  const message = (data.message || "").trim();
  const phone = (data.phone || "").trim();
  const recipient = (data.recipient_email || "").trim();
  const subjectPrefix = (data.subject_prefix || "New website inquiry").trim();
  const businessName = (data.business_name || "").trim();

  if (!name || !email || !message) {
    return json(400, {
      ok: false,
      error: "Name, email, and message are all required.",
    });
  }

  if (!recipient) {
    return json(500, {
      ok: false,
      error: "Recipient email is not configured. Contact the site owner.",
    });
  }

  // Basic email shape validation (real validation is impossible client-side)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, error: "Please enter a valid email address." });
  }

  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    phone.length > LIMITS.phone ||
    message.length > LIMITS.message ||
    businessName.length > LIMITS.businessName
  ) {
    return json(400, { ok: false, error: "One or more fields exceeded the maximum length." });
  }

  // ── Turnstile verification ───────────────────────────────────────
  const turnstileToken = data["cf-turnstile-response"];
  if (!turnstileToken) {
    return json(400, { ok: false, error: "Captcha token missing. Please refresh and try again." });
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    return json(500, {
      ok: false,
      error: "Captcha is not configured. Contact the site owner.",
    });
  }

  const turnstileVerify = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: request.headers.get("CF-Connecting-IP") || "",
      }),
    }
  );

  const turnstileResult = (await turnstileVerify.json()) as { success: boolean };
  if (!turnstileResult.success) {
    return json(400, {
      ok: false,
      error: "Captcha verification failed. Please try again.",
    });
  }

  // ── Send email via Resend ────────────────────────────────────────
  if (!env.RESEND_API_KEY) {
    return json(500, {
      ok: false,
      error: "Email service is not configured. Contact the site owner.",
    });
  }

  const subjectLine = stripCrlf(`${subjectPrefix} — ${name}`);

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1C1917; color: #FAFAF9; padding: 20px 24px;">
        <h2 style="margin: 0; font-weight: 300; letter-spacing: 1px;">
          New Inquiry${businessName ? " — " + escapeHtml(businessName) : ""}
        </h2>
      </div>
      <div style="padding: 24px; background: #FAFAF9; color: #44403C;">
        <p style="margin: 0 0 16px 0;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin: 0 0 16px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        ${phone ? `<p style="margin: 0 0 16px 0;"><strong>Phone:</strong> <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>` : ""}
        <p style="margin: 24px 0 8px 0;"><strong>Message:</strong></p>
        <div style="background: white; border-left: 3px solid #D97706; padding: 16px; white-space: pre-wrap;">${escapeHtml(message)}</div>
        <p style="margin: 24px 0 0 0; color: #A8A29E; font-size: 12px;">
          Sent from your website contact form. Reply directly to this email to respond to ${escapeHtml(name)}.
        </p>
      </div>
    </div>
  `;

  const textBody = `New inquiry${businessName ? " — " + businessName : ""}

Name: ${name}
Email: ${email}${phone ? "\nPhone: " + phone : ""}

Message:
${message}

— Sent from your website contact form. Reply directly to this email.`;

  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: "Bosque Works Forms <forms@mail.bosqueworks.com>",
      to: [recipient],
      reply_to: email,
      subject: subjectLine,
      html: htmlBody,
      text: textBody,
    }),
  });

  if (!resendResp.ok) {
    const errBody = await resendResp.text();
    console.error("Resend send failed:", resendResp.status, errBody);
    return json(502, {
      ok: false,
      error: "Failed to send your message. Please try again, or call instead.",
    });
  }

  return json(200, { ok: true });
};

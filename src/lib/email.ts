import nodemailer from "nodemailer";

// Default sender shown on all outbound TaskFlow emails.
export const EMAIL_FROM = process.env.EMAIL_FROM || '"TaskFlow" <noreply@taskflow.app>';

/**
 * Normalize an email address for lookup and delivery.
 * Lowercases and trims so `User@Example.com` matches the stored value.
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal auto test account fallback for testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("Email: Created Ethereal test account:", testAccount.user);
    } catch {
      // Stub fallback
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
  return transporter;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: EMAIL_FROM,
      to: normalizeEmail(to),
      subject,
      html,
    });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log("Email preview:", preview);
    return info;
  } catch (err: any) {
    console.error("Email send failed:", err?.message);
    return null;
  }
}

/**
 * Send a password-reset email with a time-limited link.
 * The caller generates the token and expiry; this only delivers the message.
 */
export async function sendPasswordResetEmail(email: string, name: string, resetLink: string) {
  return sendEmail({
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <div style="font-family:Inter,system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#f8fafc;border-radius:12px;border:1px solid #1e293b">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
          <div style="width:28px;height:28px;background:#6366f1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">TF</div>
          <span style="font-weight:600;font-size:18px;letter-spacing:-0.5px;">TaskFlow</span>
        </div>
        <h2 style="font-weight:600;margin-bottom:8px;font-size:20px;">Reset your password</h2>
        <p style="color:#94a3b8;margin-bottom:24px;line-height:1.6;">Hi ${name}, click the button below to set a new password. This link will expire in 30 minutes.</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;box-shadow:0 4px 12px rgba(99,102,241,0.3)">Reset Password</a>
        <p style="color:#64748b;font-size:12px;margin-top:32px;border-top:1px solid #1e293b;padding-top:16px;">If you didn't request this email, you can safely ignore it.</p>
      </div>`,
  });
}

export async function sendProjectInviteEmail(email: string, inviterName: string, projectName: string, inviteLink: string) {
  return sendEmail({
    to: email,
    subject: `${inviterName} invited you to join "${projectName}" on TaskFlow`,
    html: `
      <div style="font-family:Inter,system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#f8fafc;border-radius:12px;border:1px solid #1e293b">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
          <div style="width:28px;height:28px;background:#6366f1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">TF</div>
          <span style="font-weight:600;font-size:18px;letter-spacing:-0.5px;">TaskFlow</span>
        </div>
        <h2 style="font-weight:600;margin-bottom:8px;font-size:20px;">You've been invited!</h2>
        <p style="color:#94a3b8;margin-bottom:12px;line-height:1.6;"><strong style="color:#f8fafc">${inviterName}</strong> invited you to collaborate on <strong style="color:#818cf8">${projectName}</strong>.</p>
        <p style="color:#94a3b8;margin-bottom:24px;line-height:1.6;">Join your team to manage tasks, track milestones, and stay aligned.</p>
        <a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;box-shadow:0 4px 12px rgba(99,102,241,0.3)">Accept Invitation</a>
        <p style="color:#64748b;font-size:12px;margin-top:32px;border-top:1px solid #1e293b;padding-top:16px;">This invitation will expire in 48 hours.</p>
      </div>`,
  });
}

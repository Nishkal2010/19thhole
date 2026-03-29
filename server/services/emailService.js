const nodemailer = require('nodemailer');
const { pool } = require('../db/database');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function welcomeEmailHtml(name, unsubscribeUrl) {
  const greeting = name ? `Hey ${name},` : 'Hey there,';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#161616;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #2A2A2A;">
            <p style="margin:0;font-size:11px;font-weight:500;letter-spacing:2px;color:#C9A84C;text-transform:uppercase;">The 19th Hole</p>
            <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;color:#FFFFFF;">You're in. ⛳</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:15px;color:#E0E0E0;line-height:1.7;">${greeting}</p>
            <p style="margin:0 0 16px;font-size:15px;color:#E0E0E0;line-height:1.7;">
              You're in. Every day we'll send you the 5-minute golf briefing that covers both tours — no fluff, no filler. Just the good stuff.
            </p>
            <p style="margin:0 0 32px;font-size:15px;color:#E0E0E0;line-height:1.7;">
              Your first briefing arrives tomorrow morning at <strong style="color:#C9A84C;">7:00 AM</strong>.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C9A84C;border-radius:8px;">
                  <a href="${process.env.CLIENT_URL || 'https://the19thhole.vercel.app'}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#000000;text-decoration:none;">
                    Open The 19th Hole
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #2A2A2A;">
            <p style="margin:0;font-size:12px;color:#505050;line-height:1.6;">
              You're receiving this because you subscribed at The 19th Hole.<br>
              <a href="${unsubscribeUrl}" style="color:#505050;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function newsletterEmailHtml(briefingContent, date, unsubscribeUrl) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const bodyHtml = briefingContent
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#FFFFFF;">$1</strong>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 16px;font-size:15px;color:#C8C8C8;line-height:1.8;">')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#161616;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #2A2A2A;">
            <p style="margin:0;font-size:11px;font-weight:500;letter-spacing:2px;color:#C9A84C;text-transform:uppercase;">The 19th Hole</p>
            <h1 style="margin:8px 0 4px;font-size:22px;font-weight:700;color:#FFFFFF;">Your Daily Golf Briefing</h1>
            <p style="margin:0;font-size:13px;color:#707070;">${formattedDate}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:15px;color:#C8C8C8;line-height:1.8;">${bodyHtml}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C9A84C;border-radius:8px;">
                  <a href="${process.env.CLIENT_URL || 'https://the19thhole.vercel.app'}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#000000;text-decoration:none;">
                    Read More
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #2A2A2A;">
            <p style="margin:0;font-size:12px;color:#505050;line-height:1.6;">
              5 minutes. Both tours. No fluff.<br>
              <a href="${unsubscribeUrl}" style="color:#505050;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendWelcomeEmail(email, name) {
  const transporter = createTransporter();
  const appUrl = process.env.CLIENT_URL || 'https://the19thhole.vercel.app';
  const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
  await transporter.sendMail({
    from: `"The 19th Hole" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to The 19th Hole ⛳',
    html: welcomeEmailHtml(name, unsubscribeUrl),
  });
}

async function sendNewsletterToAll(briefingContent, date) {
  const transporter = createTransporter();
  const appUrl = process.env.CLIENT_URL || 'https://the19thhole.vercel.app';
  const { rows: subscribers } = await pool.query(
    'SELECT email, name FROM email_subscribers WHERE is_active = TRUE'
  );

  const results = await Promise.allSettled(
    subscribers.map(sub => {
      const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}`;
      return transporter.sendMail({
        from: `"The 19th Hole" <${process.env.EMAIL_USER}>`,
        to: sub.email,
        subject: `The 19th Hole — ${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        html: newsletterEmailHtml(briefingContent, date, unsubscribeUrl),
      });
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  console.log(`Newsletter sent: ${sent} ok, ${failed} failed`);
  return { sent, failed, total: subscribers.length };
}

module.exports = { sendWelcomeEmail, sendNewsletterToAll };

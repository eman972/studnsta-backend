const nodemailer = require("nodemailer");

/** Dev-friendly mailer: logs to console if SMTP not configured */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    transporter = {
      sendMail: async (opts) => {
        console.log(JSON.stringify({ level: "info", type: "email", ...opts }));
        return { messageId: "dev-" + Date.now() };
      },
    };
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || "Studnsta <noreply@studnsta.local>";
  return getTransporter().sendMail({ from, to, subject, text, html });
}

module.exports = { sendMail };

const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,       // e.g., "smtp.gmail.com"
      port: process.env.SMTP_PORT,       // e.g., 587
      secure: false,                     // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,     // your email
        pass: process.env.EMAIL_PASS,     // your email password or app password
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"Jupiter Bank" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,  
    });

    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;

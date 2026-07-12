import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");


export const sendResetPasswordEmail = async (to: string, resetLink: string) => {
  try {
    const transportOptions: SMTPTransport.Options & { family?: number } = {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      family: 4,
    };

    const transporter = nodemailer.createTransport(transportOptions);

    await transporter.sendMail({
      from: `"VaultArchve" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Reset Your VaultArchve Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f5; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5;">

          <!-- Header -->
          <div style="background-color: #0f172a; padding: 28px 24px; text-align: center;">
            <div style="font-size: 22px; font-weight: 800; color: #ffffff;">
              Vault<span style="color: #f5a623;">Archve</span>
            </div>
            <div style="font-size: 11px; letter-spacing: 1px; color: #94a3b8; margin-top: 4px; text-transform: uppercase;">
              Guagua Community College
            </div>
          </div>

          <!-- Body -->
          <div style="background-color: #ffffff; padding: 32px 28px;">
            <div style="display: inline-block; background-color: #fdf1d8; color: #b8790a; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px;">
              Password Reset Request
            </div>

            <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 12px;">
              Reset your password
            </h2>

            <p style="font-size: 15px; color: #52525b; line-height: 1.6; margin: 0 0 8px;">
              We received a request to reset the password for your VaultArchve account. Click the button below to choose a new one. This link will expire in <strong>15 minutes</strong>.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" target="_blank" style="
                display: inline-block;
                padding: 14px 32px;
                background-color: #f5a623;
                color: #0f172a;
                font-weight: 700;
                text-decoration: none;
                border-radius: 8px;
                font-size: 15px;
              ">
                Reset Password
              </a>
            </div>

            <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin: 0;">
              If you didn't request this, you can safely ignore this email — your password will remain unchanged.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f4f4f5; padding: 18px 24px; text-align: center;">
            <p style="font-size: 12px; color: #a1a1aa; margin: 0;">
              &copy; ${new Date().getFullYear()} VaultArchve &middot; Guagua Community College. All rights reserved.
            </p>
          </div>

        </div>
        `,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Could not send email");
  }
};
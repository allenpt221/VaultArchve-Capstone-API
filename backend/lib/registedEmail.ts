import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (to: string, name: string, password: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "VaultArchve - GCC <noreply@vaultarchve.com>",
      to,
      subject: "Welcome to VaultArchve!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f5; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5;">
          <div style="background-color: #0f172a; padding: 28px 24px; text-align: center;">
            <div style="font-size: 22px; font-weight: 800; color: #ffffff;">
              Vault<span style="color: #f5a623;">Archve</span>
            </div>
            <div style="font-size: 11px; letter-spacing: 1px; color: #94a3b8; margin-top: 4px; text-transform: uppercase;">
              Guagua Community College
            </div>
          </div>
          <div style="background-color: #ffffff; padding: 32px 28px;">
            <div style="display: inline-block; background-color: #fdf1d8; color: #b8790a; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px;">
              Account Created
            </div>
            <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 12px;">
              Welcome, ${name}!
            </h2>
            <p style="font-size: 15px; color: #52525b; line-height: 1.6; margin: 0 0 8px;">
              Your VaultArchve account has been created successfully. You now have access to Guagua Community College's digital thesis repository — browse past research, get AI-guided help through the Progressive Trail, and manage your own thesis submissions, all in one place.
            </p>

            <div style="background-color: #f4f4f5; border: 1px solid #e5e5e5; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
              <p style="font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px;">
                Your Login Details
              </p>
              <p style="font-size: 14px; color: #0f172a; margin: 0 0 6px;">
                <strong>Email:</strong> ${to}
              </p>
              <p style="font-size: 14px; color: #0f172a; margin: 0;">
                <strong>Password:</strong> ${password}
              </p>
            </div>

            <p style="font-size: 13px; color: #b8790a; background-color: #fdf1d8; border-radius: 8px; padding: 10px 14px; line-height: 1.5; margin: 0 0 20px;">
              For your security, we recommend changing this password after your first login. You can do this anytime in <strong>Settings</strong>.
            </p>

            <div style="text-align: center; margin: 8px 0 32px;">
              <a href="${process.env.FRONTEND_URL}/login" target="_blank" style="
                display: inline-block;
                padding: 14px 32px;
                background-color: #f5a623;
                color: #0f172a;
                font-weight: 700;
                text-decoration: none;
                border-radius: 8px;
                font-size: 15px;
              ">
                Log In to Your Account
              </a>
            </div>
            <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin: 0;">
              If you didn't create this account, please contact the college administration.
            </p>
          </div>
          <div style="background-color: #f4f4f5; padding: 18px 24px; text-align: center;">
            <p style="font-size: 12px; color: #a1a1aa; margin: 0;">
              &copy; ${new Date().getFullYear()} VaultArchve &middot; Guagua Community College. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error("Could not send email");
    }

    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Could not send email");
  }
};
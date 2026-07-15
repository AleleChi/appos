import { Resend } from "resend";

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend] RESEND_API_KEY is not defined. Emails will be logged to console (mocked).");
    return null;
  }
  return new Resend(apiKey);
};

export async function sendVerificationEmail({ email, url }: { email: string; url: string }) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM || "AppOS <onboarding@resend.dev>";
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 32px;">
        <span style="font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">App<span style="color: #4f46e5;">OS</span></span>
      </div>
      <h2 style="color: #111827; font-size: 20px; font-weight: 600; line-height: 28px; margin-bottom: 12px; text-align: center;">Verify your AppOS email</h2>
      <p style="color: #4b5563; font-size: 15px; line-height: 24px; text-align: center; margin-bottom: 32px;">
        Thank you for choosing AppOS. Please click the button below to verify your email address and activate your account.
      </p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${url}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; display: inline-block; transition: background-color 0.15s ease;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 20px; text-align: center; margin-bottom: 0;">
        This link is valid for a limited time. If you did not request this email, please ignore it.
      </p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;" />
      <p style="color: #9ca3af; font-size: 11px; line-height: 16px; text-align: center;">
        If you have trouble clicking the button, copy and paste this URL into your browser:<br />
        <a href="${url}" style="color: #4f46e5; text-decoration: none; word-break: break-all;">${url}</a>
      </p>
    </div>
  `;

  if (resend) {
    try {
      console.log(`
[RESEND SANDBOX DIAGNOSTIC WARNING]
=========================================
TARGET RECIPIENT EMAIL: ${email}
SENDER ADDRESS: ${from}
RESEND API EXECUTION STARTING FOR: "Verify your AppOS email"
NOTE: If using the Resend Sandbox (onboarding@resend.dev), emails will ONLY be delivered to the registered Resend account owner. All other recipient addresses will be silently dropped by Resend after acceptance until a custom domain is verified.
=========================================
`);
      console.log(`[Resend Diagnostics] INVOKING RESEND API. Recipient: ${email}. From: ${from}. Subject: "Verify your AppOS email". Full String Payload:`, {
        from,
        to: email,
        subject: "Verify your AppOS email",
        html
      });
      const response = await resend.emails.send({
        from,
        to: email,
        subject: "Verify your AppOS email",
        html,
      });
      console.log(`[Resend] Verification email successfully dispatched to ${email}`, response);
      return { success: true, id: response.data?.id };
    } catch (err: any) {
      console.error(`[Resend] Failed to send verification email to ${email}:`, err);
      return { success: false, error: err.message || String(err) };
    }
  } else {
    console.log(`\n================ [MOCK Verification EMAIL] ================`);
    console.log(`To:      ${email}`);
    console.log(`Subject: Verify your AppOS email`);
    console.log(`Link:    ${url}`);
    console.log(`========================================================\n`);
    return { success: true, mocked: true };
  }
}

export async function sendResetPasswordEmail({ email, url }: { email: string; url: string }) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM || "AppOS <onboarding@resend.dev>";
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 32px;">
        <span style="font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">App<span style="color: #4f46e5;">OS</span></span>
      </div>
      <h2 style="color: #111827; font-size: 20px; font-weight: 600; line-height: 28px; margin-bottom: 12px; text-align: center;">Reset your AppOS password</h2>
      <p style="color: #4b5563; font-size: 15px; line-height: 24px; text-align: center; margin-bottom: 32px;">
        We received a request to reset your password for your AppOS account. Click the button below to set a new password.
      </p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${url}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; display: inline-block; transition: background-color 0.15s ease;">
          Reset Password
        </a>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 20px; text-align: center; margin-bottom: 0;">
        This password reset link is only valid for a short time. If you did not make this request, you can safely ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;" />
      <p style="color: #9ca3af; font-size: 11px; line-height: 16px; text-align: center;">
        If you have trouble clicking the button, copy and paste this URL into your browser:<br />
        <a href="${url}" style="color: #4f46e5; text-decoration: none; word-break: break-all;">${url}</a>
      </p>
    </div>
  `;

  if (resend) {
    try {
      console.log(`
[RESEND SANDBOX DIAGNOSTIC WARNING]
=========================================
TARGET RECIPIENT EMAIL: ${email}
SENDER ADDRESS: ${from}
RESEND API EXECUTION STARTING FOR: "Reset your AppOS password"
NOTE: If using the Resend Sandbox (onboarding@resend.dev), emails will ONLY be delivered to the registered Resend account owner. All other recipient addresses will be silently dropped by Resend after acceptance until a custom domain is verified.
=========================================
`);
      console.log(`[Resend Diagnostics] INVOKING RESEND API. Recipient: ${email}. From: ${from}. Subject: "Reset your AppOS password". Full String Payload:`, {
        from,
        to: email,
        subject: "Reset your AppOS password",
        html
      });
      const response = await resend.emails.send({
        from,
        to: email,
        subject: "Reset your AppOS password",
        html,
      });
      console.log(`[Resend] Password-reset email successfully dispatched to ${email}`, response);
      return { success: true, id: response.data?.id };
    } catch (err: any) {
      console.error(`[Resend] Failed to send password reset email to ${email}:`, err);
      return { success: false, error: err.message || String(err) };
    }
  } else {
    console.log(`\n================ [MOCK Reset Password EMAIL] ================`);
    console.log(`To:      ${email}`);
    console.log(`Subject: Reset your AppOS password`);
    console.log(`Link:    ${url}`);
    console.log(`==========================================================\n`);
    return { success: true, mocked: true };
  }
}

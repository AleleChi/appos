import { Resend } from "resend";

export class EmailDeliveryError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

const isProduction = process.env.NODE_ENV === "production";

// Validate environment variables on file load
if (isProduction) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "FATAL CONFIGURATION ERROR: RESEND_API_KEY is required in production environments! Email service startup aborted."
    );
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "FATAL CONFIGURATION ERROR: EMAIL_FROM is required in production environments! Email service startup aborted."
    );
  }
  if (process.env.EMAIL_FROM.includes("onboarding@resend.dev")) {
    throw new Error(
      "FATAL CONFIGURATION ERROR: EMAIL_FROM cannot be onboarding@resend.dev in production! Onboarding domain is restricted to sandbox testing only."
    );
  }
}

export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const [local, domain] = parts;
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (isProduction) {
      throw new Error("FATAL CONFIGURATION ERROR: RESEND_API_KEY is missing in production.");
    }
    console.warn("[Resend] RESEND_API_KEY is not defined. Emails will be logged to console (mocked).");
    return null;
  }
  return new Resend(apiKey);
};

export async function sendVerificationEmail({ email, url }: { email: string; url: string }) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM || "AppOS <onboarding@resend.dev>";
  
  if (isProduction && !process.env.EMAIL_FROM) {
    throw new Error("FATAL CONFIGURATION ERROR: EMAIL_FROM is missing in production.");
  }

  if (isProduction && from.includes("onboarding@resend.dev")) {
    throw new EmailDeliveryError(
      "SANDBOX_RESTRICTION",
      "onboarding@resend.dev cannot be treated as unrestricted production delivery."
    );
  }
  
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
        Please check your verification link in your secure account area.
      </p>
    </div>
  `;

  if (resend) {
    // Record sandbox warn if onboarding@resend.dev is used
    if (from.includes("onboarding@resend.dev")) {
      console.warn(`[Resend Sandbox Warning] SENDER: ${from} | RECIPIENT: ${maskEmail(email)}. Delivery restricted to sandbox registered owners.`);
    }

    // Safe, non-sensitive start log
    console.log(JSON.stringify({
      event: "verification_email_sending",
      provider: "resend",
      recipient: maskEmail(email),
      timestamp: new Date().toISOString()
    }));

    const response = await resend.emails.send({
      from,
      to: email,
      subject: "Verify your AppOS email",
      html,
    });

    const { data, error } = response;

    if (error) {
      console.error("[Resend Error Safe Log] Provider rejected email delivery:", {
        error: error.message || String(error),
        recipient: maskEmail(email),
        timestamp: new Date().toISOString()
      });

      throw new EmailDeliveryError(
        "EMAIL_PROVIDER_REJECTED",
        error.message || "Email delivery failed due to provider rejection"
      );
    }

    if (!data?.id) {
      console.error("[Resend Error Safe Log] Provider did not return a message ID:", {
        recipient: maskEmail(email),
        timestamp: new Date().toISOString()
      });
      throw new EmailDeliveryError(
        "EMAIL_PROVIDER_NO_MESSAGE_ID",
        "The email provider returned no message identifier."
      );
    }

    // Safe production logging
    console.log(JSON.stringify({
      event: "verification_email_accepted",
      provider: "resend",
      messageId: data.id,
      recipient: maskEmail(email),
      status: "accepted",
      timestamp: new Date().toISOString()
    }));

    return { success: true, id: data.id, deliveryMode: "live" };
  } else {
    // Development mock
    console.log(`\n================ [MOCK Verification EMAIL] ================`);
    console.log(`To:      ${maskEmail(email)}`);
    console.log(`Subject: Verify your AppOS email`);
    console.log(`========================================================\n`);
    return { success: true, mocked: true, deliveryMode: "mock" };
  }
}

export async function sendResetPasswordEmail({ email, url }: { email: string; url: string }) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM || "AppOS <onboarding@resend.dev>";
  
  if (isProduction && !process.env.EMAIL_FROM) {
    throw new Error("FATAL CONFIGURATION ERROR: EMAIL_FROM is missing in production.");
  }

  if (isProduction && from.includes("onboarding@resend.dev")) {
    throw new EmailDeliveryError(
      "SANDBOX_RESTRICTION",
      "onboarding@resend.dev cannot be treated as unrestricted production delivery."
    );
  }
  
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
    </div>
  `;

  if (resend) {
    if (from.includes("onboarding@resend.dev")) {
      console.warn(`[Resend Sandbox Warning] SENDER: ${from} | RECIPIENT: ${maskEmail(email)}. Delivery restricted to sandbox registered owners.`);
    }

    // Safe, non-sensitive start log
    console.log(JSON.stringify({
      event: "reset_password_email_sending",
      provider: "resend",
      recipient: maskEmail(email),
      timestamp: new Date().toISOString()
    }));

    const response = await resend.emails.send({
      from,
      to: email,
      subject: "Reset your AppOS password",
      html,
    });

    const { data, error } = response;

    if (error) {
      console.error("[Resend Error Safe Log] Provider rejected password reset delivery:", {
        error: error.message || String(error),
        recipient: maskEmail(email),
        timestamp: new Date().toISOString()
      });
      throw new EmailDeliveryError(
        "EMAIL_PROVIDER_REJECTED",
        error.message || "Password reset delivery failed due to provider rejection"
      );
    }

    if (!data?.id) {
      console.error("[Resend Error Safe Log] Provider did not return a message ID for password reset:", {
        recipient: maskEmail(email),
        timestamp: new Date().toISOString()
      });
      throw new EmailDeliveryError(
        "EMAIL_PROVIDER_NO_MESSAGE_ID",
        "The email provider returned no message identifier."
      );
    }

    // Safe production logging
    console.log(JSON.stringify({
      event: "reset_password_email_accepted",
      provider: "resend",
      messageId: data.id,
      recipient: maskEmail(email),
      status: "accepted",
      timestamp: new Date().toISOString()
    }));

    return { success: true, id: data.id, deliveryMode: "live" };
  } else {
    // Development mock
    console.log(`\n================ [MOCK Reset Password EMAIL] ================`);
    console.log(`To:      ${maskEmail(email)}`);
    console.log(`Subject: Reset your AppOS password`);
    console.log(`==========================================================\n`);
    return { success: true, mocked: true, deliveryMode: "mock" };
  }
}

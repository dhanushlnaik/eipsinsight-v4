import nodemailer from "nodemailer";
import { env } from "@/env";

export class EmailDeliveryError extends Error {
  code: "PROVIDER_RATE_LIMIT" | "DELIVERY_FAILED";
  statusCode?: number;

  constructor(message: string, code: "PROVIDER_RATE_LIMIT" | "DELIVERY_FAILED", statusCode?: number) {
    super(message);
    this.name = "EmailDeliveryError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: env.EMAIL_FROM,
    pass: env.EMAIL_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for plain text fallback
    });
  } catch (error) {
    const smtpError = error as {
      responseCode?: number;
      response?: string;
      message?: string;
    };
    const responseText = (smtpError.response || smtpError.message || "").toLowerCase();

    if (
      smtpError.responseCode === 550 ||
      responseText.includes("unusual sending activity detected") ||
      responseText.includes("outgoing rate has exceeded") ||
      responseText.includes("blocked")
    ) {
      console.error("SMTP provider rate/block detected:", error);
      throw new EmailDeliveryError(
        "Email delivery is temporarily limited by our mail provider. Please wait a few minutes and try again.",
        "PROVIDER_RATE_LIMIT",
        smtpError.responseCode,
      );
    }

    console.error("Failed to send email:", error);
    throw new EmailDeliveryError(
      "We couldn't send the verification email right now. Please try again shortly.",
      "DELIVERY_FAILED",
      smtpError.responseCode,
    );
  }
}

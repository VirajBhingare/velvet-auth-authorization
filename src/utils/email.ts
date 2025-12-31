import nodemailer from "nodemailer";
import crypto from "crypto";

export const otpLength = 6;

export const generateOTP = (length: number = otpLength): string => {
  const otp = crypto.randomInt(0, Math.pow(10, length));
  return otp.toString().padStart(length, "0");
};

export const sendEmail = async (to: string, otp: string) => {
  const subject = "Verify your account";
  const text = `Your verification OTP is : ${otp}`;

  if (process.env.NODE_ENV === "development" || !process.env.SMTP_USER) {
    console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject} | Body: ${text}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
  });
};

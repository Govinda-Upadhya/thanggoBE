import nodemailer from "nodemailer";
import crypto from "crypto";
import { APP_EMAIL, APP_PASS } from "./config.js";
import rateLimit from "express-rate-limit";
export function toMinutes(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}
export const transporterMain = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: APP_EMAIL,
    pass: APP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
export const generateOtp = () => crypto.randomInt(100000, 999999).toString();
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => req.body.email || "", // limit per email
  handler: (_, res) => {
    res
      .status(429)
      .json({ message: "Too many OTP requests. Try again later." });
  },
});

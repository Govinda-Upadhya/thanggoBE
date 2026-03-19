import { Router } from "express";
import {
  acceptChallenge,
  bookGround,
  bookinginfo,
  cancelBooking,
  contactUs,
  createChallenge,
  fetchGrounds,
  getTimeBooked,
  mailer,
  resendOtp,
  seeDate,
  sendChallenge,
  sendFeedback,
  verifyChallengesOtp,
  verifyOtp,
  viewGrounduser,
} from "../Controllers/user/userManage.js";
import { viewGrounds } from "../Controllers/ground/groundManage.js";
import { otpLimiter } from "../lib.js";

export const userRoutes = Router();

userRoutes.get("/getgrounds", fetchGrounds);
userRoutes.get("/seegrounds/:id", viewGrounduser);
userRoutes.post("/bookground/:id", bookGround);
userRoutes.get("/bookinginfo/:id", bookinginfo);
userRoutes.post("/cancelBooking", cancelBooking);
userRoutes.post("/bookinginfo/send_screentshot/", mailer);
userRoutes.get("/bookedTime", getTimeBooked);
userRoutes.post("/createChallenge", createChallenge);
userRoutes.get("/getChallenge", sendChallenge);
userRoutes.post("/acceptChallenge", acceptChallenge);
userRoutes.post("/searchDate", seeDate);
userRoutes.post("/contactus", contactUs);
userRoutes.post("/feedback", sendFeedback);
userRoutes.post("/verifyotp", otpLimiter, verifyOtp);
userRoutes.post("/verifychallengeotp", otpLimiter, verifyChallengesOtp);
userRoutes.post("/resendotp", resendOtp);

import { Router } from "express";
import {
  acceptBooking,
  adminBooking,
  adminSignIn,
  adminSignUp,
  changePassword,
  changePasswordLink,
  deleteBooking,
  getAdmin,
  getBooking,
  getDailyRevenueStats,
  getDailyTimeStats,
  getMonthlyRevenueStats,
  getMonthlyStat,
  getWeeklyRevenueStats,
  getWeeklyTimeStat,
  isLoggedIn,
  overall,
  rejectBooking,
  updateAdmin,
} from "../Controllers/admin/adminManage.js";
import { adminMiddleware } from "../authmiddleware.js";
import {
  createGround,
  deleteGround,
  updateGround,
  viewGround,
  viewGrounds,
} from "../Controllers/ground/groundManage.js";
const adminRoutes = Router();

adminRoutes.post("/changePassword/link/:id", changePassword);
adminRoutes.post("/changePassword", changePasswordLink);
adminRoutes.post("/signup", adminSignUp);

adminRoutes.post("/signin", adminSignIn);
adminRoutes.use(adminMiddleware);
adminRoutes.put("/update", updateAdmin);
adminRoutes.get("/loggedIn", isLoggedIn);
adminRoutes.get("/getAdmin", getAdmin);
adminRoutes.post("/createground", createGround);
adminRoutes.get("/seeGrounds", viewGrounds);
adminRoutes.get("/seeGround/:id", viewGround);
adminRoutes.delete("/deleteground/:id", deleteGround);
adminRoutes.put("/updateground/:id", updateGround);
adminRoutes.get("/bookings", getBooking);
adminRoutes.post("/bookings/acceptbooking", acceptBooking);
adminRoutes.delete("/bookings/delete/:id", deleteBooking);
adminRoutes.post("/bookings/rejectbooking", rejectBooking);
adminRoutes.get("/bookings/overall", overall);
adminRoutes.get("/bookings/getDailyTimeStats", getDailyTimeStats);
adminRoutes.get("/bookings/getWeeklyStats", getWeeklyTimeStat);
adminRoutes.get("/bookings/getMonthlyStats", getMonthlyStat);
adminRoutes.get("/bookings/getDailyRevenueStats", getDailyRevenueStats);
adminRoutes.get("/bookings/getWeeklyRevenueStats", getWeeklyRevenueStats);
adminRoutes.get("/bookings/getMonthlyRevenueStats", getMonthlyRevenueStats);
adminRoutes.post("/bookingOffline/:id", adminBooking);
export default adminRoutes;

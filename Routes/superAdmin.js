import { Router } from "express";
import {
  superadminSignIn,
  superadminSignUp,
  totalConfirmedBooking,
} from "../Controllers/superAdmin/superAdmin.js";
import { superadminMiddleware } from "../authmiddleware.js";

export const superAdminRoutes = Router();
superAdminRoutes.post("/signup", superadminSignUp);
superAdminRoutes.post("/signin", superadminSignIn);
superAdminRoutes.use(superadminMiddleware);
superAdminRoutes.get("/confirmedBookings", totalConfirmedBooking);

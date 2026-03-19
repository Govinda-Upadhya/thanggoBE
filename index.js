import e from "express";
import adminRoutes from "./Routes/adminRoutes.js";
import mongoose from "mongoose";
import {
  ALLOWED_ORIGINS,
  BASE_DELETE_ADMIN,
  BASE_DELETE_USER,
  db_url,
  PORT,
} from "./config.js";
import cookieParser from "cookie-parser";
import { userRoutes } from "./Routes/userRoutes.js";
import cors from "cors";
import { superAdminRoutes } from "./Routes/superAdmin.js";

const app = e();
export const base_delete_admin = BASE_DELETE_ADMIN;
export const base_delete_user = BASE_DELETE_USER;
export const allowedOrigin = ALLOWED_ORIGINS;
app.use(e.json({ limit: "10mb" }));
app.use(e.urlencoded({ limit: "10mb", extended: true }));

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(cookieParser());
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);
app.use("/superAdmin", superAdminRoutes);

async function main() {
  try {
    await mongoose.connect(db_url);

    app.listen(PORT, () => {
      console.log("listening...", PORT);
    });
  } catch (error) {
    console.log(error);
  }
}
main();

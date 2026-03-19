import { JWT_SECRET, JWT_SUPER } from "./config.js";
import jwt from "jsonwebtoken";
export const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "authorization denied, please signin" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.admin = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
export const superadminMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.superAdmin;
    if (!token) {
      return res
        .status(401)
        .json({ message: "authorization denied, please signin" });
    }

    const decoded = jwt.verify(token, JWT_SUPER);

    req.admin = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

import { JWT_SUPER } from "../../config.js";
import { BookingData, Ground, SuperAdmin } from "../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export const superadminSignUp = async (req, res) => {
  const { name, password, email } = req.body;

  try {
    const userExists = await SuperAdmin.find({
      email: email,
    });

    if (userExists.length != 0) {
      return res
        .status(404)
        .send({ msg: "user already exists,please use a different email." });
    }

    const salt = await bcrypt.genSalt(5);
    const newPassword = await bcrypt.hash(password, salt);
    let createUser = await SuperAdmin.create({
      name: name,
      password: newPassword,
      email: email,
    });
    if (createUser) {
      return res.status(200).send("super admin created successfully");
    }
    return res
      .status(400)
      .send("Super Admin couldnt be created. Please try again");
  } catch (error) {
    console.log("error", error);
  }
};
export const superadminSignIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExists = await SuperAdmin.find({
      email: email,
    });

    if (userExists.length == 0) {
      return res.status(400).send("super admin doesn't exists. Please signup.");
    }

    const passwordVerified = await bcrypt.compare(
      password,
      userExists[0].password
    );
    if (!passwordVerified) {
      return res.status(400).send("Password is incorrect");
    }
    const token = jwt.sign({ email: email }, JWT_SUPER, {
      expiresIn: "7d",
    });

    return res
      .cookie("superAdmin", token, {
        sameSite: "lax",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ message: "Login successful", token: token });
  } catch (error) {
    console.log("error", error);
  }
};
export const totalConfirmedBooking = async (req, res) => {
  try {
    const count = await BookingData.countDocuments({ status: "CONFIRMED" });
    console.log(await BookingData.find({}));
    return res.json({ count });
  } catch (error) {
    console.error("Error fetching confirmed bookings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const totalGrounds = async (req, res) => {
  try {
    const count = await Ground.countDocuments();

    return res.json({ groundCount: count });
  } catch (error) {
    console.error("Error fetching confirmed bookings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

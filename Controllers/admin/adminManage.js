import { Admin, Booking, BookingData, Ground } from "../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { APP_EMAIL, APP_PASS, JWT_SECRET } from "../../config.js";

import { allowedOrigin } from "../../index.js";

// Corrected nodemailer transporter configuration
export const transporterMain = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: APP_EMAIL,
    pass: APP_PASS,
  },
  tls: {
    // This option can be used in development to bypass certificate errors
    rejectUnauthorized: false,
  },
});

export const adminSignUp = async (req, res) => {
  const { name, password, profile, email, contact, scanner } = req.body;
  console.log(password);
  try {
    const userExists = await Admin.find({
      email: email,
    });
    const contactExists = await Admin.find({ contact: contact });

    if (userExists.length != 0) {
      return res
        .status(404)
        .send({ msg: "user already exists,please use a different email." });
    }
    if (contactExists.length != 0) {
      return res
        .status(404)
        .send({ msg: "contact already exists,please use a different one." });
    }

    const salt = await bcrypt.genSalt(5);
    const newPassword = await bcrypt.hash(password, salt);
    let createUser = await Admin.create({
      name: name,
      profile: profile,
      password: newPassword,
      email: email,
      contact: contact,
      scanner: scanner,
    });
    if (createUser) {
      return res.status(200).send("admin created successfully");
    }
    return res.status(400).send("Admin couldnt be created. Please try again");
  } catch (error) {
    console.log("error", error);
  }
};
export const updateAdmin = async (req, res) => {
  const userInfo = req.admin;
  const user = await Admin.findOne({ email: userInfo.email });
  const { newInfo } = req.body;
  const userExists = await Admin.findOne({ email: newInfo.email });
  if (newInfo.newEmail) {
    if (userExists) {
      return res
        .status(400)
        .json({ msg: "user already exists please use a different email" });
    }
  }

  await Admin.updateOne(
    { email: user.email },
    {
      email: newInfo.email,
      contact: newInfo.contact,
      profile: newInfo.profile,
      name: newInfo.name,
      scanner: newInfo.scanner,
    },
    { new: true, runValidators: true }
  );
  return res.status(200).json({ msg: "user Updated" });
};
export const getAdmin = async (req, res) => {
  const admin = req.admin;
  const info = await Admin.findOne({ email: admin.email });

  return res.json(info);
};
export const adminSignIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExists = await Admin.find({
      email: email,
    });

    if (userExists.length == 0) {
      return res.status(400).send("user doesn't exists. Please signup.");
    }

    const passwordVerified = await bcrypt.compare(
      password,
      userExists[0].password
    );
    if (!passwordVerified) {
      return res.status(400).send("Password is incorrect");
    }
    const token = jwt.sign({ email: email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res
      .cookie("token", token, {
        sameSite: "lax",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ message: "Login successful", token: token });
  } catch (error) {
    console.log("error", error);
  }
};

export const isLoggedIn = async (req, res) => {
  const admin = req.admin;
  return res.status(200).send("user logged in");
};

export const getBooking = async (req, res) => {
  try {
    const adminData = req.admin;
    if (!adminData || !adminData.email) {
      return res.status(400).json({ error: "Admin not found in request" });
    }

    const admin = await Admin.findOne({ email: adminData.email });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const grounds = await Ground.find({ admin: admin._id });

    const bookings = await Booking.find({
      ground: { $in: grounds.map((g) => g._id) },
      screenshot: true,
    }).populate("ground", "name type");

    return res.json({ bookings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findByIdAndUpdate(bookingId, {
      status: "CONFIRMED",
    }).populate("ground", "name");
    await BookingData.updateOne(
      { bookingId: bookingId },
      {
        status: "CONFIRMED",
      }
    );
    if (!booking) {
      return res.status(404).json({ msg: "cannot find the booking" });
    }

    const formattedDate = new Date(booking.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    await transporterMain.sendMail({
      from: APP_EMAIL,
      to: booking.email,
      subject: "Booking confirmed",
      text: `dear ${booking.name} your booking for ground ${booking.ground.name} on ${formattedDate} has been confirmed. please be on time and have fun`,
    });

    res.json({ message: "confirmation send to client" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send screenshot" });
  }
};
export const adminBooking = async (req, res) => {
  const id = req.params.id;

  const ground = await Ground.findById(id);
  if (!ground) {
    return res.json({ msg: "Ground doesnt exists" });
  }

  const bookingdata = await req.body.data;

  try {
    const booking = await Booking.create({
      date: bookingdata.date,
      name: bookingdata.name,
      email: bookingdata.email,
      contact: bookingdata.phone,
      time: bookingdata.availability,
      status: "CONFIRMED",
      screenshot: true,
      ground: ground._id,
      amount: ground.pricePerHour * bookingdata.availability.length,
      expiresAt: new Date(Date.now() + 6 * 60 * 1000),
    });
    const lastSlotEnd = booking.time[booking.time.length - 1].end; // "08:30"
    const bookingDate = new Date(booking.date);
    const [hours, minutes] = lastSlotEnd.split(":").map(Number);

    // Use UTC methods to avoid timezone shift
    bookingDate.setUTCHours(hours, minutes, 0, 0);

    const expiresAt = bookingDate;

    await Booking.updateOne(
      { _id: booking._id },
      { screenshot: true, $set: { expiresAt } }
    );

    if (!booking) {
      return res.status(400).json({ msg: "booking failed please try again" });
    }
    const formattedDate = new Date(booking.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    await transporterMain.sendMail({
      from: APP_EMAIL,
      to: booking.email,
      subject: "Booking confirmed",
      text: `dear ${booking.name} your booking for ground ${booking.ground.name} on ${formattedDate} has been confirmed. please be on time and have fun`,
    });
    return res.json({ msg: "booking info" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ msg: "internal server error", err: error.message });
  }
};
export const resendOtp = async (req, res) => {
  const { email } = req.body;
  const otp = generateOtp();
  await redis.set(`otp:${email}`, otp, "EX", 90);
  transporterMain.sendMail({
    from: APP_EMAIL,
    to: email,
    subject: "OTP",
    text: `Otp for your thanggo ground booking is ${otp}. it is valid for 1 minute.`,
  });
  return res
    .status(200)
    .json({ message: "OTP send successfully to your email" });
};

export const rejectBooking = async (req, res) => {
  const info = req.body;
  const booking = await Booking.findById(info.bookingId).populate(
    "ground",
    "name"
  );
  const admin = await Admin.findOne({ email: req.admin.email });
  if (!booking) {
    return res.status(404).json({ msg: "booking info invalid" });
  }

  const formattedDate = new Date(booking.date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  await transporterMain.sendMail({
    from: APP_EMAIL,
    to: booking.email,
    subject: "Booking rejected",
    text: `dear ${booking.name} your booking for ground ${booking.ground.name} on ${formattedDate} has been rejected because of "${info.reason}" as stated by the owner of the ground, for further query please contact the owner at number ${admin.contact}`,
  });
  await transporterMain.sendMail({
    from: APP_EMAIL,
    to: admin.email,
    subject: `booking with id ${booking._id} done by ${booking.name} with contact info ${booking.contact} becuase of reason "${info.reason}"`,
    text: `dear ${booking.name} your booking for ground ${booking.ground.name} on ${booking.date} has been rejected because of "${info.reason}" as stated by the owner of the ground, for further query please contact the owner`,
  });
  await Booking.deleteOne({ _id: booking._id });
  return res.json({ msg: "booking rejected and removed successfully " });
};

export const deleteBooking = async (req, res) => {
  const id = req.params.id;
  const deleting = await Booking.deleteOne({ _id: id });
  if (!deleting) {
    return res.status(400).json({ msg: "couldnt be deleted" });
  }
  return res.json({ msg: "deleted successfully" });
};

export const changePassword = async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const info = req.body;
  console.log(info);
  const user = await Admin.findById(id);
  if (!user) {
    return res.status(404).json({ msg: "user doesnt exist" });
  }
  const newPassword = await bcrypt.hash(info.password, 5);
  await Admin.updateOne({ _id: user._id }, { $set: { password: newPassword } });
  return res.status(200).json({ msg: "done" });
};
export const changePasswordLink = async (req, res) => {
  const info = req.body;
  try {
    const admin = await Admin.findOne({ email: info.email });
    if (!admin) {
      return res.status(404).json({ msg: "no such emails registered" });
    }
    const link = `${allowedOrigin[0]}/admin/changePassword/${admin._id}`;
    await transporterMain.sendMail({
      from: APP_EMAIL,
      to: admin.email,
      subject: `change password`,
      text: `dear user please click on this link to change the password. ${link}`,
    });
    return res.status(200).json({ msg: "Link send to your email" });
  } catch (error) {
    return res.status(500).json({ msg: "Internal server" });
  }
};

export const overall = async (req, res) => {
  const adminEmail = req.admin.email;
  const bookingData = await BookingData.find({ adminId: adminEmail });
  const totalConfirmedBookings = bookingData.reduce(
    (count, booking) => count + (booking.status === "CONFIRMED" ? 1 : 0),
    0
  );
  const totalPendingBookings = bookingData.reduce(
    (count, booking) => count + (booking.status === "PENDING" ? 1 : 0),
    0
  );
  const totalRevenue = bookingData.reduce(
    (amount, booking) =>
      amount + (booking.status === "CONFIRMED" ? booking.amount : 0),
    0
  );

  return res.json({
    totalConfirmedBookings,
    totalPendingBookings,
    totalRevenue,
  });
};
export const getDailyTimeStats = async (req, res) => {
  try {
    const bookings = await BookingData.find({
      status: "CONFIRMED",
      adminId: req.admin.email,
    });

    // Initialize all 24 slots to 0
    const timeStats = {};
    for (let hour = 0; hour < 24; hour++) {
      const startHour = String(hour).padStart(2, "0");
      const endHour = String(hour + 1).padStart(2, "0");
      const slot = `${startHour}:00-${endHour}:00`;
      timeStats[slot] = 0;
    }

    // Count bookings per slot
    for (let booking of bookings) {
      for (let t of booking.time) {
        // Convert object {start, end} to "HH:MM-HH:MM" string
        const slot = `${t.start}-${t.end}`;
        if (timeStats.hasOwnProperty(slot)) {
          timeStats[slot] += 1;
        } else {
          // Optional: handle unexpected slots
          timeStats[slot] = 1;
        }
      }
    }

    return res.json(timeStats); // <-- just return the object
  } catch (error) {
    console.error("Error fetching time stats:", error);
    return res.status(500).json({ error });
  }
};
export const getWeeklyTimeStat = async (req, res) => {
  try {
    const bookings = await BookingData.find({
      status: "CONFIRMED",
      adminId: req.admin.email,
    });

    // Days of the week
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // Initialize counts for each day
    const timeStats = {};
    daysOfWeek.forEach((day) => (timeStats[day] = 0));

    // Count bookings per day
    for (let booking of bookings) {
      const bookingDate = new Date(booking.date); // assuming booking.date exists
      const dayName = daysOfWeek[bookingDate.getDay()]; // getDay(): 0 = Sunday, 1 = Monday...
      timeStats[dayName] += 1;
    }

    return res.json(timeStats);
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getMonthlyStat = async (req, res) => {
  try {
    const bookings = await BookingData.find({
      status: "CONFIRMED",
      adminId: req.admin.email,
    });

    // Months of the year
    const monthsOfYear = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Initialize counts for each month
    const timeStats = {};
    monthsOfYear.forEach((month) => (timeStats[month] = 0));

    // Count bookings per month
    for (let booking of bookings) {
      const bookingDate = new Date(booking.date); // assuming booking.date exists
      const monthName = monthsOfYear[bookingDate.getMonth()]; // getMonth(): 0 = Jan, 11 = Dec
      timeStats[monthName] += 1;
    }

    return res.json(timeStats);
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getDailyRevenueStats = async (req, res) => {
  try {
    const bookings = await BookingData.find({
      status: "CONFIRMED",
      adminId: req.admin.email,
    });

    // Initialize all 24 slots with 0 revenue
    const revenueStats = {};
    for (let hour = 0; hour < 24; hour++) {
      const startHour = String(hour).padStart(2, "0");
      const endHour = String(hour + 1).padStart(2, "0");
      const slot = `${startHour}:00-${endHour}:00`;
      revenueStats[slot] = 0;
    }

    // Calculate revenue per slot
    for (let booking of bookings) {
      if (!booking.amount || !booking.time || booking.time.length === 0)
        continue;

      // Split amount equally across slots
      const share = booking.amount / booking.time.length;

      for (let t of booking.time) {
        const slot = `${t.start}-${t.end}`;
        if (revenueStats.hasOwnProperty(slot)) {
          revenueStats[slot] += share;
        } else {
          // handle unexpected slots
          revenueStats[slot] = share;
        }
      }
    }

    return res.json(revenueStats);
  } catch (error) {
    console.error("Error fetching daily revenue stats:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getWeeklyRevenueStats = async (req, res) => {
  try {
    const bookings = await BookingData.find({
      status: "CONFIRMED",
      adminId: req.admin.email,
    });

    // Days of the week
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // Initialize all days with 0 revenue
    const revenueStats = {};
    daysOfWeek.forEach((day) => (revenueStats[day] = 0));

    // Calculate revenue per day
    for (let booking of bookings) {
      if (!booking.amount || !booking.date) continue;

      const bookingDate = new Date(booking.date);
      const dayName = daysOfWeek[bookingDate.getDay()];

      revenueStats[dayName] += booking.amount;
    }

    return res.json(revenueStats);
  } catch (error) {
    console.error("Error fetching weekly revenue stats:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getMonthlyRevenueStats = async (req, res) => {
  try {
    const bookings = await BookingData.find({
      status: "CONFIRMED",
      adminId: req.admin.email,
    });

    // Months of the year
    const monthsOfYear = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Initialize all months with 0 revenue
    const revenueStats = {};
    monthsOfYear.forEach((month) => (revenueStats[month] = 0));

    // Calculate revenue per month
    for (let booking of bookings) {
      if (!booking.amount || !booking.date) continue;

      const bookingDate = new Date(booking.date);
      const monthName = monthsOfYear[bookingDate.getMonth()]; // 0 = Jan, 1 = Feb ...

      revenueStats[monthName] += booking.amount;
    }

    return res.json(revenueStats);
  } catch (error) {
    console.error("Error fetching monthly revenue stats:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

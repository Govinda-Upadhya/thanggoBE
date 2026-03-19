import mongoose from "mongoose";
import { type } from "os";

const timeRangeSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true,
      match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
    },
    end: {
      type: String,
      required: true,
      match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
    },
  },
  { _id: false }
);
const superAdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  scanner: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  profile: {
    type: String,
    default: "https://stock.adobe.com/search?k=profile+icon",
  },
  contact: {
    type: [String],
    default: [],
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },
});

const groundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ground name is required"],
    },
    capacity: {
      type: Number,
    },
    type: {
      type: String,
      enum: ["Football", "Cricket", "Basketball", "Tennis", "Badminton"],
      required: [true, "Ground type is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
    },

    features: {
      type: [String],
      default: [],
    },
    image: {
      type: [String],
      required: [true, "Image URL is required"],
    },
    description: {
      type: String,
      default: "",
    },
    availability: {
      type: [timeRangeSchema], // ✅ keeping time ranges
      default: [],
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);
const bookingSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    name: String,
    contact: {
      type: String,
      required: true,
    },
    screenshot: {
      type: Boolean,
      default: false,
    },
    amount: Number,
    date: Date,
    time: {
      type: [timeRangeSchema],
      required: true,
    },
    bookingId: String,
    ground: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ground",
      required: true,
    },
    status: {
      type: String,
      enum: ["CONFIRMED", "PENDING", "REJECTED"],
      default: "PENDING",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // 🔑 tells MongoDB to expire at this time
    },
  },
  { timestamps: true }
);

const challengeSchema = new mongoose.Schema({
  teamName: String,
  availability: { type: [{ date: String }] },
  email: String,
  members: String,
  sport: String,
  teamImage: String,
  description: String,
  valid: Boolean,
});
const bookingData = new mongoose.Schema({
  date: Date,
  ground: String,
  time: {
    type: [timeRangeSchema],
  },
  status: {
    type: String,
    enum: ["CONFIRMED", "PENDING", "REJECTED"],
  },
  email: String,
  amount: Number,
  bookingId: String,
  adminId: String,
});

export const Admin = mongoose.model("Admin", adminSchema);
export const Ground = mongoose.model("Ground", groundSchema);
export const Booking = mongoose.model("Booking", bookingSchema);
export const Challenges = mongoose.model("Challenges", challengeSchema);
export const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);
export const BookingData = mongoose.model("BookingData", bookingData);

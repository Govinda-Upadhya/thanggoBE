import { Admin, Ground } from "../../db.js";
import { toMinutes } from "../../lib.js";

import { base_delete_admin } from "../../index.js";

import axios from "axios";

export const createGround = async (req, res) => {
  const {
    name,
    image,
    capacity,
    availability,
    description,
    type,
    features,
    pricePerHour,
    rating,
    location,
  } = req.body;

  try {
    const groundExists = await Ground.find({
      name: { $regex: String(name || ""), $options: "i" },
      description: { $regex: String(description || ""), $options: "i" },
      location: { $regex: String(location || ""), $options: "i" },
    });

    if (groundExists.length != 0) {
      return res.send("Ground already exists");
    }
    for (const time of availability) {
      if (!time.start || !time.end) {
        return res.status(400).send("Start and end times are required");
      }

      const start = time.start.trim();
      const end = time.end.trim();

      if (toMinutes(start) > toMinutes(end)) {
        for (const photo of image) {
          const url = new URL(photo);
          const key = url.pathname.substring(1);

          const params = {
            Bucket: "futsal-pics",
            Key: key,
          };
          try {
            const command = new DeleteObjectCommand(params);
            const response = await s3.send(command);
          } catch (err) {
            console.error("Error deleting object:", err);
          }
        }
        return res.status(400).send(`Invalid time range: ${start} - ${end}`);
      }
    }
    const admin = await Admin.findOne({ email: req.admin.email });
    const createGround = await Ground.create({
      name: name,
      description: description,
      capacity: capacity,
      availability: availability,
      image: image,
      admin: admin._id,
      pricePerHour: parseInt(pricePerHour),
      features: features,
      rating: rating,
      type: type,
      location: location,
    });
    return res.send("ground created");
  } catch (error) {
    console.log(error);
    return res.send("ground couldnt be created");
  }
};

export const deleteGround = async (req, res) => {
  const groundId = req.params.id;
  try {
    const groundExists = await Ground.findById(groundId);
    if (!groundExists) {
      return res.send("the ground doesnt exists");
    }
    const deleted = await Ground.findByIdAndDelete(groundId);
    if (!deleted) {
      return res.send("Ground couldnt be deleted, try again letter");
    }
    return res.send("Ground removed successfully");
  } catch (error) {
    console.log(error);
    return res.send("some error occured");
  }
};

export const updateGround = async (req, res) => {
  const groundId = req.params.id;
  const {
    name,
    location,
    capacity,
    availability,
    description,
    images,
    features,
    removedImages,
    newImageUrls,
    pricePerHour,
  } = req.body;

  try {
    const groundExists = await Ground.findById(groundId);
    if (!groundExists) {
      const res = await axios.delete(base_delete_admin, {
        data: { url: newImageUrls },
      });

      return res.send("the ground doesnt exists");
    }
    for (const time of availability) {
      if (!time.start || !time.end) {
        console.log("time wrong");
        const res = await axios.delete(base_delete_admin, {
          data: {
            url: newImageUrls,
          },
        });

        return res.status(400).send("Start and end times are required");
      }

      const start = time.start.trim();
      const end = time.end.trim();

      if (toMinutes(start) > toMinutes(end)) {
        const res = await axios.delete(base_delete_admin, {
          data: { url: newImageUrls },
        });

        return res.status(400).send(`Invalid time range: ${start} - ${end}`);
      }
    }
    const newImages = [];
    if (removedImages.length != 0) {
      console.log("removed image is there");
      const res = await axios.delete(base_delete_admin, {
        data: { url: removedImages },
      });

      for (const image of images) {
        for (const photo of removedImages) {
          if (image != photo) {
            newImages.push(image);
          }
        }
      }
    }
    let updatedGround = null;
    console.log(newImages);
    if (newImages.length != 0) {
      console.log("new image is there");
      updatedGround = await Ground.findByIdAndUpdate(
        groundId,
        {
          name,
          image: newImages,
          location,
          pricePerHour,
          availability,
          description,
          capacity,
          features,
        },
        { new: true, runValidators: true }
      );
    } else {
      console.log("no new image si there");
      updatedGround = await Ground.findByIdAndUpdate(
        groundId,
        {
          name,
          image: images,
          location,
          availability,
          pricePerHour,
          description,
          capacity,
          features,
        },
        { new: true, runValidators: true }
      );
    }

    if (!updatedGround) {
      return res.send("Ground couldnt be updated, try again letter");
    }
    return res.send("Ground updated successfully");
  } catch (error) {
    console.log(error);
    return res.json({ msg: "error", error });
  }
};

export const viewGrounds = async (req, res) => {
  const admin = await Admin.findOne({ email: req.admin.email });
  const grounds = await Ground.find({
    admin: admin._id,
  });
  if (grounds.length == 0) {
    return res.status(400).json({ msg: "no grounds" });
  }
  return res.status(200).json({ grounds });
};
export const viewGround = async (req, res) => {
  const id = req.params.id;
  const admin = await Admin.findOne({ email: req.admin.email });

  const ground = await Ground.findOne({ _id: id });

  if (ground.length == 0) {
    return res.send("no such ground exists");
  }
  if (admin._id.toString() != ground.admin) {
    return res.send("You are not authorized to see this ground");
  }
  return res.send(ground);
};

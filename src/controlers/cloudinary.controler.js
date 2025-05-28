import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config(); // must be before cloudinary.config()

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Controller to handle image upload
export const uploadImage = async (req, res) => {
  try {
    // Assuming the image is sent as a base64 string in req.body.image
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Upload image to Cloudinary directly from base64
    const result = await cloudinary.uploader.upload(image, {
      folder: "portfolio_images", // optional: specify folder in Cloudinary
    });

    // Return Cloudinary URL
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Image upload failed", details: error.message });
  }
};

export default uploadImage;

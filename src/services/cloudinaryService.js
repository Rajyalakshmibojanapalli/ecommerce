import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import ApiError from "../utils/ApiError.js";

export const uploadToCloudinary = (buffer, folder = "ecommerce") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" },
          { format: "webp" },
        ],
      },
      (error, result) => {
        if (error) reject(new ApiError(500, "Image upload failed"));
        resolve({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
};

export const uploadMultiple = async (files, folder = "ecommerce/products") => {
  const uploads = files.map((file) => uploadToCloudinary(file.buffer, folder));
  return Promise.all(uploads);
};
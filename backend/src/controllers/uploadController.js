import cloudinary from "../config/cloudinary.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      message: "Please select at least one image",
    });
  }

  const uploadPromises = req.files.map((file) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "tibeb/products",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      stream.end(file.buffer);
    });
  });

  const results = await Promise.all(uploadPromises);

  const images = results.map((result) => ({
    url: result.secure_url,
    publicId: result.public_id,
  }));

  res.status(200).json({
    message: "Images uploaded successfully",
    count: images.length,
    images,
  });
});

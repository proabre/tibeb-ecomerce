import cloudinary from "../config/cloudinary.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      message: "Please select at least one image",
    });
  }

  const uploadPromises = req.files.map((file) =>
    new Promise((resolve, reject) => {
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
    }),
  );

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

export const uploadProductVideos = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      message: "Please select at least one video",
    });
  }

  const uploadPromises = req.files.map((file) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "tibeb/product-videos",
          resource_type: "video",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      stream.end(file.buffer);
    }),
  );

  const results = await Promise.all(uploadPromises);

  if (
    results.some(
      (result) =>
        !Number.isFinite(result.duration) ||
        result.duration <= 0 ||
        result.duration > 60,
    )
  ) {
    await Promise.all(
      results.map((result) =>
        cloudinary.uploader.destroy(result.public_id, {
          resource_type: "video",
        }),
      ),
    );

    return res.status(400).json({
      message: "Product videos must be 60 seconds or shorter.",
    });
  }

  const videos = results.map((result) => result.secure_url);

  res.status(200).json({
    message: "Product videos uploaded successfully",
    count: videos.length,
    videos,
  });
});

import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    const error = new Error("Only image files are allowed");
    error.status = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
});

export function handleProductImageUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Each product photo must be no larger than 5 MB."
        : "Upload no more than 5 product photos at a time.";
    return res.status(400).json({ message });
  }

  if (error.status === 400) {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
}

const videoFileFilter = (req, file, cb) => {
  if (["video/mp4", "video/webm", "video/quicktime"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Videos must be MP4, WebM, or MOV files");
    error.status = 400;
    cb(error, false);
  }
};

export const uploadProductVideoFiles = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 3,
  },
});

export function handleProductVideoUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Each video must be no larger than 20 MB."
        : "Upload no more than 3 videos at a time.";
    return res.status(400).json({ message });
  }

  if (error.status === 400) {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
}

export default upload;

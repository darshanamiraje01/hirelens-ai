import multer from "multer";

// ─── Accepted MIME types ──────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
};

// Store file in memory as a Buffer — streamed directly to Cloudinary,
// no temp files written to disk on the server
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF or DOCX files are allowed for resume upload"),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Helper exported so controller can read file type without re-checking mimetype
export const getFileType = (mimetype) => ALLOWED_MIME_TYPES[mimetype] || "unknown";

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Load .env here too — in ESM, imports are hoisted so cloudinary.config()
// runs BEFORE server.js gets a chance to call dotenv.config().
// Calling it here guarantees env vars are available when this module executes.
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Stream a memory buffer to Cloudinary (PDF/DOCX = resource_type "raw") ────
export const uploadBufferToCloudinary = (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: filename, resource_type: "raw", overwrite: true },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export default cloudinary;

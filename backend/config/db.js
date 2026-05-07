import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Guard — ensures MONGO_URI is loaded even if imported before server.js runs dotenv

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS:          45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("disconnected", () =>
      console.warn("⚠️  MongoDB disconnected. Reconnecting...")
    );
    mongoose.connection.on("reconnected", () =>
      console.log("✅ MongoDB reconnected")
    );
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

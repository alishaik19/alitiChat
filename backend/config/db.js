import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(uri);

    console.log("MongoDB connected successfully");
  } catch (err) {
    console.log("DB Error:", err.message);
    process.exit(1);
  }
};

export default connectDB;

const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("[db] MONGO_URI is not set in .env — MongoDB will not connect.");
    return;
  }
  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("[db] MongoDB connected");
  } catch (err) {
    isConnected = false;
    console.error("[db] MongoDB connection failed:", err.message);
  }

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("[db] MongoDB disconnected");
  });
}

function getDBStatus() {
  // 1 = connected per mongoose.connection.readyState
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
}

module.exports = { connectDB, getDBStatus };

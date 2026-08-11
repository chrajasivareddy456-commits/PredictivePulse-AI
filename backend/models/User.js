const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash, never plain text
    role: { type: String, enum: ["operator", "engineer", "admin"], default: "operator" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

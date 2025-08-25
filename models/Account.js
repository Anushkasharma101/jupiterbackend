const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountNumber: {
      type: String,
      unique: true,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["Active", "Frozen", "Closed"],
      default: "Active",
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },

    // New fields
    minimumBalance: {
      type: Number,
      default: 1000, 
    },
    dailyLimit: {
      type: Number,
      default: 50000, 
    },
    accountHolderInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);

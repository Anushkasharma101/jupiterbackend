const mongoose = require("mongoose");

const subAccountSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",   // Belongs to a main Account
      required: true,
    },
    name: {
      type: String,
      required: true,   // e.g. "Travel Fund", "Emergency Fund"
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,       // Starts at 0 until funds are distributed
    },
    category: {
      type: String,
      enum: [
        "Medical",
        "Food",
        "World",
        "Emergency",
        "Movies",
        "Health and Fitness",
        "Travel",
        "Education",
        "Other"
      ],
      default: "Other",
    },
    isActive: {
      type: Boolean,
      default: true,     // User can deactivate a sub-account
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubAccount", subAccountSchema);

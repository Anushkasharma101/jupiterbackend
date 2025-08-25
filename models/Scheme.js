const mongoose = require("mongoose");

const schemeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, 
    },
    name: {
      type: String,
      required: true, 
    },
    description: {
      type: String,
      default: "", 
    },
    allocations: [
      {
        subAccount: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SubAccount",
          required: true, 
        },
        percentage: {
          type: Number,
          required: true,
          min: 1,
          max: 100, 
        },
      },
    ],
    totalPercentage: {
      type: Number,
      default: 0, 
    },
    category: {
      type: String,
      enum: ["Medical", "Education", "Travel", "Food", "Investment"],
      default: "Investment", 
    },
    interestRate: {
      type: Number,
      default: 0, 
    },
    startDate: {
      type: Date,
      default: Date.now, 
    },
    endDate: {
      type: Date, 
    },
    minAmount: {
      type: Number,
      default: 0, 
    },
    maxAmount: {
      type: Number,
      default: 0, 
    },
    isActive: {
      type: Boolean,
      default: true, 
    },
    archived: {
      type: Boolean,
      default: false, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scheme", schemeSchema);

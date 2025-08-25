const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account", 
      required: true,
    },
    subAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubAccount", 
    },
    type: {
      type: String,
      enum: ["Credit", "Debit"],  
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);

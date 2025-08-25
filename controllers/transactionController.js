const Transaction = require("../models/Transaction");
const SubAccount = require("../models/SubAccount");
const Account = require("../models/Account");

// -------------------- CREATE TRANSACTION --------------------
exports.createTransaction = async (req, res) => {
  try {
    const { subAccountId, type, amount, description } = req.body;

    // ✅ Validate transaction type
    if (!["Credit", "Debit", "Transfer"].includes(type)) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    const subAccount = await SubAccount.findById(subAccountId).populate("account");
    if (!subAccount) {
      return res.status(404).json({ message: "SubAccount not found" });
    }

    // -------------------- ROLE RULES --------------------

    // ✅ Normal User can only access their own subAccounts
    if (req.user.role === "Normal User") {
      if (subAccount.account.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied: not your sub-account" });
      }
    }

    // -------------------- APPLY TRANSACTION --------------------
    if (type === "Credit") {
      subAccount.balance += amount;
    } else if (type === "Debit") {
      if (subAccount.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      subAccount.balance -= amount;
    } else if (type === "Transfer") {
      // For Transfer, need both source + target subAccounts
      const { targetSubAccountId } = req.body;
      if (!targetSubAccountId) {
        return res.status(400).json({ message: "Target subAccountId is required for Transfer" });
      }

      const targetSubAccount = await SubAccount.findById(targetSubAccountId).populate("account");
      if (!targetSubAccount) {
        return res.status(404).json({ message: "Target SubAccount not found" });
      }

      // ✅ Normal User: Both accounts must belong to them
      if (req.user.role === "Normal User") {
        if (
          subAccount.account.user.toString() !== req.user.id ||
          targetSubAccount.account.user.toString() !== req.user.id
        ) {
          return res.status(403).json({ message: "Access denied: transfer only allowed between your own sub-accounts" });
        }
      }

      // Perform transfer
      if (subAccount.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      subAccount.balance -= amount;
      targetSubAccount.balance += amount;

      await subAccount.save();
      await targetSubAccount.save();

      // Save both transaction logs
      const transactionOut = new Transaction({
        account: subAccount.account,
        subAccount: subAccountId,
        type: "Transfer",
        amount,
        description: description || `Transfer to ${targetSubAccountId}`,
      });

      const transactionIn = new Transaction({
        account: targetSubAccount.account,
        subAccount: targetSubAccountId,
        type: "Transfer",
        amount,
        description: description || `Transfer from ${subAccountId}`,
      });

      await transactionOut.save();
      await transactionIn.save();

      return res.status(201).json({
        message: "Transfer successful",
        from: transactionOut,
        to: transactionIn,
      });
    }

    // Save updated subAccount for Credit/Debit
    await subAccount.save();

    // Create transaction log
    const transaction = new Transaction({
      account: subAccount.account,
      subAccount: subAccountId,
      type,
      amount,
      description,
    });

    await transaction.save();

    res.status(201).json({
      message: "Transaction successful",
      transaction,
      subAccount,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// -------------------- GET TRANSACTIONS --------------------
exports.getTransactions = async (req, res) => {
  try {
    const { subAccountId } = req.params;

    const subAccount = await SubAccount.findById(subAccountId).populate("account");
    if (!subAccount) {
      return res.status(404).json({ message: "SubAccount not found" });
    }

    // ✅ Normal User: can only see their own transactions
    if (req.user.role === "Normal User") {
      if (subAccount.account.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied: not your sub-account" });
      }
    }

    // ✅ Admin: no restrictions → can view anyone’s transactions
    const transactions = await Transaction.find({ subAccount: subAccountId })
      .populate("subAccount")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const Account = require("../models/Account");
const AccountDeletionRequest = require("../models/AccountDeletionRequest");
const SubAccount = require("../models/SubAccount");
const User = require("../models/User");
const cron = require("node-cron");
const sendEmail = require("../utils/sendEmail");

// Create new account for a user
exports.createAccount = async (req, res) => {
  try {
    const {
      userId,         // The user for whom Admin wants to create the account
      accountNumber,  // Admin provides this
      balance,
      currency,
      status,
      minimumBalance,
      dailyLimit,
    } = req.body;

    // Only Admin can create accounts
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admin can create accounts" });
    }

    // Validate required fields
    if (!userId || !accountNumber || !currency || !status) {
      return res.status(400).json({ message: "userId, accountNumber, currency, and status are required" });
    }

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // Check if account number already exists
    const existingAccount = await Account.findOne({ accountNumber });
    if (existingAccount) {
      return res.status(400).json({ message: "Account number already exists" });
    }

    // Check if user already has an account (optional, for single account per user)
    const existingUserAccount = await Account.findOne({ user: targetUser._id });
    if (existingUserAccount) {
      return res.status(400).json({ message: "This user already has an account" });
    }

    // Create account
    const account = new Account({
      user: targetUser._id,
      accountNumber,
      balance: balance || 0,
      currency,
      status,
      minimumBalance: minimumBalance || 1000,
      dailyLimit: dailyLimit || 50000,
      accountHolderInfo: {
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
      },
    });

    await account.save();

    res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get account details
exports.getAccount = async (req, res) => {
  try {
    let accounts;

    if (req.user.role === "Admin") {
      // Admin sees all accounts
      accounts = await Account.find().populate("user", "name email role phone");
    } else {
      // Normal user sees only their account
      const account = await Account.findOne({ user: req.user._id }).populate(
        "user",
        "name email role phone"
      );
      if (!account) {
        return res.status(404).json({
          success: false,
          message:
            "No account exists for this user. Please contact Admin to create one.",
        });
      }
      accounts = [account];
    }

    res.status(200).json({
      success: true,
      count: accounts.length,
      accounts,
    });
  } catch (err) {
    console.error("Error fetching accounts:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching accounts",
      error: err.message,
    });
  }
};


// Get account by ID – Admin only
exports.getAccountById = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { id } = req.params;

    const account = await Account.findById(id).populate(
      "user",
      "name email role phone"
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({
      success: true,
      account,
    });
  } catch (err) {
    console.error("Error fetching account by ID:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching account",
      error: err.message,
    });
  }
};


// Deposit money into main account
exports.deposit = async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;

    if (!accountNumber) {
      return res.status(400).json({ message: "Account number required" });
    }
    if (amount === undefined || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Please provide a valid amount greater than 0" });
    }

    let account;

    if (req.user.role === "Admin") {
      // Admin can deposit into any account
      account = await Account.findOne({ accountNumber });
    } else {
      // Normal User can deposit only into their own account
      account = await Account.findOne({ accountNumber, user: req.user._id });
    }

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    account.balance += amount;
    account.lastActivity = new Date();
    await account.save();

    res.status(200).json({ message: "Deposit successful", balance: account.balance });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// Withdraw money from main account
exports.withdraw = async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;

    if (!accountNumber) {
      return res.status(400).json({ message: "Account number required" });
    }

    if (amount === undefined || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Please provide a valid amount greater than 0" });
    }

    let account;

    if (req.user.role === "Admin") {
      // Admin can withdraw from any account
      account = await Account.findOne({ accountNumber });
    } else {
      // Normal User can withdraw only from their own account
      account = await Account.findOne({ accountNumber, user: req.user._id });
    }

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    account.balance -= amount;
    account.lastActivity = new Date();
    await account.save();

    res.status(200).json({ message: "Withdrawal successful", balance: account.balance });
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Distribute funds into sub-accounts (automatic split)
exports.distributeFunds = async (req, res) => {
  try {
    const { allocations } = req.body;

    const account = await Account.findOne({ user: req.user._id });
    if (!account) return res.status(404).json({ message: "Account not found" });

    let totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);

    if (account.balance < totalAmount)
      return res.status(400).json({ message: "Insufficient funds" });

    for (let allocation of allocations) {
      let subAccount = await SubAccount.findById(allocation.subAccountId);
      if (subAccount) {
        subAccount.balance += allocation.amount;
        await subAccount.save();
      }
    }

    account.balance -= totalAmount;
    account.lastActivity = new Date();
    await account.save();

    res.json({
      message: "Funds distributed successfully",
      balance: account.balance,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateAccountStatus = async (req, res) => {
  try {
    const { status } = req.body; // expected values: "Active", "Frozen", "Closed"
    const { id } = req.params;

    // Validate status
    const validStatuses = ["Active", "Frozen", "Closed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of ${validStatuses.join(", ")}` });
    }

    // Find account
    const account = await Account.findById(id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Update status
    account.status = status;
    await account.save();

    res.status(200).json({
      message: `Account status updated to ${status}`,
      account: {
        id: account._id,
        user: account.user,
        accountNumber: account.accountNumber,
        balance: account.balance,
        currency: account.currency,
        status: account.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.requestAccountDeletion = async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.user._id });
    if (!account) return res.status(404).json({ message: "Account not found" });

    // Check if a pending request already exists
    const existingRequest = await AccountDeletionRequest.findOne({
      account: account._id,
      status: "Pending",
    });
    if (existingRequest)
      return res.status(400).json({ message: "You already have a pending request" });

    const request = new AccountDeletionRequest({
      user: req.user._id,
      account: account._id,
    });
    await request.save();

    // TODO: send email to Admin notifying new deletion request

    res
      .status(201)
      .json({ message: "Account deletion request sent to Admin", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin deletes account after request
exports.deleteAccountByAdmin = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await AccountDeletionRequest.findById(requestId).populate(
      "account user"
    );
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== "Pending")
      return res.status(400).json({ message: "Request is already processed" });

    const account = request.account;

    if (account.balance > 0)
      return res.status(400).json({
        message: "Account has remaining balance. Cannot delete until balance is 0",
      });

    // Delete the account
    await Account.deleteOne({ _id: account._id });

    // Update request status
    request.status = "Deleted";
    request.deletedAt = new Date();
    await request.save();

    // Schedule email 15 days later
    const sendDate = new Date();
    sendDate.setDate(sendDate.getDate() + 15); // 15 days from now

    const cronTime = `${sendDate.getMinutes()} ${sendDate.getHours()} ${sendDate.getDate()} ${sendDate.getMonth() + 1} *`; 

    cron.schedule(cronTime, async () => {
      try {
        await sendEmail({
          to: request.user.email,
          subject: "Account Deleted Successfully",
          text: `Your account ${account.accountNumber} has been deleted successfully.`,
          html: `<p>Your account <strong>${account.accountNumber}</strong> has been deleted successfully.</p>`,
        });
        console.log(`Confirmation email sent to ${request.user.email}`);
      } catch (err) {
        console.error("Failed to send deletion confirmation email:", err);
      }
    });

    res.status(200).json({ message: "Account deleted, email scheduled in 15 days", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const SubAccount = require("../models/SubAccount");
const Account = require("../models/Account");

exports.createSubAccount = async (req, res) => {
  try {
    const { accountId, name, category, balance } = req.body;

    // Validate required fields
    if (!accountId) {
      return res.status(400).json({ message: "accountId is required" });
    }
    if (!name) {
      return res.status(400).json({ message: "Sub-account name is required" });
    }

    // Find the main account
    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ message: "Main account not found" });

    // Ensure normal users can only create sub-accounts for their own main account
    if (req.user.role !== "Admin" && account.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Cannot create sub-account for another user" });
    }

    // Create sub-account
    const subAccount = new SubAccount({
      account: accountId,
      name,
      category: category || "Other",
      balance: balance || 0,
    });

    await subAccount.save();
    res.status(201).json({ message: "Sub-account created successfully", subAccount });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};


// Get subaccounts for logged-in user (Normal User)
exports.getUserSubAccounts = async (req, res) => {
  try {
    let { accountId } = req.params;

    // If normal user -> auto resolve accountId
    if (req.user.role === "Normal User") {
      const account = await Account.findOne({ user: req.user.id });
      if (!account) return res.status(404).json({ message: "Main account not found" });
      accountId = account._id; // overwrite with their own account
    }

    const subAccounts = await SubAccount.find({ account: accountId });
    res.json(subAccounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single subaccount by ID (Admin only)
exports.getSubAccountByIdAdmin = async (req, res) => {
  try {
    // Check role
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const subAccount = await SubAccount.findById(req.params.id);

    if (!subAccount) {
      return res.status(404).json({ message: "SubAccount not found" });
    }

    res.status(200).json({
      success: true,
      data: subAccount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ============================
// Update sub-account
// ============================
exports.updateSubAccount = async (req, res) => {
  try {
    const subAccount = await SubAccount.findById(req.params.id);
    if (!subAccount) {
      return res.status(404).json({ message: "SubAccount not found" });
    }

    // If normal user -> only allow name, category, isActive
    if (req.user.role === "Normal User") {
      const account = await Account.findById(subAccount.account);
      if (!account || account.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this sub-account" });
      }

      // restrict allowed fields
      const { name, category, isActive } = req.body;
      if (name !== undefined) subAccount.name = name;
      if (category !== undefined) subAccount.category = category;
      if (isActive !== undefined) subAccount.isActive = isActive;
    } else if (req.user.role === "Admin") {
      // Admin can update anything
      Object.assign(subAccount, req.body);
    }

    await subAccount.save();
    res.json({ message: "SubAccount updated", subAccount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ============================
// Delete sub-account
// ============================
exports.deleteSubAccount = async (req, res) => {
  try {
    const subAccount = await SubAccount.findById(req.params.id);
    if (!subAccount) {
      return res.status(404).json({ message: "SubAccount not found" });
    }

    // If normal user -> only delete if they own it AND balance = 0
    if (req.user.role === "Normal User") {
      const account = await Account.findById(subAccount.account);
      if (!account || account.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this sub-account" });
      }
      if (subAccount.balance > 0) {
        return res.status(400).json({ message: "Cannot delete sub-account with non-zero balance" });
      }
    }

    await subAccount.deleteOne();
    res.json({ message: "SubAccount deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
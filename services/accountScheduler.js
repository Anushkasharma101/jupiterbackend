const cron = require("node-cron");
const Account = require("../models/Account");

const freezeInactiveAccounts = () => {
  // Schedule to run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const accountsToFreeze = await Account.find({
      status: "Active",
      lastActivity: { $lt: ninetyDaysAgo }
    });

    for (let account of accountsToFreeze) {
      account.status = "Frozen";
      await account.save();
    }

    console.log(`Frozen ${accountsToFreeze.length} inactive accounts`);
  });
};

module.exports = freezeInactiveAccounts;

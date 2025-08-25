const express = require("express");
const router = express.Router();

const accountController = require("../controllers/accountController");
const {protect,authorize} = require("../middlewares/authMiddleware")

router.post("/create", protect,authorize("Admin"), accountController.createAccount);
router.get("/:id", protect, authorize("Admin"), accountController.getAccountById);
router.get("/", protect, accountController.getAccount);
router.post("/deposit", protect, accountController.deposit);
router.post("/request-deletion", protect,authorize("Normal User"), accountController.requestAccountDeletion);
router.delete("/admin/delete/:requestId",protect,authorize("Admin"),accountController.deleteAccountByAdmin);
router.post("/withdraw", protect, accountController.withdraw);
router.post("/distribute", protect, authorize("Normal User"), accountController.distributeFunds);
router.put("/:id/status", protect, authorize("Admin"), accountController.updateAccountStatus);

module.exports = router;

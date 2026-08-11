const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getModelInfo } = require("../controllers/modelInfoController");

router.get("/", requireAuth, getModelInfo);

module.exports = router;

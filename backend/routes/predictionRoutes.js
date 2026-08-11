const express = require("express");
const multer = require("multer");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  analyzeMachine,
  listPredictions,
  getPrediction,
  uploadCsv,
  getSampleRow,
} = require("../controllers/predictionController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB, dataset is ~120MB but typical uploads are smaller subsets
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      return cb(new Error("Only .csv files are accepted."));
    }
    cb(null, true);
  },
});

router.post("/analyze", requireAuth, analyzeMachine);
router.get("/sample", requireAuth, getSampleRow);
router.get("/", requireAuth, listPredictions);
router.get("/:id", requireAuth, getPrediction);
router.post("/upload-csv", requireAuth, upload.single("file"), uploadCsv);

module.exports = router;

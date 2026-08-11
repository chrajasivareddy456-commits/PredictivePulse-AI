const mlService = require("../services/mlService");

async function getModelInfo(req, res, next) {
  try {
    const info = await mlService.getModelInfo();
    res.json(info);
  } catch (err) {
    next(err);
  }
}

module.exports = { getModelInfo };

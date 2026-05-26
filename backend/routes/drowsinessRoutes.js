// backend/routes/drowsinessRoutes.js
const express = require("express");
const router = express.Router();
const Drowsiness = require("../models/Drowsiness");

// Save data
router.post("/add", async (req, res) => {
  try {
    const data = new Drowsiness(req.body);
    await data.save();
    res.status(201).json({ message: "Data saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all logs
router.get("/", async (req, res) => {
  const logs = await Drowsiness.find();
  res.json(logs);
});

module.exports = router;
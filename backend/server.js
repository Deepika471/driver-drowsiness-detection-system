require("dotenv").config();

const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const cors = require("cors");
const mongoose = require("mongoose");
const authMiddleware = require("./middleware/authMiddleware");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("MongoDB Error ❌", err));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ================== SCHEMAS ==================
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String
}, { timestamps: true });

const predictionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  image: String,
  predicted_class: String,
  state: String,
  // ✅ FIX 3: was `Number` — Python sends an object, not a number
  confidence: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Prediction = mongoose.model("Prediction", predictionSchema);

// ✅ FIX 1a: was /api/register — frontend calls /api/auth/register
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword });

    // ✅ generate token on register too so frontend can auto-login
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "User registered successfully",
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
      token   // ✅ send token so frontend can redirect directly to /detect
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ FIX 1b: was /api/login — frontend calls /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ FIX 4: was hardcoded "secretkey"
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email },
      token
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ FIX 2: was /api/predict — frontend calls /api/detect
app.post("/api/detect", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    console.log("📥 FILE:", req.file);

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    let response;
    try {
      response = await axios.post(
        "http://127.0.0.1:5000/predict",
        formData,
        { headers: formData.getHeaders() }
      );
    } catch (err) {
      console.error("❌ Python API Error:", err.message);
      return res.status(500).json({ message: "Python server not reachable" });
    }

    const result = response.data;
    console.log("🤖 MODEL RESULT:", result);

    const record = await Prediction.create({
      userId: req.user.id,
      image: req.file.path,
      predicted_class: result.predicted_class,
      state: result.state,
      confidence: result.confidence  // ✅ now saves the full object correctly
    });

    res.json(record);
  } catch (error) {
    console.error("PREDICT ERROR:", error.message);
    res.status(500).json({ message: "Prediction failed" });
  }
});

app.get("/api/predictions", authMiddleware, async (req, res) => {
  try {
    const data = await Prediction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch predictions" });
  }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
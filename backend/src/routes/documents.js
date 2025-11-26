import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";

const router = express.Router();

// Storage for uploaded files (local – good for Render development)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/documents");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// Document schema
const documentSchema = new mongoose.Schema(
  {
    vehicleId: { type: String, required: true },
    type: { type: String, required: true }, // e.g. insurance, registration, permit
    filePath: { type: String, required: true },
    uploadedOn: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Document = mongoose.model("Document", documentSchema);

/**
 * @route   POST /documents
 * @desc    Upload a new document
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "Document file is required" });

    const doc = new Document({
      vehicleId: req.body.vehicleId,
      type: req.body.type,
      filePath: req.file.path
    });

    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route   GET /documents
 * @desc    Get all documents
 */
router.get("/", async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /documents/:id
 * @desc    Get document by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) return res.status(404).json({ error: "Document not found" });

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   PUT /documents/:id
 * @desc    Update document metadata
 */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Document.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    if (!updated)
      return res.status(404).json({ error: "Document not found" });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route   DELETE /documents/:id
 * @desc    Delete document + file
 */
router.delete("/:id", async (req, res) => {
  try {
    const removed = await Document.findByIdAndDelete(req.params.id);

    if (!removed)
      return res.status(404).json({ error: "Document not found" });

    res.json({ message: "Document removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

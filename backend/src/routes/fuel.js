import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Fuel Schema (adjust fields according to your actual DB)
const fuelSchema = new mongoose.Schema(
  {
    vehicleId: { type: String, required: true },
    liters: { type: Number, required: true },
    cost: { type: Number, required: true },
    filledOn: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Fuel = mongoose.model("Fuel", fuelSchema);

/**
 * @route   POST /fuel
 * @desc    Add fuel entry
 */
router.post("/", async (req, res) => {
  try {
    const fuel = new Fuel(req.body);
    await fuel.save();
    res.status(201).json(fuel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route   GET /fuel
 * @desc    Get all fuel logs
 */
router.get("/", async (req, res) => {
  try {
    const logs = await Fuel.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /fuel/:id
 * @desc    Get single fuel entry
 */
router.get("/:id", async (req, res) => {
  try {
    const log = await Fuel.findById(req.params.id);

    if (!log) return res.status(404).json({ error: "Fuel record not found" });

    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   PUT /fuel/:id
 * @desc    Update fuel entry
 */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Fuel.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    if (!updated)
      return res.status(404).json({ error: "Fuel record not found" });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route   DELETE /fuel/:id
 * @desc    Delete fuel entry
 */
router.delete("/:id", async (req, res) => {
  try {
    const removed = await Fuel.findByIdAndDelete(req.params.id);

    if (!removed)
      return res.status(404).json({ error: "Fuel record not found" });

    res.json({ message: "Fuel record deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

const Scheme = require("../models/Scheme");

exports.createScheme = async (req, res) => {
  try {
    const {
      name,
      description,
      allocations,
      category,
      interestRate,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      isActive,
      archived,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Scheme name is required" });
    }

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res
        .status(400)
        .json({ message: "Allocations array is required" });
    }

    let totalPercentage = 0;
    for (let alloc of allocations) {
      if (!alloc.subAccount || !alloc.percentage) {
        return res.status(400).json({
          message: "Each allocation must have subAccount and percentage",
        });
      }
      if (alloc.percentage < 1 || alloc.percentage > 100) {
        return res
          .status(400)
          .json({ message: "Allocation percentage must be 1-100" });
      }
      totalPercentage += alloc.percentage;
    }

    if (totalPercentage > 100) {
      return res
        .status(400)
        .json({ message: "Total allocation percentage cannot exceed 100" });
    }

    const scheme = new Scheme({
      user: req.user._id, 
      name,
      description: description || "",
      allocations,
      totalPercentage,
      category: category || "Investment",
      interestRate: interestRate || 0,
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      minAmount: minAmount || 0,
      maxAmount: maxAmount || 0,
      isActive: isActive !== undefined ? isActive : true,
      archived: archived !== undefined ? archived : false,
    });

    await scheme.save();
    res.status(201).json({ message: "Scheme created successfully", scheme });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all schemes
exports.getSchemes = async (req, res) => {
  try {
    const schemes = await Scheme.find();
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single scheme by ID
exports.getSchemeById = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ message: "Scheme not found" });
    res.json(scheme);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update scheme
exports.updateScheme = async (req, res) => {
  try {
    const { allocations } = req.body;

    let totalPercentage = 0;
    if (allocations) {
      for (let alloc of allocations) {
        if (!alloc.subAccount || !alloc.percentage) {
          return res.status(400).json({
            message: "Each allocation must have subAccount and percentage",
          });
        }
        if (alloc.percentage < 1 || alloc.percentage > 100) {
          return res
            .status(400)
            .json({ message: "Allocation percentage must be 1-100" });
        }
        totalPercentage += alloc.percentage;
      }
      if (totalPercentage > 100) {
        return res
          .status(400)
          .json({ message: "Total allocation percentage cannot exceed 100" });
      }
      req.body.totalPercentage = totalPercentage;
    }

    const scheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!scheme) return res.status(404).json({ message: "Scheme not found" });

    res.json({ message: "Scheme updated successfully", scheme });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete scheme
exports.deleteScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndDelete(req.params.id);
    if (!scheme) return res.status(404).json({ message: "Scheme not found" });
    res.json({ message: "Scheme deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

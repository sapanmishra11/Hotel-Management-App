const globalModel = require("../models/globalModel");

const fetchGlobalDetails = async (req, res) => {
  try {
    const details = await globalModel.getGlobalDetails();
    res.json(details || {});
  } catch (err) {
    console.error("Fetch Global Details Error:", err);
    res.status(500).json("Error fetching global details");
  }
};

const editGlobalDetails = async (req, res) => {
  try {
    const updated = await globalModel.updateGlobalDetails(req.body);
    res.json({ message: "Update successful", data: updated });
  } catch (err) {
    console.error("Update Global Details Error:", err);
    res.status(500).json("Error updating global details");
  }
};

module.exports = { fetchGlobalDetails, editGlobalDetails };

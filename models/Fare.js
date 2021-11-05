const mongoose = require("mongoose");

const FareSchema = mongoose.Schema({
  destination: String,
  fare: String,
});

module.exports = mongoose.model("Fare", FareSchema);
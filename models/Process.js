const mongoose = require("mongoose");

const ProcessSchema = mongoose.Schema({
  destination: String,
  location: String,
  name: String,
  cpnum: Number,
  NoOfPassengers: Number

});

module.exports = mongoose.model("Process", ProcessSchema);
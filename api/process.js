const router = require("express").Router();

const Process = require("../models/Process");

router.get("/", async (req, res) => {
  try {
    const process = await Process.find();
    res.status(200).send(process);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: err.message,
    });
  }
});

router.post("/", async (req, res) => {
    try {
      const response = await new Process({
        destination: req.body.destination,
        location: req.body.location,
        name: req.body.name,
        cpnum: req.body.cpnum,
        NoOfPassengers: req.body.NoOfPassengers
      }).save();
  
      res.status(200).send(response);
    } catch (err) {
      res.status(400).send({
        error: err.message,
      });
    }
  });

module.exports = router;
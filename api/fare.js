const router = require("express").Router();

const Fare = require("../models/Fare");

router.get("/", async (req, res) => {
  try {
    const fares = await Fare.find();
    res.status(200).send(fares);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: err.message,
    });
  }
});

router.post("/", async (req, res) => {
    try {
      const response = await new Fare({
        destination: req.body.destination,
        fare: req.body.fare,
      }).save();
  
      res.status(200).send(response);
    } catch (err) {
      res.status(400).send({
        error: err.message,
      });
    }
  });

module.exports = router;
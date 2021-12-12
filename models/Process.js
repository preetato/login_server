const mongoose = require('mongoose')

const ProcessSchema = new mongoose.Schema(
  {
    destination: String,
    location: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    cpnum: Number,
    NoOfPassengers: Number,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

module.exports = {
  default: mongoose.model('Process', ProcessSchema),
  processSchema: ProcessSchema,
}

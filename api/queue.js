const { default: Queue } = require('../models/Queue')
const { default: Driver } = require('../models/Driver')
const { default: Logs, QueueStatus } = require('../models/Logs')
// const { default: Logs } = require("../models/Logs");
const router = require('express').Router()
const { default: Process } = require('../models/Process')
const twilio = require('twilio')
const { config } = require('dotenv')

config()

router.get('/', async (req, res) => {
  try {
    const currentQueuedDrivers = await Queue.find()
    res.status(200).send(currentQueuedDrivers)
  } catch (err) {
    res.status(500).send({
      error: err.message,
    })
  }
})
router.post('/booking', async (req, res) => {
  try {
    const { processId } = req.body

    //CREATE LOG FOR BOOKING
    const process = await Process.findById(processId)

    const queue = await getOneDriverAndPutToQueue()

    await new Logs({
      process,
      queue,
      status: Object.keys(QueueStatus),
    })
    res.status(200).send({
      driver: queue,
    })
  } catch (err) {
    res.status(500).send({
      error: err.message,
    })
  }
})

router.post('/booking-cancelled', async (req, res) => {
  //cancelled by customer / user
  //queued driver when returned to driver table,
  // ordernumber is not changed
  try {
    const { queueId, processId } = req.body
    if (!processId) {
      return res.status(400).send({
        error: 'Process Id is required',
      })
    }

    // const updatedqueue = await Queue.findOne(processId, async (err, doc) => {
    //   if (err) {
    //     throw new Error(err)
    //   }
    //   await doc.save({
    //     status: 'CANCELLED',
    //   })
    // })
    await Process.findByIdAndUpdate(
      processId,
      {
        $set: {
          status: 'CANCELLED',
        },
      },
      {
        new: true,
      }
    )

    if (!queueId) {
      return res.status(400).send({
        error: 'Queue Id is required',
      })
    }

    let driverInfo = await getDriverFromQueue(queueId)

    console.log('driver Info is - ', driverInfo)

    await insertDriverWithSameOrderNumber(driverInfo)
    await Queue.findByIdAndDelete(queueId)

    return res.status(200).send({
      message: 'Trip was cancelled',
    })
  } catch (err) {
    return res.status(500).send({
      error: err.message,
    })
  }
})

router.post('/booking-rejected', async (req, res) => {
  //ordernumbe changed to last highest ordernumber
  try {
    const { queueId, processId } = req.body
    if (!processId) {
      return res.status(400).send({
        error: 'Process Id is required',
      })
    }
    await Process.findByIdAndUpdate(
      processId,
      {
        $set: {
          status: 'REJECTED',
        },
      },
      {
        new: true,
      }
    )

    if (!queueId) {
      return res.status(400).send({
        error: 'Queue Id is required',
      })
    }

    let driverInfo = await getDriverFromQueue(queueId)

    console.log('driver Info is - ', driverInfo)

    await insertDriverInLast(driverInfo)
    await Queue.findByIdAndDelete(queueId)

    return res.status(200).send({
      message: 'Trip was rejected',
    })
  } catch (err) {
    console.error(err.message)
    return res.status(500).send({
      error: err.message,
    })
  }
})

router.post('/confirm-booking', (req, res) => {
  //respond customer confirms driver is on its way
  //TWILIO API
})

router.post('/driver-arrived', async (req, res) => {
  //JUST ADD A LOG THAT THE DRIVER PICKED UP THE USER
  await new Logs({
    status: Object.keys(QueueStatus),
  })
})

router.post('/end-driver-trip', async (req, res) => {
  //twilio
  //send mesasge to driver that the customer has ended trip
  //from queue to driver table
  try {
    const { queueId, processId } = req.body
    if (!processId) {
      return res.status(400).send({
        error: 'Process Id is required',
      })
    }
    await Process.findByIdAndUpdate(
      processId,
      {
        $set: {
          status: 'COMPLETE',
        },
      },
      {
        new: true,
      }
    )

    if (!queueId) {
      return res.status(400).send({
        error: 'Queue Id is required',
      })
    }

    let driverInfo = await getDriverFromQueue(queueId)

    console.log('driver Info is - ', driverInfo)

    await insertDriverInLast(driverInfo)
    await Queue.findByIdAndDelete(queueId)

    return res.status(200).send({
      message: 'Trip ended successfully',
    })
  } catch (err) {
    return res.status(500).send({
      error: err.message,
    })
  }
})

//Admin route

/**
 * first argument is asc or desc
 */
const getDriversSorted = async (arg) => {
  let drivers = await Driver.find().sort({
    ordernumber: arg === 'desc' ? -1 : 1,
  })
  if (drivers.length === 0) {
    throw new Error('No Drivers Available')
  }
  return drivers
}

const getOneDriverAndPutToQueue = async () => {
  try {
    const getDriver = (await getDriversSorted())[0]
    await Driver.findByIdAndDelete(getDriver._id)

    const addDriverToQueue = await new Queue({
      drivername: getDriver.drivername,
      driveraddress: getDriver.driveraddress,
      platenumber: getDriver.platenumber,
      drivercpnum: getDriver.drivercpnum,
      ordernumber: getDriver.ordernumber,
    }).save()
    return addDriverToQueue
  } catch (err) {
    throw new Error(err)
  }
}

const getDriverFromQueue = async (queueId) => {
  const queue = await Queue.findById(queueId).catch((err) => {
    throw new Error(err.message)
  })
  if (!queue) {
    throw new Error(`Driver not found from queue 
        Might be from wrong queueId Given
      `)
  }
  return queue
}

const insertDriverWithSameOrderNumber = async (driverInfo) => {
  driverInfo = JSON.parse(JSON.stringify(driverInfo))
  try {
    delete driverInfo._id
    delete driverInfo._v
    await new Driver({
      ...driverInfo,
    }).save()
    return Promise.resolve()
  } catch (e) {
    console.log(e)
    return Promise.reject('Something went wrong')
  }
}

const insertDriverInLast = async (driverInfo) => {
  driverInfo = JSON.parse(JSON.stringify(driverInfo))
  try {
    let lastDriverInfo = (await getDriversSorted('desc'))[0]
    let nextSeq = 0
    if (lastDriverInfo && lastDriverInfo.ordernumber) {
      nextSeq = lastDriverInfo.ordernumber + 1
    }
    delete driverInfo._id
    delete driverInfo._v
    await new Driver({
      ...driverInfo,
      ordernumber: nextSeq,
    }).save()
    return Promise.resolve()
  } catch (e) {
    console.log(e)
    return Promise.reject('Something went wrong')
  }
}

router.post('/send-trial-twilio', async (req, res) => {
  try {
    const { message, to } = req.body
    if (!message || !to) {
      throw { message: `One of the required fields are missing`, status: 400 }
    }
    await sendMessage({
      ...req.body,
    })
      .then((sendMessageresult) => {
        res.status(200).send({
          message: `Success`,
          ...sendMessageresult,
        })
      })
      .catch((err) => {
        throw {
          message: err.message,
          status: 500,
        }
      })
  } catch (err) {
    const errMessage = err
    res
      .status(errMessage?.status || 500)
      .send({ message: errMessage.message, status: 400 })
  }
})

router.get('/move-drivers-from-queue', async (req, res) => {
  try {
    const queues = await Queue.find()
    if (queues.length === 0) {
      throw new Error(`There are no driver's queue`)
    }

    const queueMap = queues.map((queue) => {
      console.log('One Queue', queue)
      return returnDriverFromQueue({
        queueId: queue._id,
      }).catch((err) => {
        throw err
      })
    })
    Promise.all(queueMap)
      .then((response) => {
        console.log('queueMapResponse', response)
        res.status(200).send(`Drivers return back to queue? `)
      })
      .catch((err) => {
        throw new Error(err)
      })
    // queues.map(async (queue) => {

    //   await returnDriverFromQueue({ queueId: queue._id })
    // })
  } catch (err) {
    res.status(500).send({
      error: err.message,
    })
  }
})

const returnDriverFromQueue = async ({ queueId, putToLast }) => {
  try {
    console.log(queueId)
    const driverToBeReturned = { ...(await Queue.findById(queueId))._doc }
    console.log('driverToBeReturned', driverToBeReturned)
    await Queue.findOneAndDelete(driverToBeReturned._id)
    if (putToLast) {
      const returnedDriverToLast = await new Driver({
        ...driverToBeReturned,
        ordernumber: getDriversSorted('desc')[0].ordernumber + 1,
      }).save()
      console.log(returnedDriverToLast)
      return `Driver from queue now Put to last index of Drivers database`
    } else {
      const returnedDriverToDefault = await new Driver({
        ...driverToBeReturned,
      }).save()
      console.log('retrievedDriver from Queue', driverToBeReturned)
      console.log('returnedDriver to Database', returnedDriverToDefault)
      return `Driver returned from queue and put to default position`
    }
  } catch (err) {
    throw new Error(err.message)
  }
}

function sendMessage({ to, message }) {
  const twilioClient = twilio(
    process.env.TWILIO_ACCCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  if (!/\+63[0-9]{10}$/.test(to)) {
    throw new Error(
      'Invalid Phone number length or format: start with +63 and should be 13 characters long'
    )
  }

  return twilioClient.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    })
    .then((res) => {
      return res.toJSON()
    })
    .catch((err) => {
      console.log('Sending Message Error', err)
      throw new Error(err)
    })
}

module.exports = router

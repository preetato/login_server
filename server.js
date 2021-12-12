require('./config/db')
const cors = require('cors')
const app = require('express')()
const port = process.env.PORT || 3000
const UserRouter = require('./api/User')
const fareRoutes = require('./api/fare')
const processRoutes = require('./api/process')
const driverRoutes = require("./api/driver.js")
const logsRoute = require("./api/logs.js")
const queueRoute = require("./api/queue")
app.use(cors())

// for accepting post form data
const bodyParser = require('express').json
app.use(bodyParser())

app.get('/', (req, res) => {
  res.send('Welcome to E-Tulod Backend Server')
})
app.use('/user', UserRouter)
app.use('/fare', fareRoutes)
app.use('/process', processRoutes)
app.use("/logs", logsRoute);
app.use("/queue", queueRoute);
app.use("/driver", driverRoutes);


app.listen(port, () => {
  console.log(process.env.MONGO_URI)
  console.log('server running on port 3000')
})

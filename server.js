
require('./config/db');
const app = require ('express')();
const port =process.env.PORT || 3000;
const UserRouter = require('./api/User');
const fareRoutes = require('./api/fare');
const processRoutes = require('./api/process');

// for accepting post form data
const bodyParser = require('express').json;
app.use(bodyParser());

app.use('/user', UserRouter);
app.use("/fare", fareRoutes);
app.use("/process", processRoutes);



app.listen(port, ()=>{
    console.log('server running on port 3000');
})

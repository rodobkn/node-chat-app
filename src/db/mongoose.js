const mongoose = require('mongoose')


//We are connecting to our database.
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,   //That means the index will create automatically
    useFindAndModify: false, //We provided that, in order to don't have the warning in the console
})
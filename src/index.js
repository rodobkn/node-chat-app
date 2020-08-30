const express = require('express')
require('./db/mongoose')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const Message = require('./models/message')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)  //This is done by exprexx automatically, but now we are hardcoding in order to use WebSockets ina a nice way
const io = socketio(server)   //It is necessary to pass to socketio the server, so for this reasons we stored the server in a variable before

const port = process.env.PORT
const publicDirectoryPath = path.join(__dirname, '../public')

//We are using the publicDirectoryPath now, before we only set up the variable in  order to use now.
app.use(express.static(publicDirectoryPath)); 


//let count = 0
//When trigger a connection by the client side, we will execute this function
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    //We are waiting of the event 'join' trigger by the client side. 'options' is the data received from the client
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options})    //You need to see that each socket(that means each user connected) has its own id, that we can use. At the same time we are storing the user if there wasn't an error
        
        if (error) {
            return callback(error)    //Here are stoping the function if there was an error, like the username was already taken
        }

        socket.join(user.room) 

        socket.emit('message', generateMessage('Admin' ,'Welcome!'))  // 'Welcome!' in this case is the data that we will need to use the client (is the second argument). We send a timestamp as well in the object that return the function in the second argument. Basically we are sending gretings to all the users
        
        //socket.broadcast.emit('message', generateMessage('A new user has joined!'))  //This command allow us to send to ALL THE REST OF THE CLIENTS, except the current client, a message

        socket.broadcast.to(user.room).emit('message', generateMessage('Admin' , `${user.username} has joined!`))   //'socket.broadcast.to(room).emit'  -> this allow us to send a message to all the rest of the users of a SPECIFIC ROOM, except to the current user. Obvyously we need to provide the string of the room where we want to send the information
        
        io.to(user.room).emit('roomData', {    //We are sending to all the user to the room(including the current user) data about the room, specifically all the users in the associate room. 
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()  //We call callback without error in order to say that all is ok to the client
    })

    //We wait that the client sends a message with the event 'sendMessage', in order to trigger the function down below
    socket.on('sendMessage', async (message, callback) => {
        const user = getUser(socket.id)   //We are looking for the user, in order to know what room he is
        const filter = new Filter()   //We are creating an object to see if the message contains profanity

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')   //We are checking if the message contains bad words. Then we call the acknowledgement function in order to alert to the client that the message contained bad words. Besides we add a return statement, because we don't want to send the message to all the users
        }

        //io.emit('message', generateMessage(message))   //We are sending to ALL the clients the message that was received
      
        //AQUI ES DONDE DEBES GUARDAR LOS MENSAJES-------------------------HOLAAAA
        const messageToStore = new Message({ text: message })
        try {
            await messageToStore.save()
        } catch (e) {
            console.log('There was an error storing the message in the db')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))  // 'io.to().emit'  -> That allow us to send a message to all the users(include the current user) of a SPECIFIC room
        callback()   //We are running the acknowledgement function provided by the client, in order to know that we received the data, and we delivered the data.
    })

    //We wait that the client sends the location of the current user in an object
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username ,`https://google.com/maps?q=${location.latitude},${location.longitude}`))  //Then we send the location to all users through a function that return a object with the url and timestamp
        callback()
    })

    //Wa wait that a user disconnect of the chat.
    socket.on('disconnect', () => {

        const user = removeUser(socket.id)  

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))  //Then we send the message to everybody in the specific room because, the current user is not connected anymore(doesn't make any sense use broadcast() because the user has left)
            
            io.to(user.room).emit('roomData', {     //We are updating the users in the current room. Because the current user has left.
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

    // socket.emit('CountUpdated', count)  //We are sending to a ONE SPECIFIC client which just connected the count with the event 'CountUpdated'. Then the client could use the variable count

    // //We wait the client call the event 'increment' to we increment the variable count from the server
    // socket.on('increment', () => {
    //     count++
    //     //socket.emit('CountUpdated', count)  //Then we send to the client the new count with the event 'CountUpdated'. THAT LINE ONLY SEND THE INFORMATION TO ONE SPECIFIC CLIENT, NO TO EVERY CLIENTS
    //     io.emit('CountUpdated', count)  //We send to ALL the clients connected the count variable.

    // })

})


//Look that we are using 'server' an not 'app'
server.listen(port, () => {
    console.log('Server is up on port ' + port)
})
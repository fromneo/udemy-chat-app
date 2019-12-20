const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
// create a server; socket.io expects the raw server to be passed in
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// let count = 0

// socket is an object that contains information about the new connection
// we can use 'socket' to communicate with the new client
// this code runs one time for each new connection
io.on('connection', (socket) => {
  console.log('New WebSocket connection')

  // options is an object of username and room
  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options })

    if (error) {
      return callback(error)
    }

    // allows us to join an individual chatroom
    // it allows you to emit events to just one room
    socket.join(user.room)

    // send this only when a user joins to a room
    socket.emit('message', generateMessage('Admin', 'Welcome!'))

    // broadcast sends it to all except the emitting socket
    // use .to to send it to a specific room
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  // check for profanity and callback with an error message
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)
    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed!')
    }

    io.to(user.room).emit('message', generateMessage(user.username, message))
    callback()
  })

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    callback()
  })

  // we are sending and receiving events but the client also has to accept it
  // anything passed as arguments after the event name is available from the callback function on the function
  // socket.emit('countUpdated', count)

  // socket.on('increment', () => {
  //   count++
  //   // socket only emits to one client; use io to send it to all clients
  //   // socket.emit('countUpdated', count)
  //   io.emit('countUpdated', count)
  // })

  // disconnect event
  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(port, () => {
  console.log(`Server is up on port ${port}`)
})
const users = []

// add user
const addUser = ({ id, username, room }) => {
  // clean the data
  username = username.trim().toLowerCase()
  room = room.trim().toLowerCase()

  // validate the data
  if (!username || !room) {
    return {
      error: 'Username and room are required!'
    }
  }

  // check for existing user
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username
  })

  // validate username
  if (existingUser) {
    return {
      error: 'Username is in use!'
    }
  }

  // store user
  const user = { id, username, room }
  users.push(user)
  return { user }
}

// remove user
const removeUser = (id) => {
  // get back the position of the array item
  const index = users.findIndex((user) => user.id === id)

  // this means we found a match since it would not be 0
  if (index !== -1) {
    // removes the item at the index number and the number of items to remove
    // we use [0] to just remove a single item; you could also use filter
    // findindex is faster since it finds the first match
    return users.splice(index, 1)[0]
  }
}

// get user
const getUser = (id) => {
  return users.find((user) => user.id === id)
}

// get users in room
const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room)
}

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
}
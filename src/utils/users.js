const users = []

//We want to add a user to the array 'users'
const addUser = ({ id, username, room}) => {

    //Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    //Check for existing user
    const existingUser = users.find((user) => {                     //If we return true, then we will store the user to the 'existingUser'. If we don't find anything, then will be undefined
        return user.room === room && user.username === username      //We can have the same username, but in differents rooms
    })

    //Validate username
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    //Store user
    const user = { id, username, room}
    users.push(user)   //We are pushing the user to the array of users
    return { user }

}

//We want to remove one user from the array of users
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)  //findIndex() returns the position in the array when we return true inside of the function. So if doesn't find anything, will return -1, otherwise will return the position of the element(might be [0... infinity])

    if (index !== -1) {
        return users.splice(index, 1)[0]    //splice remove the element in te position indicated for the first argument(in this case index). The second argument is the number of elements that we want to remove, in this case only 1. Then splice returns an array with all the elements that removed, but we only remove 1 element, so we grab the position 0
    }

}

//We want to grab one user
const getUser = (id) => {

    return users.find((user) => user.id === id )

}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)   //Here we are storing in an array all the users where we return true. If we don't have any match, the array will be empty
}

const getEveryUser = () => {
    return users
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
    getEveryUser
}
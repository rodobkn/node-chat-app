const socket = io() //With this we set up the connection from the client (with WebSockets obviously). In the html file we needed to write a special script in order to load in a good way all the functions provided by socket.io

//We are storing the elements in constants, in order to have a more organized code
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')  //We are selecting the first input inside of the form with id=message-form
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates -> Here we are going to store the templates
const messageTemplate = document.querySelector('#message-template').innerHTML   //We need to put 'innerHTML' because this template cointains html inside of it
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})  //Qs() is something that we imported at the final of chat.html with <script>. Then we can grabb the query string with 'location.search'. Then with 'ignoreQueryPrefix' we get out the '?' of the string. Finally we store the key-values in a destructuring object(Obviously the keys that we grab are username and room respectively, otherwise doesn't work destructuring)

//We are setting the function that provides the automatic scrolls in the messages
const autoscroll = () => {

    //We are grabbing the last message, that means the new message
    const $newMessage = $messages.lastElementChild

    //Here we are grabbing the total height of the new message
    const newMessagesStyles = getComputedStyle($newMessage)           //With this we can grab all the styles of the new message
    const newMessageMargin = parseInt(newMessagesStyles.marginBottom) //We are storing the number of the propertir 'marginBottom' of the new message
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin  //Then we add the margin bottom to the height of the new message

    //Visbible height
    const visibleHeight = $messages.offsetHeight     //We are grabbing the visible height of the container that stored all the messages

    //Height of message container
    const containerHeight = $messages.scrollHeight    //We are grabbing all the height of the container that stored all the messages

    //How far of the top have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight    //The amount of distance between the top and the current position of the scroll bar + the size of the scroll bar(the size of the visible container)

    //If we are at the bottom of the chat, we will want to scroll down automatically. You need to be aware that we called this function after the new message, for this reason we subtracted the new message
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight        //Here we can set a greater value than the actual value is going to take the variable '$messages.scrollTop' 
    }
    //In other case, we don't scroll down, because the user maybe could be searching something in the chat.

}


//We wait that the server send a message through the event 'message'
socket.on('message', (msg) => {   //msg is an object that sent the backend, in order to use it
    console.log(msg)
    const html = Mustache.render(messageTemplate, {     //We are storing in a variable that we need to render the template with the dynamic varibales that we want to render each time
        username: msg.username,
        msg: msg.text,                                   //this contains the text of the message
        createdAt: moment(msg.createdAt).format('h:mm a')       //This contains the time of the message. We add some styling, because we receive a crude timestamp from the backend. You need to remember that 'moment()' was imported in the html file through a script in the final of the file
    })  
    $messages.insertAdjacentHTML('beforeend', html)  //We are inserting the visualitation stored in html just before to the end of the div defined in $messages(you can see that in the html file)
    autoscroll()  //We are calling the autoscroll function
})

//We wait that the server emit an event by name 'locationMessage' with a variable which cointains the link to the associate location
socket.on('locationMessage', (object) => {
    console.log(object)
    const html = Mustache.render(locationTemplate, {
        username: object.username,
        url: object.url,
        createdAt: moment(object.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {    //We are storing in a variable what we want to render. In this case is the name of the room an the current users in the room
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html   //Then we add the data inside of 'html' to render in the div with id=sidebar
})

//We add a listener to a form with id #message-form.
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()  //We prevent that the page update by itself

    //disable the button
    $messageFormButton.setAttribute('disabled', 'disabled') //The first argument is the attribute, the second is the value. So we are setting the value 'disabled' to the attribute 'disable'. Then we disable the button inmediately after the click event
    
    const message = e.target.elements.message.value  //With 'e' we acces to all the data of the form that was selected. Then with 'target.elements' we can acces to all the elements inside of the form by their names. So the name of the input is 'message', then we can to grab the 'value' of the input

    //We are sending the message of the current user to the server(always the data is in the middle of the arguments).
    socket.emit('sendMessage', message, (error) => {     //The last parameter is always a acknowledgement function which will be run after that the backend did its work. This function runs in the client, but is called in the server. IT IS IMPORTANT THAT THE ACKNOWLEDGEMENT FUNCTION ONLY RUNS IN THE CLIENT OF THE USER THAT SEND THE MESSAGE.
        
        //Enable the button again
        $messageFormButton.removeAttribute('disabled')  //We are removing the attribute 'disable' with its value obviously. Then we are enabling the button again, because we already received the data from the backend
        $messageFormInput.value = ''   //We are cleaning the last input.value that typed the user
        $messageFormInput.focus()    //We are moving the cursos to the input, in order to provide a better expierence to the user

        //if there was a bad word in the message, we run this
        if (error) {
            return console.log(error)
        } 
        
        //In the succesfull case we run this
        console.log('Message delivered!')
    })  
})

//We are adding a event listener to a button with id=send-location
$locationButton.addEventListener('click', () => {

    //There is some browser that doesn't support 'navigator.geolocation'
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    $locationButton.setAttribute('disabled', 'disabled')  //We are disabling the location button while the data is fetching

    //In the argument 'position' we have the information about the latitude and longitude of the user
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {      //We are sending to the backend a object which contains the latitude and longitude of the location of the current user
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log("Location shared!")
            $locationButton.removeAttribute('disabled')  //We are enabling the location button after that we shared the location in the browser
        })  
    })

})

socket.emit('join', { username, room }, (error) => {         //We are sending to the backend an object through the even called 'join'.
    
    //only if we have an error (because sometimes in the backend we call the callback function without parameters). For example when a user take the same username that another user
    if (error) {
        alert(error)
        location.href = '/'   //That is for rederecting to the home page.
    }
})  








// //I am waiting the trigger from the server, when it call the event 'CountUpdated' with a parameter which store the count
// socket.on('CountUpdated', (count) => {
//     console.log('The count has been updated!', count)
// })

// //We are adding an event when the button with id=increment being clicked
// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked')
//     socket.emit('increment')  //We are sending to the server the event 'increment'. Then the server add 1 to the count
// })

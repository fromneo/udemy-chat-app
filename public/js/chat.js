// socket is already available on the server
// the client also has access to it
const socket = io()

// Elements
// the $ is just a convention
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// Templates
// use innerHTML to render the HTML correctly
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoscroll = () => {
  //new message element
  const $newMessage = $messages.lastElementChild

  // height of new message
  // use this to get the margin height
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)

  // you want to offset but this doesn't account for the margin bottom
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // visible height; what is visible and if you have too much content, some would be hidden by scroll
  // this is also the height of the scroll bar
  const visibleHeight = $messages.offsetHeight

  // Height of messages container; the total height of eveything you can scroll
  const containerHeight = $messages.scrollHeight

  // how far have I scrolled
  // scrolltop gives you the distance from the start of the content to the top of the scroll bar
  // the lower you are the larger the number; there isn't scroll bottom
  // so we have to add the visible height to know how far to the bottom we are
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    // this scrolls you to the bottom if you are at the bottom of the page
    $messages.scrollTop = $messages.scrollHeight
  }
}
// event names must match
// socket.on('countUpdated', (count) => {
//   console.log('The count has been updated', count)
// })

// document.querySelector('#increment').addEventListener('click', () => {
//   socket.emit('increment')
// })
socket.on('message', (message) => {
  console.log(message)

  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('locationMessage', (message) => {
  console.log(message)
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:m a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
  // prevent a full page refresh
  e.preventDefault()

  // disable form
  $messageFormButton.setAttribute('disabled', 'disabled')
  // const message = document.querySelector('input').value

  // less likely to break when the HTML changes
  // this is because e has target which represents the target which we are listening on
  // in this case, the target is the form
  const message = e.target.elements.message.value

  // the callback returns an error from the client after it has processed the message
  socket.emit('sendMessage', message, (error) => {

    // enable form
    // renable it when regardless of whether the message was sent
    $messageFormButton.removeAttribute('disabled')

    // clear the input and focus the input
    $messageFormInput.value = ''
    $messageFormInput.focus()

    if (error) {
      return console.log(error)
    }

    console.log('The message was delivered.')
  })
})

$sendLocationButton.addEventListener('click', () => {
  // not all browsers support this
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.')
  }

  $sendLocationButton.setAttribute('disabled', 'disabled')

  // it does not support promises yet
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => {
      $sendLocationButton.removeAttribute('disabled')

      console.log('Location shared!')
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})
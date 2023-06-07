
let socket = io();
const startingSection = document.querySelector('.starting-section');

const homeBtn = document.querySelector('.home-btn');

let crazyButton = document.getElementById('crazyButton');

io.on('connection', (socket) => {
    console.log('A user just connected.');
    socket.on('disconnect', () => {
        console.log('A user has disconnected.');
    })
});


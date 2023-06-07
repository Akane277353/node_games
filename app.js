
var express = require("express")
var app = express()
var serv = require("http").Server(app)

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html")
})

app.use("/client", express.static(__dirname + "/public"))

serv.listen(2000)

var io = require("socket.io")(serv, {})

var S_LIST = {}
var P_LIST = {}

var Player = function(id) {
    var self = {
        x:250,
        y:250,
        id:id,
        pressingRight:false,
        pressingLeft:false,
        pressingUp:false,
        pressingDown:false,
        maxspeed:10,
        name: ""+Math.floor(10*Math.random())
    }

    self.updatePosition = function() {
        if (self.pressingRight) { self.x += self.maxspeed }
        if (self.pressingLeft) { self.x -= self.maxspeed }
        if (self.pressingUp) { self.y -= self.maxspeed }
        if (self.pressingDown) { self.y += self.maxspeed }
    }

    return self
}

io.sockets.on("connection", function(socket){
    socket.id = Math.random()
    S_LIST[socket.id] = socket
    
    var player = Player(socket.id)
    P_LIST[socket.id] = player

    socket.on("keyPress", function(data){
        if (data.inputId === "left")
            player.pressingLeft = data.state
        if (data.inputId === "right")
            player.pressingRight = data.state
        if (data.inputId === "up")
            player.pressingUp = data.state
        if (data.inputId === "down")
            player.pressingDown = data.state
    })

    socket.on("disconnect", function(){
        delete S_LIST[socket.id]
        delete P_LIST[socket.id]
    })
})


setInterval(function(){
    var others = []
    for(var i in P_LIST) {
        var player = P_LIST[i]
        player.updatePosition()
        others.push({x:player.x, y:player.y, name:player.name})
    }

    for(var i in S_LIST) {
        var socket = S_LIST[i]
        socket.emit("newPosition", others)
    }
    
}, 1000/60)


var express = require("express")
var app = express()
var serv = require("http").Server(app)

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html")
})

app.use("/client", express.static(__dirname + "/public"))

serv.listen(2000)



var S_LIST = {}

var Entity = function() {
    var self = {
        x:250,
        y:250,
        speedx:0,
        speedy:0,
        id: ""
    }

    self.update = function() {
        self.updatePosition()
    }

    self.updatePosition = function() {
        self.x += self.speedx
        self.y += self.speedy
    }
    
    return self
}

var Player = function(id) {
    var self = Entity()
    self.id = id
    self.pressingRight = false
    self.pressingLeft = false
    self.pressingUp = false
    self.pressingDown = false
    self.maxspeed = 10
    self.name = "" + Math.floor(10 * Math.random())

    var super_update = self.update
    self.update = function() {
        self.updateSpeed()
        super_update( )
    }

    self.updateSpeed = function() {
        if (self.pressingRight) { self.speedx = self.maxspeed }
        else if (self.pressingLeft) { self.speedx = -self.maxspeed }
        else { self.speedx = 0 }
        
        if (self.pressingUp) { self.speedy = -self.maxspeed }
        else if (self.pressingDown) { self.speedy = self.maxspeed }
        else { self.speedy = 0 }
    }

    Player.list[id] = self
    return self
}



Player.list = {}

Player.onConnect = function(socket) {

    var player = Player(socket.id)

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
}

Player.onDisconnect = function(socket) {
    delete Player.list[socket.id]
}

Player.update = function() {
    var others = []
    for(var i in Player.list) {
        var player = Player.list[i]
        player.update()
        others.push({x:player.x, y:player.y, name:player.name})
    }
    return others
}


var Bullet = function(angle) {
    var self = Entity()
    self.id = Math.random()
    self.speedx = Math.cos(angle / 180 * Math.PI) * 10
    self.speedy = Math.sin(angle / 180 * Math.PI) * 10

    self.timer = 0
    self.toRemove = false

    var super_update = self.update
    self.update = function() {
        if (self.timer++ > 10) { self.toRemove = true }
        super_update( )
    }

    Bullet.list[self.id] = self
    return self
}

Bullet.list = {}


Bullet.update = function() {
    if (Math.random() < 0.1) {
        Bullet(Math.random() * 360)
    }

    var others = []
    for(var i in Bullet.list) {
        var bullet = Bullet.list[i]
        bullet.update()
        others.push({x:bullet.x, y:bullet.y})
    }
    return others
}

var io = require("socket.io")(serv, {})
io.sockets.on("connection", function(socket){
    socket.id = Math.random()
    S_LIST[socket.id] = socket
    
    Player.onConnect(socket)

    socket.on("disconnect", function(){
        delete S_LIST[socket.id]
        Player.onDisconnect(socket)
    })

    socket.on("sendMsg", function(data) {
        var playername = (""+Math.random()).slice(2, 7)
        for(var i in S_LIST) {
            var socket = S_LIST[i]
            socket.emit("addMsg", playername + " : " + data)
        }
    })

    socket.on("evalServ", function(data) {
        var res = eval(data)
        socket.emit("evalAnswer", res)
    })

})

setInterval(function(){
    var data = {
        player: Player.update(),
        bullet: Bullet.update()
    }

    for(var i in S_LIST) {
        var socket = S_LIST[i]
        socket.emit("newPosition", data)
    }
    
}, 1000/60)

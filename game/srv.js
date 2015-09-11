'use strict';

var io = require('sandbox-io');

var firstPlayer = null;
var games = {};
var records = db('records') || {};

function Game(player1, player2) {
    this.id = 'game' + Math.random();
    games[this.id] = this;
    this.players = [player1, player2];
    log('Start game', { id:this.id, players:this.players });
    player1.joinGame(this);
    player1.emitReady({
        id: this.id,
        teamNumber: 1,
        playAgainstAI: false
    });
    player2.joinGame(this);
    player2.emitReady({
        id: this.id,
        teamNumber: 0,
        playAgainstAI: false
    });

    this.player1Step = null;
    this.player2Step = null;

    this.player1Sync = null;
    this.player2Sync = null;
}

Game.prototype.step = function(player, data) {
    if (player == this.players[0]){
        this.player1Step = data;
    } else {
        this.player2Step = data;
    }
    // TODO: only wait for a second or two to get the second input
    if (this.player1Step && this.player2Step){
        this.players[0].respond(this.player1Step, this.player2Step);
        this.players[1].respond(this.player2Step, this.player1Step);
        this.player1Step = null;
        this.player2Step = null;
    }
}

Game.prototype.sync = function(player, data) {
    if (player == this.players[0]){
        this.player1Sync = data;
    } else {
        this.player2Sync = data;
    }
    // TODO: only wait for a second or two to get the second input
    if (this.player1Sync && this.player2Sync){
        this.players[0].sync(this.player1Sync, this.player2Sync);
        this.players[1].sync(this.player2Sync, this.player1Sync);
        this.player1Sync = null;
        this.player2Sync = null;
    }
}

Game.prototype.end = function() {
    log('End game', { id:this.id, players:this.players });
    this.players[0].exit();
    this.players[1].exit();
    delete games[this.id];
};





function Player(socket) {
    this.socket = socket;
    this.team = {};
    socket.on('disconnect', this.onExit.bind(this));
    socket.on("clientsync", this.onClientSync.bind(this));
    socket.on("step", this.onStep.bind(this));
    socket.on("quit", this.onExit.bind(this));
}

Player.prototype.onStep = function(data) {
    this.game.step(this, data.a);
};

Player.prototype.respond = function(mine, theirs) {
    socket.emit("response", {a: mine, b: theirs})
};

Player.prototype.onClientSync = function(data) {
    this.game.sync(this, data.a);
};

Player.prototype.sync = function(mine, theirs) {
    socket.emit("sync", {a: mine, b: theirs})
};

Player.prototype.joinGame = function(game) {
    this.game = game;
    this.socket.join(game.id);
};

Player.prototype.onExit = function() {
    if (this==firstPlayer) firstPlayer = null;
    if (!this.game) return;
    this.game.end('A Player left the game');
};

Player.prototype.exit = function(msg) {
    if (!this.game) return;
    this.socket.emit('gameover', msg);
    this.socket.disconnect();
    this.game = null;
};

Player.prototype.emitReady = function(data){
    this.socket.emit("ready", data);
}



io.on('connection', function(socket) {
    log("Connection happend, yay!");
    var newPlayer = new Player(socket);
    if (!firstPlayer){
        log("First player")
        firstPlayer = newPlayer;
    } else {
        log("Second player")
        var a = firstPlayer;
        var b = newPlayer;
        firstPlayer = null;
        setTimeout(function(){new Game(a, b)}, 500);
    }
});


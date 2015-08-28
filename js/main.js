var canvas = null;
var ctx = null;
var canW = 800;
var canH = 450;
var mouse = {x: 0, y: 0};
var lastKeyState = {up: 0, down: 0, left: 0, right: 0, space: 0};
var keyState = {up: 0, down: 0, left: 0, right: 0, space: 0};
window.onload = function () {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    canvas.onmousemove = function (event) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    };
    document.addEventListener('keydown', function (event) {
        var k = event.keyCode;
        if (k == 38 || k == 87){
            keyState.up = 1;
        } else if (k == 39 || k == 68){
            keyState.right = 1;
        } else if (k == 37 || k == 65){
            keyState.left = 1;
        } else if (k == 40 || k == 83){
            keyState.down = 1;
        }
    });
    document.addEventListener('keyup', function(event) {
        var k = event.keyCode;
        if (k == 38 || k == 87){
            keyState.up = 0;
        } else if (k == 39 || k == 68){
            keyState.right = 0;
        } else if (k == 37 || k == 65){
            keyState.left = 0;
        } else if (k == 40 || k == 83){
            keyState.down = 0;
        }
    });
    function updateKeyState(){
        lastKeyState.up = keyState.up;
        lastKeyState.right = keyState.right;
        lastKeyState.left = keyState.left;
        lastKeyState.down = keyState.down;
    };

    var neutralZones = [];
    neutralZones.push(new NeutralZone());
    neutralZones.push(new Flag(0));
    neutralZones.push(new Flag(1));
    var team0 = [];
    team0.push(new Player(50, 50, 0, 1));
    team0[0].update = function(){
        this.x = mouse.x;
        this.y = mouse.y;
    };
    var team1 = [];
    team1.push(new Player(100, 100, 1, 1));
    team1[0].update = function(){
        this.x += (keyState.left ? -10 : (keyState.right ? 10 : 0));
        this.y += (keyState.up ? -10 : (keyState.down ? 10 : 0));
    }
    var updatables = [];
    team0.forEach(function(obj){updatables.push(obj);});
    team1.forEach(function(obj){updatables.push(obj);});
    var drawables = [];
    neutralZones.forEach(function(obj){drawables.push(obj);});
    updatables.forEach(function(obj){drawables.push(obj);});

    setInterval(function(){
        ctx.fillStyle = "#33CC33";
        ctx.fillRect(0, 0, canW, canH);

        updatables.forEach(function(obj){if (obj.update){obj.update();}});

        drawables.forEach(function(obj){obj.draw();});

        if (keyState.space && !lastKeyState.space){
            team0.forEach(function(a){
                team1.forEach(function(b){
                    if (a.contains(b)){
                        console.log(a + " contains " + b);
                    }
                })
            });
        }
        updateKeyState();
    }, 1000 / 30);
};

function dst(x1, y1, x2, y2){
    return Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1) * (y2 - y1));
}

function diff(x1, y1, x2, y2){
    return {x: x1 - x2, y: y1 - y2};
}

//function norm(x, y){
//    var len = dst(0, 0, x, y);
//    return (len > 0 ? {x: x / len, y: y / len} : {x:0, y:0});
//}

function Player(x, y, team, number){
    this.x = x || 0;
    this.y = y || 0;
    this.isOut = 0;
    this.path = [];
    this.maxPathDist = canW * 0.1;
    this.maxPathLen = 2;
    this.r = canW * 0.025;
    this.team = team;
    this.number = number;
    this.col = (team ? "#3399FF" : "#FF5050");
    this.outln = (team ? "#0033CC" : "#CC0000");
    this.draw = function(){
        ctx.fillStyle = this.col;
        ctx.strokeStyle = this.outln;
        ctx.lineWidth = 5;
        ctx.setLineDash([1, 0]);
        ctx.beginPath();
        ctx.arc(this.x, this.y,this.r,0,2*Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    this.targetDiff = {x: 0, y: 0};
    this.startingPoint = {x: 0, y: 0};
    this.calcNextMove = function(){
        if (this.path.length > 0){
            this.startingPoint = {x: this.x, y: this.y};
            this.targetDiff = diff(this.path[0].x, this.path[0].y, this.x, this.y);
        }
    }
    this.moveToTarget = function(percentThere){
        this.x = this.startingPoint.x + this.targetDiff.x * percentThere;
        this.y = this.startingPoint.y + this.targetDiff.y * percentThere;
    };
    this.contains = function(player){
        if (player.team == this.team){
            return false;
        } else {
            var d = dst(player.x, player.y, this.x, this.y);
            return (d < (this.r + player.r));
        }
    };
    this.toString = function(){
        return "[" + this.team + ":" + this.number + "]"
    };
}

function NeutralZone(){
    this.percentW = canW * 0.05;
    this.center = canW / 2;
    this.left = this.center - this.percentW;
    this.right = this.center + this.percentW;
    this.draw = function(){
        ctx.lineWidth = 0;
        ctx.fillStyle = "#999999";
        ctx.fillRect(this.left, 0, this.percentW * 2, canH);

        ctx.lineWidth = 5;
        ctx.strokeStyle = "#666666";
        ctx.setLineDash([10,5]);

        ctx.beginPath();
        ctx.moveTo(this.left, 0);
        ctx.lineTo(this.left, canH);
        ctx.moveTo(this.right, 0);
        ctx.lineTo(this.right, canH);
        ctx.stroke();
        ctx.closePath();
    }

    this.contains = function(player){
        return (player.x > this.left && player.x < this.right);
    }
}

function Flag(team){
    this.x = (team ? canW * 0.05 : canW * 0.95);
    this.y = canH / 2;
    this.carried = 0;
    this.r  = canW * 0.07;
    this.team = team;
    this.flagSize = canW * 0.01;
    this.flagCol = (team ? "#3399FF" : "#FF5050");
    this.flagOutln = (team ? "#0033CC" : "#CC0000");
    this.col = "#999999";
    this.outln = "#666666";
    this.draw = function(){
        if (!this.carried) {
            ctx.fillStyle = this.col;
            ctx.strokeStyle = this.outln;
            ctx.lineWidth = 5;
            ctx.setLineDash([10, 7]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        }

        ctx.fillStyle = this.flagOutln;
        ctx.strokeStyle = this.flagCol;
        ctx.lineWidth = 1;
        ctx.setLineDash([1, 0]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.flagSize, this.y - this.flagSize);
        ctx.lineTo(this.x + this.flagSize, this.y - this.flagSize);
        ctx.lineTo(this.x, this.y);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    this.contains = function(player){
        if (this.carried || this.team == player.team){
            return false;
        } else {
            var d = dst(player.x, player.y, this.x, this.y);
            return (d < this.r);
        }
    }
}
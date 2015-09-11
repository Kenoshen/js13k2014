var canvas = null;
var ctx = null;
var canX = 0;
var canY = 0;
var canW = 800;
var canH = 450;

var mouseState = {x: 0, y: 0, down: false};
var lastMouseState = {x: 0, y: 0, down: false};
var lastKeyState = {up: 0, down: 0, left: 0, right: 0, space: 0};
var keyState = {up: 0, down: 0, left: 0, right: 0, space: 0};

var WAIT_FOR_SERVER = "waitforserver";
var SETUP = "setup";
var NEW_TURN = "newturn";
var PICK_PLAYER = "pickplayer";
var SELECT_PATH = "selectpath";
var ADD_PATH = "addpath";
var SEND_DATA_TO_SERVER = "senddatatoserver";
var MOVE_PLAYERS = "moveplayers";
var TEAM_0_WIN = "team0win";
var TEAM_1_WIN = "team1win";
var team0Score = 0;
var team1Score = 0;
var myTeamNumber = 0;
var playAgainstAI = false;
window.onload = function () {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    function getOffset( el ) {
        var _x = 0;
        var _y = 0;
        while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
            _x += el.offsetLeft - el.scrollLeft;
            _y += el.offsetTop - el.scrollTop;
            el = el.offsetParent;
        }
        return { top: _y, left: _x };
    }
    var offset = getOffset(canvas);
    canX = offset.left;
    canY = offset.top;
    canvas.onmousemove = function (event) {
        mouseState.x = event.clientX - canX;
        mouseState.y = event.clientY - canY;
    };
    canvas.onmousedown = function (event) {
        mouseState.down = true;
    };
    canvas.onmouseup = function (event) {
        mouseState.down = false;
    };
    //document.addEventListener('keydown', function (event) {
    //    //console.log(event.keyCode);
    //    var k = event.keyCode;
    //    if (k == 38 || k == 87){
    //        keyState.up = 1;
    //    } else if (k == 39 || k == 68){
    //        keyState.right = 1;
    //    } else if (k == 37 || k == 65){
    //        keyState.left = 1;
    //    } else if (k == 40 || k == 83){
    //        keyState.down = 1;
    //    } else if (k == 32){
    //        keyState.space = 1;
    //    }
    //});
    //document.addEventListener('keyup', function(event) {
    //    var k = event.keyCode;
    //    if (k == 38 || k == 87){
    //        keyState.up = 0;
    //    } else if (k == 39 || k == 68){
    //        keyState.right = 0;
    //    } else if (k == 37 || k == 65){
    //        keyState.left = 0;
    //    } else if (k == 40 || k == 83){
    //        keyState.down = 0;
    //    } else if (k == 32){
    //        keyState.space = 0;
    //    }
    //});
    document.getElementById("0").innerHTML = team0Score;
    document.getElementById("1").innerHTML = team1Score;
    function updateInputState(){
        lastMouseState.x = mouseState.x;
        lastMouseState.y = mouseState.y;
        lastMouseState.down =  mouseState.down;

        lastKeyState.up = keyState.up;
        lastKeyState.right = keyState.right;
        lastKeyState.left = keyState.left;
        lastKeyState.down = keyState.down;
        lastKeyState.space = keyState.space;
    };

    var neutralZones = null;
    var team0 = null;
    var team1 = null;
    var flagTeam0 = null;
    var flagTeam1 = null;
    var myTeam = null;
    var otherTeam = null;
    var myTeamAI = null;
    var otherTeamAI = null;
    var updatables = [];
    var drawables = [];
    var pathObjs = [];

    var selectedPlayer = null;
    var curPathNode = null;

    var gameState = null;
    var server = new Server();

    var timer = {totalTime: 3000};

    function changeGameState(state){
        console.log("New Game State: " + state);
        gameState = state;
        if (gameState == SETUP){
            neutralZones = [];
            neutralZones.push(new NeutralZone());
            flagTeam0 = new Flag(0);
            neutralZones.push(flagTeam0);
            flagTeam1 = new Flag(1);
            neutralZones.push(flagTeam1);

            team0 = [];
            team0.teamNumber = 0;
            team0.flag = flagTeam0;
            team0.score = 0;
            var r = canW - canW * 0.3;
            var t = canH * 0.3;
            var m = canH * 0.5;
            var b = canH * 0.7;
            team0.push(new Player(r, t, 0, 1));
            team0.push(new Player(r, m, 0, 2));
            team0.push(new Player(r, b, 0, 3));
            team1 = [];
            team1.teamNumber = 1;
            team1.flag = flagTeam1;
            team1.score = 0;
            var l = canW * 0.3;
            team1.push(new Player(l, t, 1, 1));
            team1.push(new Player(l, m, 1, 2));
            team1.push(new Player(l, b, 1, 3));

            if (myTeamNumber) {
                myTeam = team1;
                otherTeam = team0;
            } else {
                myTeam = team0;
                otherTeam = team1;
            }

            //myTeamAI = new AI(myTeam, otherTeam, [
            //    neutralZones[0],
            //    neutralZones[2]
            //]);
            if (playAgainstAI) {
                otherTeamAI = new AI(otherTeam, myTeam, [
                    neutralZones[0],
                    neutralZones[1]
                ]);
            }

            updatables = [];
            updatables.push(flagTeam0);
            updatables.push(flagTeam1);
            team0.forEach(function(obj){updatables.push(obj);});
            team1.forEach(function(obj){updatables.push(obj);});

            drawables = [];
            neutralZones.forEach(function(obj){drawables.push(obj);});
            updatables.forEach(function(obj){drawables.push(obj);});

            pathObjs = [];

            changeGameState(NEW_TURN);

        } else if (gameState == NEW_TURN){
            timer.startTime = new Date().getTime();
            timer.timer = setTimeout(function(){
                //changeGameState(SEND_DATA_TO_SERVER); // this doesn't work because of concurrency
                keyState.space = 1;
                lastKeyState.space = 0;
                if (timer.element){
                    timer.element.style.visibility = "hidden";
                }
            }, timer.totalTime);
            timer.element = document.getElementById("timer");
            if (timer.element){
                timer.element.style.visibility = "visible";
            }
            timer.update = function(){
                if (timer.element) {
                    var d = timer.diff();
                    var sec = Math.floor(((timer.totalTime / 1000) + 1) - d / 1000)
                    timer.element.innerHTML = (sec + "");
                }
            }
            timer.diff = function(){
                return new Date().getTime() - timer.startTime;
            }

            var resetPlayer = function(player){
                player.pathLen = 0;
            }
            team0.forEach(resetPlayer);
            team1.forEach(resetPlayer);
            if (myTeamAI && otherTeamAI){
                changeGameState(SEND_DATA_TO_SERVER);
            } else {
                changeGameState(PICK_PLAYER);
            }

        } else if (gameState == PICK_PLAYER){
            if (curPathNode){
                if (curPathNode.previousPathNode){
                    curPathNode.previousPathNode.nextPathNode = null;
                }
                curPathNode.destroy();
                curPathNode = null;
            }
            selectedPlayer = null;

        } else if (gameState == SELECT_PATH){
            if (curPathNode){
                // clean up the old path node (removes from updatables list)
                curPathNode.update = null;
            }
            if (selectedPlayer && selectedPlayer.pathLen < selectedPlayer.maxPathLen){
                // create path node
                var nextCurPathNode = new PathNode(0, 0, curPathNode, null, selectedPlayer.team);
                if (nextCurPathNode.previousPathNode == null){
                    nextCurPathNode.previousPathNode = selectedPlayer;
                } else {
                    nextCurPathNode.previousPathNode.nextPathNode = nextCurPathNode;
                }
                nextCurPathNode.update = function(){
                    // set path node's x,y to mouse, but limit to the player.maxPathDist prop
                    var d = diff(mouseState.x, mouseState.y, nextCurPathNode.previousPathNode.x, nextCurPathNode.previousPathNode.y);
                    if (dst(0, 0, d.x, d.y) > selectedPlayer.maxPathDist){
                        var dN = norm(d.x, d.y);
                        d.x = dN.x * selectedPlayer.maxPathDist;
                        d.y = dN.y * selectedPlayer.maxPathDist;
                    }
                    this.x = nextCurPathNode.previousPathNode.x + d.x;
                    this.y = nextCurPathNode.previousPathNode.y + d.y;

                    var self = this;
                    this.invalid = false;
                    neutralZones.forEach(function(n){
                        if (n.contains(self)){
                            self.invalid = true;
                        }
                    });
                };
                curPathNode = nextCurPathNode;
                // add curPathNode to updatables
                updatables.push(curPathNode);
                drawables.push(curPathNode);

                pathObjs.push(curPathNode);
            } else {
                curPathNode = null;
                changeGameState(PICK_PLAYER);
            }

        } else if (gameState == ADD_PATH){
            if (selectedPlayer){
                selectedPlayer.pathLen += 1;
                if (! selectedPlayer.tmpPath) {
                    selectedPlayer.tmpPath = curPathNode;
                }
            }
            changeGameState(SELECT_PATH);

        } else if (gameState == SEND_DATA_TO_SERVER){
            changeGameState(PICK_PLAYER); // to reset and remove in-progress paths
            gameState = SEND_DATA_TO_SERVER; // then manually change back to send data
            // send data to server, set to MOVE_PLAYERS when it returns
            // parse data from server into players.tmpPath
            var tempArray = [];
            function handleTempPath(player) {
                var p = {num: player.number, team: player.team, path: []};
                var curPath = player.tmpPath;
                while (curPath) {
                    p.path.push({x: curPath.x, y: curPath.y});
                    curPath = curPath.nextPathNode;
                }
                tempArray.push(p);
            }
            var myTeamPath = null;
            if (!myTeamAI) {
                tempArray = [];
                myTeam.forEach(handleTempPath);
                myTeamPath = tempArray;
            } else {
                myTeamPath = myTeamAI.getMoves();
            }

            var otherTeamPath = null;
            if (!otherTeamAI){
                tempArray = [];
                otherTeam.forEach(handleTempPath);
                otherTeamPath = tempArray;
            } else {
                otherTeamPath = otherTeamAI.getMoves();
            }
            server.send(myTeamPath, otherTeamPath, function(data){
                var parse = function(playerData, team, teamNumber){
                    var path = [];
                    playerData.path.forEach(function(p){
                        path.push(new PathNode(p.x, p.y, null, null, teamNumber));
                    });
                    for (var i = 0; i < path.length; i += 1){
                        path[i].previousPathNode = (i - 1 >= 0 ? path[i - 1] : null);
                        path[i].nextPathNode = (i + 1 < path.length ? path[i + 1] : null);
                    }
                    team.forEach(function(player){
                        if (player.number === playerData.num && !player.isOut){
                            var recPathDestroy = function(subPath){
                                if (subPath && subPath.destroy && ! subPath.shouldBeDeleted){
                                    subPath.shouldBeDeleted = true;
                                    recPathDestroy(subPath.previousPathNode);
                                    recPathDestroy(subPath.nextPathNode);
                                    subPath.destroy();
                                }
                            }
                            recPathDestroy(player.tmpPath);

                            player.tmpPath = path[0];
                            if (player.tmpPath){
                                player.tmpPath.previousPathNode = player;
                                path.forEach(function(pathNodeFromList){
                                    drawables.push(pathNodeFromList);
                                    pathObjs.push(pathNodeFromList);
                                });
                            }
                        }
                    })
                }
                data.a.forEach(function(playerData){
                    parse(playerData, myTeam, myTeam.teamNumber);
                });
                data.b.forEach(function(playerData){
                    parse(playerData, otherTeam, otherTeam.teamNumber);
                });
                changeGameState(MOVE_PLAYERS);
            });

        } else if (gameState == MOVE_PLAYERS){
            var move = function(player){
                player.path = player.tmpPath;
                player.tmpPath = null;
            }
            team0.forEach(move);
            team1.forEach(move);
        } else if (gameState == TEAM_0_WIN){
            server.roundOver();
            team0Score += 1;
            document.getElementById("0").innerHTML = "" + team0Score;
            document.getElementById("msg").innerHTML = "Red Team Scored!";
            setTimeout(function(){
                document.getElementById("msg").innerHTML = "";
                changeGameState(SETUP);
            }, 3000);
        } else if (gameState == TEAM_1_WIN){
            server.roundOver();
            team1Score += 1;
            document.getElementById("1").innerHTML = "" + team1Score;
            document.getElementById("msg").innerHTML = "Blue Team Scored!";
            setTimeout(function(){
                document.getElementById("msg").innerHTML = "";
                changeGameState(SETUP);
            }, 3000);
        }
    }

    changeGameState(WAIT_FOR_SERVER);
    server.joinGameOrCreateGame(function(){
        changeGameState(SETUP);
    });

    setInterval(function(){
        ctx.fillStyle = "#33CC33";
        ctx.fillRect(0, 0, canW, canH);
        if (gameState == WAIT_FOR_SERVER){
            return;
        }

        updatables.forEach(function(obj){if (obj.update){obj.update();}});
        drawables.forEach(function(obj){if (obj.draw){obj.draw();}});
        flagTeam0.drawTop();
        flagTeam1.drawTop();

        timer.update();

        if (gameState == PICK_PLAYER && mouseState.down && ! lastMouseState.down) {
            selectedPlayer = null;
            myTeam.some(function (player) {
                if (player.contains(mouseState) && ! player.isOut){
                    selectedPlayer = player;
                    changeGameState(SELECT_PATH);
                    return true;
                }
            });

        } else if ((gameState == PICK_PLAYER || gameState == SELECT_PATH) && keyState.space && ! lastKeyState.space){
            changeGameState(SEND_DATA_TO_SERVER);
        } else if (gameState == SELECT_PATH && mouseState.down && ! lastMouseState.down && ! curPathNode.invalid){
            changeGameState(ADD_PATH);
        } else if (gameState == MOVE_PLAYERS){
            var reset = function(player){
                player.inNeutralZone = false;
            }
            team0.forEach(reset);
            team1.forEach(reset);
            neutralZones.forEach(function(n){
                var inN = function(player){
                    if (n.contains(player)){
                        player.inNeutralZone = true;
                    }
                }
                team0.forEach(inN);
                team1.forEach(inN);
            });
            team0.forEach(function(a){
                if (!a.inNeutralZone) {
                    team1.forEach(function (b) {
                        if (!b.inNeutralZone && a.contains(b)) {
                            if (a.x < canW / 2) {
                                a.tagYouAreOut();
                            } else {
                                b.tagYouAreOut();
                            }
                        }
                    });
                }
            });
            var allTeam0IsOut = true;
            team0.forEach(function(player){
                if (!player.isOut){
                    allTeam0IsOut = false;
                }
                if (!flagTeam1.carried && player.contains({x:flagTeam1.x, y:flagTeam1.y})){
                    flagTeam1.carried = player;
                    player.carryingFlag = true;
                }
            });
            var allTeam1IsOut = true;
            team1.forEach(function(player){
                if (!player.isOut){
                    allTeam1IsOut = false;
                }
                if (!flagTeam0.carried && player.contains({x:flagTeam0.x, y:flagTeam0.y})){
                    flagTeam0.carried = player;
                    player.carryingFlag = true;
                }
            });

            if (pathObjs && pathObjs.length == 0) {
                changeGameState(NEW_TURN);
            } else if (flagTeam0.x < canW / 2 || allTeam0IsOut){
                changeGameState(TEAM_1_WIN);
            } else if (flagTeam1.x > canW / 2 || allTeam1IsOut){
                changeGameState(TEAM_0_WIN);
            }
        }

        // remove dead objects
        removeDeadObjs(updatables, "update", false);
        removeDeadObjs(updatables, "shouldBeDeleted", true);
        removeDeadObjs(drawables, "shouldBeDeleted", true);
        removeDeadObjs(pathObjs, "shouldBeDeleted", true);

        //console.log("U: " + updatables.length, "D: " + drawables.length, "P: " + pathObjs.length);

        updateInputState();
    }, 1000 / 30);
};

function dst(x1, y1, x2, y2){
    return Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1) * (y2 - y1));
}

function diff(x1, y1, x2, y2){
    return {x: x1 - x2, y: y1 - y2};
}

function norm(x, y){
    var len = dst(0, 0, x, y);
    return (len > 0 ? {x: x / len, y: y / len} : {x:0, y:0});
}

function removeDeadObjs(list, key, condition){
    for (var i = 0; i < list.length; i++){
        if (list[i][key] == condition){
            list.splice(i, 1);
        }
    }
}

function Player(x, y, team, number){
    this.x = x || 0;
    this.y = y || 0;
    this.isOut = 0;
    this.path = null;
    this.tmpPath = null;
    this.carryingFlag = false;
    this.maxPathDist = canW * 0.1;
    this.maxPathLen = 2;
    this.pathLen = 0;
    this.r = canW * 0.025;
    this.speed = 3;
    this.team = team;
    this.number = number;
    this.col = (team ? "#3399FF" : "#FF5050");
    this.outln = (team ? "#0033CC" : "#CC0000");
    this.disabledCol = (team ? "#444499" : "#994444");
    this.draw = function(){
        ctx.fillStyle = (this.isOut ? this.disabledCol : this.col);
        ctx.strokeStyle = this.outln;
        ctx.lineWidth = 5;
        ctx.setLineDash([1, 0]);
        ctx.beginPath();
        ctx.arc(this.x, this.y,this.r,0,2*Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    this.update = function(){
        if (this.path && !this.isOut){
            var d = diff(this.path.x, this.path.y, this.x, this.y);
            var dLen = dst(0, 0, d.x, d.y);
            if (dLen < this.speed) {
                this.x = this.path.x;
                this.y = this.path.y;
                var p = this.path;
                this.path = p.nextPathNode;
                if (this.path) {
                    this.path.previousPathNode = this;
                }
                p.destroy();
            } else {
                var nD = norm(d.x, d.y);
                nD.x *= this.speed;
                nD.y *= this.speed;
                this.x += nD.x;
                this.y += nD.y;
            }
        }
    }
    this.tagYouAreOut = function(){
        this.isOut = true;
        this.carryingFlag = false;
        var recPathDestroy = function(path){
            if (path && path.destroy && ! path.shouldBeDeleted){
                path.shouldBeDeleted = true;
                recPathDestroy(path.previousPathNode);
                recPathDestroy(path.nextPathNode);
                path.destroy();
            }
        }
        recPathDestroy(this.path);
    }
    this.contains = function(player){
        if (player.team == this.team){
            return false;
        } else {
            var d = dst(player.x, player.y, this.x, this.y);
            if (player.r) {
                return (d < (this.r + player.r));
            } else {
                return (d < this.r);
            }
        }
    };
    this.toString = function(){
        return "[" + this.team + ":" + this.number + "]"
    };
}

function NeutralZone(){
    this.percentW = canW * 0.03;
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
        var b = (this.left < player.x && player.x < this.right);
        //if (b) console.log(this.left + " < " + player.x + " < " + this.right);
        return b;
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
    };
    this.drawTop = function(){
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
    };
    this.update = function(){
        if (this.carried && !this.carried.isOut){
            this.x = this.carried.x;
            this.y = this.carried.y;
        } else {
            this.carried = null;
        }
    };
    this.contains = function(player){
        if (this.carried){
            return false;
        } else if ((player.previousPathNode && this.team !== player.team) || (!player.previousPathNode && this.team === player.team)){
            return false;
        } else {
            var d = dst(player.x, player.y, this.x, this.y);
            return (d < this.r);
        }
    }
}

function PathNode(x, y, previousPathNode, nextPathNode, team){
    this.previousPathNode = previousPathNode
    this.nextPathNode = nextPathNode
    this.x = x;
    this.y = y;
    this.r  = canW * 0.01;
    this.team = team;
    this.col = "#777777";
    this.invalidColor = "#ff9999";
    this.invalid = false;
    this.shouldBeDeleted = false;
    this.draw = function(){
        if (this.invalid){
            ctx.fillStyle = this.invalidColor;
            ctx.strokeStyle = this.invalidColor;
            ctx.setLineDash([10, 7]);
        } else {
            ctx.fillStyle = this.col;
            ctx.strokeStyle = this.col;
            ctx.setLineDash([1, 0]);
        }
        ctx.lineWidth = 15;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        if (this.previousPathNode) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.previousPathNode.x, this.previousPathNode.y);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        }
    }
    this.contains = function(thing){
        return dst(this.x, this.y, thing.x, thing.y) < this.r;
    }
    this.destroy = function(){
        this.previousPathNode = null;
        this.nextPathNode = null;
        this.shouldBeDeleted = true;
    }
}

function AI(aiTeam, playerTeam, neutralZones){
    var self = this;
    this.team = aiTeam;
    this.others = playerTeam;
    this.neutralZones = neutralZones;
    this.state = {others:{}, desired:{}};

    function getNextAvailableAI(){
        for (var i = 0; i < self.team.length; i++){
            if (!self.team[i].aiRole && !self.team[i].isOut){
                return self.team[i]
            }
        }
    }

    function getEnemies(ai){
        var enemies = [];
        function compare(a, b){
            // do compare on distance to ai
            if (dst(ai.x, ai.y, a.x, a.y) > dst(ai.x, ai.y, b.x, b.y)){
                return -1;
            } else {
                return 1;
            }
        }
        self.others.forEach(function(other){
            if (!other.isOut){
                var placed = false;
                for (var i = 0; i < enemies.length; i += 1){
                    if (compare(enemies[i], other) == -1){
                        enemies.splice(i, 0, other);
                        placed = true;
                        break;
                    }
                }
                if (!placed){
                    enemies.push(other);
                }
            }
        });
        return enemies;
    }

    function isEnemyAttacking(enemy){
        return (self.team.teamNumber ? (enemy.x < canW / 2) : (enemy.x > canW / 2))
    }

    function numberOfAttackingEnemies(){
        self.state.others.attacking = [];
        self.others.forEach(function(enemy){
            if(isEnemyAttacking(enemy)){
                self.state.others.attacking.push(enemy);
            }
        });
    }

    function numberOfOutEnemies(){
        var count = 0;
        self.others.forEach(function(enemy){
            count += (enemy.isOut ? 1 : 0);
        });
        self.state.others.out = count;
    }

    function numberOfDefenders(){
        self.state.defenders = []
        self.team.forEach(function(ai){
            if (ai.aiRole == "defend"){
                self.state.defenders.push(ai);
            }
        });
    }

    function numberOfOutTeammates(){
        var count = 0;
        self.team.forEach(function(ai){
            count += (ai.isOut ? 1 : 0);
        });
        self.state.out = count;
    }

    function getDesired(){
        self.state.desired = {save: 0, defend: 0, attack: 0};
        if(self.state.out <= 0){
            if (self.team.flag.carried){
                self.state.desired.save = 2;
                self.state.desired.attack = 1;
            } else if (self.state.others.out <= 0){
                self.state.desired.attack = 1;
                self.state.desired.defend = 2;
            } else if (self.state.others.out > 0){
                self.state.desired.attack = 2;
                self.state.desired.defend = 1;
            }
        } else if (self.state.out == 1){
            if (self.team.flag.carried){
                self.state.desired.save = 1;
                self.state.desired.attack = 1;
            } else {
                self.state.desired.attack = 1;
                self.state.desired.defend = 1;
            }
        } else if (self.state.out >= 2){
            if (self.team.flag.carried){
                self.state.desired.save = 1;
                self.state.desired.attack = 0;
            } else {
                self.state.desired.attack = 1;
                self.state.desired.defend = 0;
            }
        }
    }

    this.getRoles = function(){
        numberOfAttackingEnemies();
        numberOfOutEnemies();
        numberOfOutTeammates();
        getDesired();
        var state = this.state;
        this.team.forEach(function(ai){
            ai.enemyTarget = null;
            if (state.desired.defend > 0){
                ai.aiRole = "defend";
                state.desired.defend -= 1;
            } else if (state.desired.attack > 0){
                ai.aiRole = "attack";
                state.desired.attack -= 1;
            }
        });
        numberOfDefenders();
    }

    this.getMoves = function(){
        var state = this.state;
        this.getRoles();

        var data = [];

        this.team.forEach(function(ai){
            if (!ai.isOut) {
                var d = {num: ai.number, team: ai.team, path:[]};
                if (ai.aiRole == "defend") {
                    // goal should be to track down nearest attacker
                    if (state.others.attacking.length > 0){
                        var enemies = getEnemies(ai);
                        var pos = {x: enemies[0].x, y: enemies[0].y};
                        var diffToFlag = diff(pos.x, pos.y, self.team.flag.x, self.team.flag.y);
                        diffToFlag.x *= 0.5;
                        diffToFlag.y *= 0.5;
                        self.getPath(ai, {x: pos.x - diffToFlag.x, y: pos.y - diffToFlag.y}, d.path);
                    }
                } else if (ai.aiRole == "save") {
                    // goal should be to track down attacker with the flag
                    var enemies = getEnemies(ai);
                    var pos = {x: enemies[0].x, y: enemies[0].y};
                    var mid = (pos.x - canW / 2) / 2 + pos.x;
                    self.getPath(ai, {x: pos.x - mid, y: pos.y}, d.path);
                } else if (ai.aiRole == "attack") {
                    if (ai.carryingFlag){
                        // goal should be to get back into home territory while avoiding defenders
                        self.getPath(ai, {x: self.team.flag.x, y: self.team.flag.y}, d.path);
                    } else {
                        // goal should be to get to the flag while avoiding defenders
                        self.getPath(ai, {x: self.others.flag.x, y: self.others.flag.y}, d.path);
                    }

                }
                data.push(d);
            }
        });

        return data;
    }

    this.getPath = function(ai, target, path){
        var dif = diff(target.x, target.y, ai.x, ai.y);
        var nor = norm(dif.x, dif.y);

        function getP(start, dir, target){
            var p = {x: start.x, y: start.y};
            if (dst(start.x, start.y, target.x, target.y) > ai.maxPathDist){
                p.x += dir.x * ai.maxPathDist;
                p.y += dir.y * ai.maxPathDist;
            } else {
                p.x = target.x;
                p.y = target.y;
            }

            var distanceToMid = dst(p.x, p.y, start.x, start.y) * 0.5;

            var inN = false;
            function isInNZ(neutralZone){
                if (neutralZone.contains(pos)){
                    inN = true;
                }
            };
            for (var i = 0; i < 10; i += 1){
                inN = false;
                var randVect = {x: (Math.random() * 2 - 1) * distanceToMid, y: (Math.random() * 2 - 1) * distanceToMid};
                var pos = {
                    x: start.x + (dir.x * distanceToMid) + randVect.x,
                    y: start.y + (dir.y * distanceToMid) + randVect.y
                };
                neutralZones.forEach(isInNZ);
                if (!inN){
                    return pos;
                }
            }
            console.error("Could not find position");
            return start;
        }

        var seg0 = getP(ai, nor, target);
        var seg1 = getP(seg0, nor, target);
        path.push(seg0);
        path.push(seg1);
    }
}

function Server() {
    var socket = {};
    var connected = false;
    var serverJoinTimeout = 5000;

    var responseCallback = null;
    var readyCallback = null;
    var joinTimeout = null;

    function onResponse(data) {
        console.log("RESPONSE");
        if (responseCallback) {
            responseCallback(data);
        }
    }

    function onDisconnect() {

    }

    function onReady(data) {
        console.log("READY");
        if (readyCallback) {
            readyCallback(data);
        }
    }

    function onSync(data) {

    }

    function connect() {
        connected = true;
        console.log('connecting');
        if (!socket.connected) socket = io(document.location.href);
        socket.on('response', onResponse);
        socket.on("sync", onSync);
        socket.on('ready', onReady);
        socket.on('disconnect', onDisconnect);
    }


    this.joinGameOrCreateGame = function (callback) {
        connect();
        readyCallback = function (data) {
            if (joinTimeout) {
                clearTimeout(joinTimeout);
            }
            myTeamNumber = data.teamNumber;
            playAgainstAI = data.playAgainstAI;
            callback();
        }
        joinTimeout = setTimeout(function () {
            var cb = readyCallback
            readyCallback = null;
            if (cb)cb({
                id: "LOCAL GAME",
                teamNumber: 0,
                playAgainstAI: true
            })
            socket.emit("quit", {});
        }, serverJoinTimeout);
    };

    function sendData(data, callback) {
        if (data.b) {
            setTimeout(function () {
                callback(data);
            }, 10);
        } else {
            responseCallback = callback;
            socket.emit("step", data);
        }
    }

    this.send = function (myTeamPaths, otherTeamPaths, callback) {
        sendData({a: myTeamPaths, b: otherTeamPaths}, callback);
    };

    this.roundOver = function(){}

    this.sendSync = function (myTeam, otherTeam) {
        socket.emit("clientsync", {});
    };
}

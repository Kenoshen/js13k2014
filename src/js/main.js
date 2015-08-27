var canvas = null;
var ctx = null;
var canW = 800;
var canH = 450;
var mouse = {x: 0, y: 0};
var lastKeyState = {up: 0, down: 0, left: 0, right: 0, space: 0};
var keyState = {up: 0, down: 0, left: 0, right: 0, space: 0};
window.onload = function() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    canvas.onmousemove = function(event){
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    };
    document.addEventListener('keydown', function(event) {
        var k = event.keyCode;
        console.log(event.keyCode);
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
        console.log(event.keyCode);
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

    var objs = [];
    var a = new Obj(0, 0, 100, 100, "blue");
    a.update = function(){
        this.x = mouse.x;
        this.y = mouse.y;
    }
    objs.push(a);
    var a = new Obj(0, 0, 100, 100, "red");
    a.speed = 10;
    a.update = function(){
        this.x += (keyState.right ? this.speed : keyState.left ? -this.speed : 0);
        this.y += (keyState.down ? this.speed : keyState.up ? -this.speed : 0);
    }
    objs.push(a);

    setInterval(function(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateKeyState();

        objs.forEach(function(i, obj){
            i.update();
        });

        objs.forEach(function(i, obj){
            i.draw();
        });
    }, 1000 / 30);
};

function Obj(x, y, w, h, col){
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 0;
    this.h = h || 0;
    this.col = col || "#000000";
    this.draw = function(){
        if (this.w > 0 && this.h > 0) {
            ctx.fillStyle = this.col;
            ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
        }
    }
    this.update = function(){};
}
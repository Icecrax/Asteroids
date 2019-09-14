let canvas;
let ctx; // context
let canvasWidth = 1343;
let canvasHeight = 642;
let keys = [];

let ship;
let trusters;
let lifeStation;
let enemyShip;
let blackHole;
let bullets = [];
let lasers = [];
let asteroids = [];
let explosions = [];
let shipDamage;
let enemyShipDamage;

let score = 0;
let highScore
let level = 1;
let playersLives = 3;

document.addEventListener('DOMContentLoaded', SetupCanvas);

function SetupCanvas() {
    canvas = document.getElementById('my-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ship = new Ship();
    trusters = new Trusters();
    enemyShip = new EnemyShip();
    blackHole = new BlackHole();
    lifeStation = new LifeStation();
   
    for (let i = 0; i < 8; i++) {
        asteroids.push(new Asteroid());
    }

    // Handles the pressing of a key
    document.body.addEventListener('keydown', function (e) {
        keys[e.keyCode] = true;
    });

    // Handles the releasing of a key
    document.body.addEventListener('keyup', function (e) {
        keys[e.keyCode] = false;
        // Spacebar
        if (e.keyCode === 32) {
            bullets.push(new Bullet(ship.angle));
        }
    });

    // Assures storing the highest score after reloading the page
    if (localStorage.getItem("asteroidsHighScore") == null) {
        highScore = 0;
    } else {
        highScore = localStorage.getItem("asteroidsHighScore");
    }

    Render();
}

class Ship {

    constructor() {
        this.visible = true;
        this.lives = playersLives;
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.movingForward = false;
        this.speed = 0.1;
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotationSpeed = 3;
        this.radius = 15;
        this.angle = 90;
        this.noseX = canvasWidth / 2 + 15;
        this.noseY = canvasHeight / 2;
    }

    // direction is -1 or 1
    Rotate(direction) {
        this.angle = (this.angle + this.rotationSpeed * direction + 360) % 360;
    }

    Update() {
        let radians = this.angle / 180 * Math.PI;
        if (this.movingForward) {
            this.velocityX += Math.cos(radians) * this.speed;
            this.velocityY += Math.sin(radians) * this.speed;
        }

        // nears left wall
        if (this.x < this.radius) {
            this.x = canvas.width;
        }

        // nears right wall
        if (this.x > canvas.width) {
            this.x = this.radius;
        }

        // nears top wall
        if (this.y < this.radius) {
            this.y = canvas.height;
        }

        // nears bottom wall
        if (this.y > canvas.height) {
            this.y = this.radius;
        }

        // the ship is slowing down with each iteration of the Update function
        // accounts for air friction
        this.velocityX *= 0.99;
        this.velocityY *= 0.99;

        // Update value of x & y while   
        this.x -= this.velocityX;
        this.y -= this.velocityY;
    }

    Draw() {

        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        let vertAngle = Math.PI * 2 / 3; // 2,0944rad = 120°
        let radians = this.angle / 180 * Math.PI;
        this.noseX = this.x - this.radius * Math.cos(radians);
        this.noseY = this.y - this.radius * Math.sin(radians);

        ctx.lineTo(
            this.noseX,
            this.noseY
        );
        ctx.lineTo(
            this.x - this.radius * Math.cos(vertAngle * 1 + radians),
            this.y - this.radius * Math.sin(vertAngle * 1 + radians)
        );
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(
            this.x - this.radius * Math.cos(vertAngle * 2 + radians),
            this.y - this.radius * Math.sin(vertAngle * 2 + radians)
        );

        ctx.closePath();
        ctx.stroke();
    }
}

class Bullet {

    constructor(angle) {
        this.visible = true;
        this.x = ship.noseX;
        this.y = ship.noseY;
        this.angle = angle;
        this.radius = 3;
        this.speed = 5;
        this.radians = this.angle / 180 * Math.PI;
        this.velocityX = Math.cos(this.radians) * this.speed;
        this.velocityY = Math.sin(this.radians) * this.speed;
    }

    Update() {
        this.x -= this.velocityX;
        this.y -= this.velocityY;
    }

    Draw() {
        ctx.fillStyle = 'lightblue';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
        ctx.fill();
    }
}

class Laser {

    constructor() {
        this.visible = true;
        this.x = enemyShip.x;
        this.y = enemyShip.y;
        this.targetX = ship.x;
        this.targetY = ship.y;
        this.radians = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.len = 20;
        this.speed = 5;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    Update() {
        this.x += Math.cos(this.radians) * this.speed;
        this.y += Math.sin(this.radians) * this.speed;
    }

    Draw() {
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(this.x - this.len/2 * Math.cos(this.radians), this.y - this.len/2 * Math.sin(this.radians));
        ctx.lineTo(this.x + this.len/2 * Math.cos(this.radians), this.y + this.len/2 * Math.sin(this.radians));
        ctx.lineTo(this.x - this.len/2 * Math.cos(this.radians), this.y - this.len/2 * Math.sin(this.radians));
        ctx.stroke();
    }
}

class Asteroid {

    constructor(x, y, radius, speed, size, collisionRadius) {
        this.visible = true;
        this.radius = radius || 50;
        if(x !== undefined && y !== undefined){
            this.x = x;
            this.y = y;
        } else {
            do{
                this.x = x || Math.floor(Math.random() * canvasWidth);
                this.y = y || Math.floor(Math.random() * canvasHeight);
            } while (Math.abs(this.x - ship.x) < this.radius + 6 * ship.radius && Math.abs(this.y - ship.y) < this.radius + 6 * ship.radius)    
        }
       
        this.speed = speed || (2 + (level-1)/5);
        this.rotationSpeed = (Math.random() * 4.5 + 0.5);
        this.rotationDir = Math.floor(Math.random() * 100) % 2 === 0 ? -1 : 1;
        this.rotationVar = 0;
        this.angle = Math.floor(Math.random() * 360);
        this.collisionRadius = collisionRadius || 46;
        this.size = size || 1;
    }

    Update() {

        this.rotationVar += this.rotationDir * this.rotationSpeed;

        let radians = this.angle / 180 * Math.PI;
        this.x += Math.cos(radians) * this.speed;
        this.y += Math.sin(radians) * this.speed;

        // nears left wall
        if (this.x < this.radius) {
            this.x = canvas.width;
        }

        // nears right wall
        if (this.x > canvas.width) {
            this.x = this.radius;
        }

        // nears top wall
        if (this.y < this.radius) {
            this.y = canvas.height;
        }

        // nears bottom wall
        if (this.y > canvas.height) {
            this.y = this.radius;
        }
    }

    Draw() {
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        let vertAngle = ((Math.PI * 2) / 6); // ~ 1,05 radians = 60° hexagon
        let radians = ((this.angle + Math.floor(this.rotationVar)) % 360) / 180 * Math.PI;
        for (let i = 0; i < 6; i++) {
            ctx.lineTo(
                this.x - this.radius * Math.cos(vertAngle * i + radians),
                this.y - this.radius * Math.sin(vertAngle * i + radians)
            );
        }
        ctx.closePath();
        ctx.stroke();
    }
}

class LifeStation{

    constructor(){
        this.timeTillRespawn = 1000; //frames
        this.visible = true;
        this.radius = 20;
        do{
            this.x = this.radius + Math.floor(Math.random() * (canvasWidth - 2 * this.radius));
            this.y = this.radius + Math.floor(Math.random() * (canvasHeight - 2 * this.radius));
        }while(Math.abs(this.x - blackHole.x) < blackHole.outerRadius + 10 && Math.abs(this.y - blackHole.y) < blackHole.outerRadius + 10)
            
    }

    Update(){
        if(this.timeTillRespawn > 0){
            this.timeTillRespawn--;
        }
       
        if(this.timeTillRespawn === 0){
            this.timeTillRespawn = 1000;
            this.visible = true;
            this.x = this.radius + Math.floor(Math.random() * (canvasWidth - 2 * this.radius));
            this.y = this.radius + Math.floor(Math.random() * (canvasHeight - 2 * this.radius));    
        }
    }

    Draw(){
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x,this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.fillRect(this.x - 7/10 * this.radius, this.y - 1/5 * this.radius, 7/5 * this.radius, 2/5 * this.radius);
        ctx.fillRect(this.x - 1/5 * this.radius, this.y - 7/10 * this.radius, 2/5 * this.radius, 7/5 * this.radius);
        ctx.fill();
    }
}

class BlackHole {

    constructor(){
        this.visible = false;
        this.innerRadius = 100;
        this.outerRadius = 125;
        this.numVertices = 8;
        this.angle = 0;
        this.flickerOffset = 1.75;
        this.rotationSpeed = 1;

        do{
            this.x = Math.floor(Math.random() * (canvasWidth - 4 * this.innerRadius) + 2 * this.innerRadius);
            this.y = Math.floor(Math.random() * (canvasHeight - 4 * this.innerRadius) +  2 * this.innerRadius);
        } while (Math.abs(this.x - ship.x) < 2 * this.outerRadius && Math.abs(this.y - ship.y) < 2 * this.outerRadius)
    }

    ApplyForce(object, G){
        let dx = this.x - object.x;
        let dy = this.y - object.y;
        let distance = Math.sqrt(dx * dx + dy * dy)
        let normDX = dx / distance;
        let normDY = dy / distance;
        let strength = (G * this.innerRadius * object.radius) / (distance);
        object.x += normDX * strength;
        object.y += normDY * strength;

        return [-normDX, -normDY];
    }

    Update() {
        let radians = this.angle / 180 * Math.PI;
        this.x += Math.cos(radians * 50) * this.flickerOffset;
        this.y += Math.sin(radians * 50) * this.flickerOffset;
        this.angle = (this.angle - this.rotationSpeed + 360) % 360;
    }

    Draw() {
        let vertAngle = ((Math.PI * 2) / this.numVertices); 
        let radians = this.angle / 180 * Math.PI;    
        
        ctx.beginPath();
        ctx.moveTo(
            this.x - 0.2 * this.innerRadius * Math.cos(radians),
            this.y - 0.2 * this.innerRadius * Math.sin(radians)
        );
        for (let i = 0; i < this.numVertices; i++) {
            ctx.strokeStyle = 'white';

            ctx.bezierCurveTo(
                this.x - 0.2 * this.innerRadius * Math.cos(vertAngle * i + radians),
                this.y - 0.2 * this.innerRadius * Math.sin(vertAngle * i + radians),
                this.x - 1.3 * this.innerRadius * Math.cos(vertAngle * (i+1.2) + radians),
                this.y - 1.3 * this.innerRadius * Math.sin(vertAngle * (i+1.2) + radians), 
                this.x - this.innerRadius * Math.cos(vertAngle * (i+3) + radians),
                this.y - this.innerRadius * Math.sin(vertAngle * (i+3) + radians)
            );
            ctx.bezierCurveTo(
                this.x - this.innerRadius * Math.cos(vertAngle * (i+3) + radians),
                this.y - this.innerRadius * Math.sin(vertAngle * (i+3) + radians), 
                this.x - this.innerRadius * Math.cos(vertAngle * (i+1.6) + radians),
                this.y - this.innerRadius * Math.sin(vertAngle * (i+1.6) + radians), 
                this.x - 0.2 * this.innerRadius * Math.cos(vertAngle * (i+1) + radians),
                this.y - 0.2 * this.innerRadius * Math.sin(vertAngle * (i+1) + radians)
            );
        }
        ctx.closePath();
        ctx.stroke();
    }
}

class EnemyShip {

    constructor(){
        this.visible = false;
        this.radius = 20;
        this.speed = 1.25;
        this.lives = 2;
        this.timer = 1000; // frames
        this.changeDirTimer = 30;
        this.shootInterval =  150;
        this.stepX = Math.floor(Math.random() * 3) - 1;
        this.stepY = Math.floor(Math.random() * 3) - 1;
        this.x = Math.floor(Math.random() * 2) * canvasWidth + this.radius;
        this.y = Math.floor(Math.random() * 2) * canvasHeight + this.radius;
    }

    Update(){
        if(this.lives <= 0){
            this.visible = false;
            this.timer = 2000;
        }

        // shoots lasers
        if(this.shootInterval > 0){
            this.shootInterval--;
        } else {
            if(level <= 3){
                this.shootInterval = 100;
            } else if(level <= 8){
                this.shootInterval = 100 - (level - 3)*10;
            } else{
                this.shootInterval = 50;
            }
            lasers.push(new Laser());
        }

        // changes direction
        if(this.changeDirTimer > 0){           
            this.changeDirTimer--;
        } else {
            this.changeDirTimer = 30;
            do{
                this.stepX = Math.floor(Math.random()*3) - 1;
                this.stepY = Math.floor(Math.random()*3) - 1;
            }while(this.stepX === 0 && this.stepY === 0)
        }
        this.x += this.stepX * this.speed;
        this.y += this.stepY * this.speed;

        // nears left wall
        if (this.x < this.radius) {
            this.x = canvas.width;
        }

        // nears right wall
        if (this.x > canvas.width) {
            this.x = this.radius;
        }

        // nears top wall
        if (this.y < this.radius) {
            this.y = canvas.height;
        }

        // nears bottom wall
        if (this.y > canvas.height) {
            this.y = this.radius;
        }
    }   

    Draw(){
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 1, this.y - 1, 3, 3);

        // top
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y - 6);
        ctx.lineTo(this.x - 8, this.y - 9);
        ctx.lineTo(this.x + 8, this.y - 9);
        ctx.lineTo(this.x + 12, this.y - 6);
        ctx.closePath();
        ctx.fill();

        // upper-middle
        ctx.fillStyle = 'lightgray';
        ctx.beginPath();
        ctx.moveTo(this.x - 30, this.y);
        ctx.lineTo(this.x - 17, this.y - 6);
        ctx.lineTo(this.x + 17, this.y - 6);
        ctx.lineTo(this.x + 30, this.y);
        ctx.closePath();
        ctx.fill();

        // lower-middle
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.moveTo(this.x - 30, this.y);
        ctx.lineTo(this.x - 17, this.y + 6);
        ctx.lineTo(this.x + 17, this.y + 6);
        ctx.lineTo(this.x + 30, this.y);
        ctx.closePath();
        ctx.fill();

        // bottom
        ctx.fillStyle = 'lightgray';
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y + 6);
        ctx.lineTo(this.x - 8, this.y + 9);
        ctx.lineTo(this.x + 8, this.y + 9);
        ctx.lineTo(this.x + 12, this.y + 6);
        ctx.closePath();
        ctx.fill();
    }
}

class Damage{

    constructor(ship, damage) {
        this.blockMoreDamage = true;
        this.timer = 20;
        this.ship = ship;
        this.damage = damage;
    }

    Update(){
        this.timer = (this.timer + 19) % 20;
        if(!this.blockMoreDamage && this.timer === 0){ 
            this.ship.lives -= this.damage;
        }
    }

    Draw(){
        if(this.timer % 3 === 0 || this.timer % 4 === 0){
            ctx.fillStyle = 'orange';
        } else {
            ctx.fillStyle = 'red';
        }
        ctx.beginPath();
        ctx.arc(this.ship.x, this.ship.y, this.ship.radius * 1.2, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class Trusters {
    constructor() {
        this.x = ship.x + 8 * Math.cos(ship.angle / 180 * Math.PI);
        this.y = ship.y + 8 * Math.sin(ship.angle / 180 * Math.PI);
        this.particles = [];
        this.lifespan = 80;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    Set() {
        if (ship.movingForward) {
            this.particles.unshift(new Trusters());
            this.particles.unshift(new Trusters());
        }
    }

    Update() {
        this.Set();
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].lifespan <= 0) {
                this.particles.splice(i, 1);
            }
            else {
                this.particles[i].lifespan -= 10;
                let angle = ship.angle + Math.random() * 180 - 90;
                let radians = angle / 180 * Math.PI;
                let forceX = Math.cos(radians) * 0.9;
                let forceY = Math.sin(radians) * 0.9;
                this.particles[i].velocityX += forceX;
                this.particles[i].velocityY += forceY;
                this.particles[i].x += this.particles[i].velocityX;
                this.particles[i].y += this.particles[i].velocityY;
            }
        }
    }

    Draw() {
        ctx.fillStyle = 'white';
        for (let i = 0; i < this.particles.length; i++) {
            ctx.globalAlpha = 1 / 80 * this.particles[i].lifespan;
            ctx.beginPath();
            ctx.arc(this.particles[i].x, this.particles[i].y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
}

class Explosion {

    constructor(x, y, radius, setup) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        if (setup) {
            this.particles = [];
            this.numParticles = this.radius * 2;
            for (var i = 0; i < this.numParticles; i++) {
                this.particles.push(new Explosion(this.x, this.y, this.radius, false));
            }
        }
        else {
            this.angle = Math.random() * 360;
            this.velocityX = Math.cos(this.angle) * (Math.random() * 0.6 * this.radius - 0.3 * this.radius);
            this.velocityY = Math.sin(this.angle) * (Math.random() * 0.6 * this.radius - 0.3 * this.radius);
            this.lifespan = Math.random() * 30 + 50;
            this.particleSize = Math.floor(Math.random() * this.radius / 10 + 2);
        }
    }

    Update() {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].x += this.particles[i].velocityX;
            this.particles[i].y += this.particles[i].velocityY;
            this.particles[i].lifespan -= 10;
            if (this.particles[i].lifespan < 0) {
                this.particles.splice(i, 1);
                i--;
            }
        }
    }

    Draw() {
        ctx.fillStyle = 'white';
        for (let i = 0; i < this.particles.length; i++) {
            if (Math.random() < 0.2)
                ctx.globalAlpha = 1.0;
            else 
                ctx.globalAlpha = 1 / 175 * this.particles[i].lifespan;
            ctx.beginPath();
            ctx.arc(this.particles[i].x, this.particles[i].y, this.particles[i].particleSize, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
}

function DrawLifePoints() {
    
    let x = 35;
    let y = 95;
    let height = 25;
    let width = 25;
    let topCurveHeight = height * 0.3;

    for (let i = 0; i < ship.lives; i++) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(x, y + topCurveHeight);
        
        // top left curve
        ctx.bezierCurveTo(
          x, y, 
          x - width / 2, y, 
          x - width / 2, y + topCurveHeight
        );
                
        // bottom left curve
        ctx.bezierCurveTo(
          x - width / 2, y + (height + topCurveHeight) / 2, 
          x, y + (height + topCurveHeight) / 2, 
          x, y + height
        );
                
        // bottom right curve
        ctx.bezierCurveTo(
          x, y + (height + topCurveHeight) / 2, 
          x + width / 2, y + (height + topCurveHeight) / 2, 
          x + width / 2, y + topCurveHeight
        );
                
        // top right curve
        ctx.bezierCurveTo(
          x + width / 2, y, 
          x, y, 
          x, y + topCurveHeight
        );
                
        ctx.closePath();
        ctx.fill();

        x += 30;
    }
}

function TestCollision(p1x, p1y, r1, p2x, p2y, r2) {
    let radiusSum;
    let xDiff;
    let yDiff;
    radiusSum = r1 + r2;
    xDiff = p1x - p2x;
    yDiff = p1y - p2y;
    if (radiusSum > Math.sqrt((xDiff * xDiff) + (yDiff * yDiff))) {
        return true;
    }
    return false;
}

function Render() {
    // W
    ship.movingForward = (keys[87]);

    // D
    if (keys[68]) {
        ship.Rotate(1);
    }
    // A
    if (keys[65]) {
        ship.Rotate(-1);
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    highScore = Math.max(score, highScore);
    localStorage.setItem("asteroidsHighScore", highScore);
    ctx.fillStyle = 'white';
    ctx.font = '21px Arial';
    ctx.fillText('HIGH SCORE: ' + highScore.toString(), 20, 35);
    ctx.fillText('SCORE: ' + score.toString(), 20, 60);
    ctx.fillText('LEVEL: ' + level.toString(), 20, 85);

    if (ship.lives <= 0) {
        ship.visible = false;
        ctx.fillStyle = 'white';
        ctx.font = '50px Arial';
        ctx.fillText('GAME OVER', canvasWidth / 2 - 150, canvasHeight / 2);
    }

    if (asteroids.length === 0) {
        level++;
        for (let i = 0; i < 8; i++) {
            asteroids.push(new Asteroid());
        }
    }

    DrawLifePoints();

    if(level === 2 || level > 3) {
        blackHole.visible = true;
    } else {
        blackHole.visible = false;
    }

    if(level > 2){ 
        if(enemyShip.timer > 0){
            enemyShip.timer--;
            if(enemyShip.timer === 0){
                enemyShip.lives = 2;
            }
        } else {
            enemyShip.visible = true;
        }
    } else{
        enemyShip.visible = false;
    }

    // Handles the ship arriving at the live station
    if(lifeStation.visible && ship.visible){
        if(TestCollision(ship.x, ship.y, ship.radius, lifeStation.x, lifeStation.y, lifeStation.radius)){
            if(ship.lives < 3){
                ship.lives += 1;
                lifeStation.visible = false;
            }
        }
    }

    // Handles asteroids hitting the ship
    if (ship.visible && asteroids.length !== 0) {
        let collisions = 0;
        for (let k = 0; k < asteroids.length; k++) {
            if (TestCollision(ship.x, ship.y, ship.radius, asteroids[k].x, asteroids[k].y, asteroids[k].collisionRadius)) {
                collisions++;
                if (shipDamage === undefined) {
                    shipDamage = new Damage(ship, 1);
                }
            }
        }
        if (shipDamage !== undefined && collisions === 0) {
            shipDamage.blockMoreDamage = false;
        }
    }

    // Handles bullets hitting asteroids
    if (ship.visible && asteroids.length !== 0 && bullets.length !== 0) {
        loop1:
        for (let l = 0; l < asteroids.length; l++) {
            for (let m = 0; m < bullets.length; m++) {
                if (TestCollision(bullets[m].x, bullets[m].y, bullets[m].radius, asteroids[l].x, asteroids[l].y, asteroids[l].radius)) {
                    explosions.push(new Explosion(asteroids[l].x, asteroids[l].y, asteroids[l].radius, true));
                    bullets.splice(m, 1);
                    if (asteroids[l].size === 1) {
                        asteroids.push(new Asteroid(asteroids[l].x - 5, asteroids[l].y - 5, 25, asteroids[l].speed * 1.1, 2, 22));
                        asteroids.push(new Asteroid(asteroids[l].x + 5, asteroids[l].y + 5, 25, asteroids[l].speed * 1.1, 2, 22));
                    } else if (asteroids[l].size === 2) {
                        asteroids.push(new Asteroid(asteroids[l].x - 5, asteroids[l].y - 5, 15, asteroids[l].speed * 1.1, 3, 12));
                        asteroids.push(new Asteroid(asteroids[l].x + 5, asteroids[l].y + 5, 15, asteroids[l].speed * 1.1, 3, 12));
                    }
                    asteroids.splice(l, 1);
                    bullets.splice(m, 1);
                    if(ship.visible)
                        score += 20*level;
                    break loop1;
                }
            }
        }
    }

    // Handles bullets hitting the enemy ship
    if (enemyShip.visible && ship.visible && bullets.length !== 0) {
        let collisions = 0;
        for (let b = 0; b < bullets.length; b++) {
            if (TestCollision(bullets[b].x, bullets[b].y, bullets[b].radius, enemyShip.x, enemyShip.y, enemyShip.radius)) {
                collisions++;
                bullets.splice(b, 1);
                if (ship.visible) score += 200;
                if (enemyShipDamage === undefined) {
                    shipDamage = new Damage(enemyShip, 1);
                }
            }
        }
        if (enemyShipDamage !== undefined && collisions === 0) {
            enemyShipDamage.blockMoreDamage = false;
        }
    }

    // Handles lasers hitting the ship
    if(enemyShip.visible && ship.visible && lasers.length !== 0 && shipDamage == null){
        for(let l = 0; l < lasers.length; l++){
            if(TestCollision(lasers[l].x, lasers[l].y, 8, ship.x, ship.y, ship.radius)){
                lasers.splice(l, 1);
                shipDamage = new Damage(ship, 1);
            }
        }
    }

    // Handles enemy ship nearing the black hole
    if(enemyShip.visible && blackHole.visible){
        if(TestCollision(enemyShip.x, enemyShip.y, enemyShip.radius, blackHole.x, blackHole.y, blackHole.outerRadius)){
            enemyShip.stepX = -enemyShip.stepX;
            enemyShip.stepY = -enemyShip.stepY;
        }
    }

    // Handles ship entering black hole's outer radius
    if (ship.visible && blackHole.visible) {
        if (TestCollision(ship.x, ship.y, ship.radius, blackHole.x, blackHole.y, blackHole.outerRadius) &&
            !TestCollision(ship.x, ship.y, ship.radius, blackHole.x, blackHole.y, blackHole.innerRadius)) {
                blackHole.ApplyForce(ship, 0.2);
        }
        // Handles ship entering black hole's inner radius
        if (TestCollision(ship.x, ship.y, ship.radius, blackHole.x, blackHole.y, blackHole.innerRadius)) {
                blackHole.ApplyForce(ship, 0.2);
        }
        // Handles ship entering the black hole
        if (TestCollision(ship.x, ship.y, 0.05 * ship.radius, blackHole.x, blackHole.y, 0.05 * blackHole.innerRadius)) {
            ship.lives -= 3;
        }
    }
    
    if (bullets.length > 0 && blackHole.visible) {
        for (let b = 0; b < bullets.length; b++) {
            let gravity;
            // Handles bullets entering black hole's outer radius
            if (TestCollision(bullets[b].x, bullets[b].y, bullets[b].radius, blackHole.x, blackHole.y, blackHole.outerRadius) &&
                !TestCollision(bullets[b].x, bullets[b].y, bullets[b].radius, blackHole.x, blackHole.y, blackHole.innerRadius)) {
                    gravity = blackHole.ApplyForce(bullets[b], 0.2);
                    bullets[b].velocityX += gravity[0];
                    bullets[b].velocityY += gravity[1];
            }
            // Handles bullets entering black hole's inner radius
            if (TestCollision(bullets[b].x, bullets[b].y, bullets[b].radius, blackHole.x, blackHole.y, blackHole.innerRadius)) {
                gravity = blackHole.ApplyForce(bullets[b], 0.2);
                bullets[b].velocityX += gravity[0];
                bullets[b].velocityY += gravity[1];
            }
            // Handles bullets entering the black hole
            if (TestCollision(bullets[b].x, bullets[b].y, 0.05 * bullets[b].radius, blackHole.x, blackHole.y, 0.05 * blackHole.innerRadius)) {
                bullets.splice(b, 1);
            }
        }
    }

    // Draws the ship damage
    if (shipDamage !== undefined && ship.visible) {
        shipDamage.Update();
        shipDamage.Draw();
        if (!shipDamage.blockMoreDamage && shipDamage.timer === 0) {
            shipDamage = undefined;
        }
    }

    // Draws the enemy ship damage
    if (enemyShipDamage !== undefined && ship.visible) {
        enemyShipDamage.Update();
        enemyShipDamage.Draw();
        if (!enemyShipDamage.blockMoreDamage && enemyShipDamage.timer === 0) {
            enemyShipDamage = undefined;
        }
    }

    // Draws the ship
    if (ship.visible) {
        ship.Update();
        ship.Draw();
    }

    // Draws the trusters
    if (ship.visible) {
        trusters.Update();
        trusters.Draw();
    }

    // Draws the explosions
    for(let i = 0; i < explosions.length; i++){
        explosions[i].Update();
        explosions[i].Draw();
        if (explosions[i].particles.length === 0) {
            explosions.splice(i, 1);
            i--;
        }
    }

    // Draws the black hole
    if(blackHole.visible){
        blackHole.Update();
        blackHole.Draw();
    }

    // Draws enemy ship
    if (enemyShip.visible) {
        enemyShip.Update();
        enemyShip.Draw();
    }

    // Draws the life station
    if (lifeStation.visible && ship.visible) {
        lifeStation.Draw();
    } else {
        lifeStation.Update();
    }

    // Draws the asteroids
    if (asteroids.length !== 0) {
        for (let j = 0; j < asteroids.length; j++) {
            asteroids[j].Update();
            asteroids[j].Draw();
        }
    }

    // Draws the bullets
    if (bullets.length !== 0 && ship.visible) {
        for (let i = 0; i < bullets.length; i++) {
            bullets[i].Update();
            bullets[i].Draw();
        }
    }

    // Draws the lasers
    if (lasers.length !== 0 && ship.visible) {
        for (let i = 0; i < lasers.length; i++) {
            lasers[i].Update();
            lasers[i].Draw();
        }
    }

    // Handles bullets going offscreen
    for (let n = 0; n < bullets.length; n++) {
        if (bullets[n].x < 0 || bullets[n].x > canvasWidth ||
            bullets[n].y < 0 || bullets[n].y > canvasHeight) {
            bullets.splice(n, 1);
        }
    }

    // Handles lasers going offscreen
    for (let n = 0; n < lasers.length; n++) {
        if (lasers[n].x < 0 || lasers[n].x > canvasWidth ||
            lasers[n].y < 0 || lasers[n].y > canvasHeight) {
                lasers.splice(n, 1);
        }
    }

    requestAnimationFrame(Render);
}
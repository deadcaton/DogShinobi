'use strict'



class Camera {
    constructor({width = 1280, height = 1024, limitX = 50000, limitY = 50000, scrollEdge = 200} = {}){
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.limitX = limitX;
        this.limitY = limitY;
        this.watchObject = false;
        this.obj = null;
        this.scrollEdge = scrollEdge;
    }

    watch(obj) {
        this.watchObject = true;
        this.obj = obj;
    }

    update(time) {
        if(this.watchObject) {
            if(this.obj.x > (this.x + this.width - this.scrollEdge)) {
                this.x = Math.min(this.limitX, this.obj.x - this.width + this.scrollEdge);
            }

            if(this.obj.x < (this.x + this.scrollEdge)) {
                this.x = Math.max(0, this.obj.x - this.scrollEdge);
            }

            if(this.obj.y > (this.y + this.height - this.scrollEdge)) {
                this.y = Math.min(this.limitY, this.obj.y - this.height + this.scrollEdge);
            }

            if(this.obj.y < (this.y + this.scrollEdge)) {
                this.y = Math.max(0, this.obj.y - this.scrollEdge);
            }
        }
    }
}



class Vector {
    constructor(direction, speed){
        this.setDirection(direction, speed);
    }

    setDirection(direction, speed) {
        this.direction = direction;
        this.speed = speed;
        this.x = 0;
        this.y = 0;

        switch(direction) {
            case 'up':
                this.y = -speed;
            break;
            
            case 'down':
                this.y = speed;
            break;

            case 'right':
                this.x = speed;
            break;

            case 'left':
                this.x = -speed;
            break;
        }
    }
}



class Body {
    constructor({imageName, speed}) {
        this.x = 0;
        this.y = 0;
        this.speed = speed;
        this.velocity = new Vector('stop', 0);
        this.lastTime = 0;
        this.animations = {};

        const animationSheet = new CharacterSheet({imageName: imageName});
        'walk_stop,walk_right,walk_left'.split(',').forEach(name => {
            this.animations[name] = animationSheet.getAnimation(name);
        });
        this.stand('stop');
    }

    walk(direction) {
        this.velocity.setDirection(direction, this.speed);
        this.view = this.animations['walk_' + direction];
        this.view.run();
    }

    stand(direction) {
        this.velocity.setDirection(direction, 0);
        this.view = this.animations['walk_' + direction];
        this.view.stop();
    }

    update(time) {
        if(this.lastTime == 0) {
            this.lastTime = time;
            return;
        }

        this.x += (time - this.lastTime) * (this.velocity.x / 1000);
        this.y += (time - this.lastTime) * (this.velocity.y / 1000);
        this.lastTime = time;
        this.view.setXY(Math.trunc(this.x), Math.trunc(this.y));
        this.view.update(time);
    }
}



class Player extends Body {
    constructor(control) {
        super({imageName: 'player', speed: 300});
        this.control = control;
    }

    update(time) {
        if(this.control.up) {
            this.walk('up');
        } else if(this.control.down) {
            this.walk('stop');
        } else if(this.control.left) {
            this.walk('left');
        } else if(this.control.right) {
            this.walk('right');
        } else {
            this.stand(this.velocity.direction);
        }

        super.update(time);
    }
}



class Sprite {
    constructor({imageName, sourceX, sourceY, width = 64, height = 64}) {
        this.imageName = imageName;
        this.sourceX = sourceX;
        this.sourceY = sourceY;
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
    }

    setXY(x, y) {
        this.x = x;
        this.y = y;
    }
}



class SpriteSheet {
    constructor({imageName, imageWidth, imageHeight, spriteWidth = 64, spriteHeight = 64}){
        this.imageName = imageName;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
    }

    getAnimation(indexes, speed, repeat = true, autorun = true) {
        return new Animation({
            imageName: this.imageName,
            frames: indexes.map(index => ({sx: this.getSourceX(index), sy: this.getSourceY(index)})),
            speed: speed,
            repeat: repeat,
            autorun: autorun,
            width: this.spriteWidth,
            height: this.spriteHeight
        });
    }

    getSprite(index) {
        return new Sprite({
            imageName: this.imageName,
            sourceX: this.getSourceX(index),
            sourceY: this.getSourceY(index),
            width: this.spriteWidth,
            height: this.spriteHeight
        });
    }

    getSourceX(index) {
        // Чтобы найти X, необходимо порядковый номер умножить на ширину спрайта.
        // И получить остаток от деления на ширину листа.
        // Целя часть от деления - номер строки. Нужно умножить на высоту спрайта, чтобы получить Y.
        return (--index * this.spriteWidth) % this.imageWidth;
    }

    getSourceY(index) {
        return Math.trunc((--index * this.spriteWidth) / this.imageWidth) * this.spriteHeight;
    }
}



class Animation extends Sprite {
    constructor({imageName, frames, speed, repeat = true, autorun = true, width = 64, height = 64}) {
        super({
            imageName: imageName,
            sourceX: frames[0].sx,
            sourceY: frames[0].sy,
            width: width,
            height: height
        });

        this.frames = frames;
        this.speed = speed;
        this.repeat = repeat;
        this.running = autorun;
        this.lastTime = 0;
        this.currentFrame = 0;
        this.totalFrames = this.frames.length;
    }

    setFrame(index) {
        this.currentFrame = index;
        this.sourceX = this.frames[index].sx;
        this.sourceY = this.frames[index].sy;
    }

    run() {
        if(!this.running) {
            this.setFrame(0);
            this.running = true;
        }
    }

    stop() {
        this.running = false;
    }

    nextFrame() {
        if((this.currentFrame + 1) === this.totalFrames) {
            if(this.repeat) {
                this.setFrame(0);
                return;
            }
            this.stop();
            return;
        }
        this.setFrame(this.currentFrame + 1);
    }

    update(time) {
        if(!this.running) {
            return;
        }
        if(this.lastTime === 0) {
            this.lastTime = time;
            return;
        }
        if((time - this.lastTime) > this.speed) {
            this.nextFrame();
            this.lastTime = time;
        }
    }
}



class TileMap extends Sprite {
    constructor(props) {
        super(props);
        this.hitboxes = props.hitboxes || [];
    }
}



class ControlState {
    constructor(){
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;
        this.hit = false;
        this.keyMap = new Map([
            [37, 'left'],
            [39, 'right'],
            [38, 'up'],
            [40, 'down'],
            [32, 'hit']
        ]);
        document.addEventListener('keydown', (event) => this.update(event, true));
        document.addEventListener('keyup', (event) => this.update(event, false));
    }

    update(event, pressed) {
        if(this.keyMap.has(event.keyCode)) {
            event.preventDefault();
            event.stopPropagation();
            this[this.keyMap.get(event.keyCode)] = pressed;
            // console.log(this);
        }
    }
}



class Scene {
    constructor(game) {
        this.game = game;
        this.status = this.constructor.WORKING;
    }

    static get WORKING() { return 'WORKING'; }
    static get LOADED() { return 'LOADED'; }
    static get GAME_START() { return 'GAME_START'; }
    static get GAME_OVER() { return 'GAME_OVER'; }
    static get GAME_WIN() { return 'GAME_WIN'; }
    static get FINISHED() { return 'FINISHED'; }


    init() {
        this.status = this.constructor.WORKING;
    }

    finish(status) {
        this.status = status;
    }

    render(time) {

    }
}



class ImageLoader {
    constructor(imageFiles) {
        this.imageFiles = imageFiles;
        this.images = {};
    }

    load() {
        const promises = [];
        for (let name in this.imageFiles) {
            promises.push(this.loadImage(name, this.imageFiles[name]));
        }
        return Promise.all(promises);
    }

    loadImage(name, src) {
        return new Promise((resolve) => {
            const image = new Image();
            this.images[name] = image;
            image.onload = () => resolve(name);
            image.src = src;
        });
    }
}



class Loading extends Scene {
    constructor(game) {
        super(game);
        this.loadedAt = 0;
    }

    init() {
        super.init();
        this.loadedAt = 0;
    }

    update(time) {
        if(this.loadedAt === 0 && this.game.screen.isImagesLoaded === true) {
            this.loadedAt = time;
        }
        if(this.loadedAt !== 0 && (time - this.loadedAt) > 500) {
            this.finish(Scene.LOADED);
        }
    }

    render(time){
        this.update(time);
        this.game.screen.fill('#eee');
        this.game.screen.print(50, 50, 'Загрузка...');
        super.render(time);
    }
}



class Menu extends Scene {
    constructor(game) {
        super(game);
    }

    init() {
        super.init();
    }

    update(time) {
        if(this.game.control.hit) {
            this.finish(Scene.GAME_START);
        }
    }

    render(time) {
        this.update(time);
        this.game.screen.drawImage(0, 0, 'title');
        this.game.screen.print(250, 500, 'Нажмите пробел');
        super.render(time);
    }
}



class GameLevel extends Scene {
    constructor(game) {
        super(game);
        this.tiles = new SpriteSheet({
            imageName: 'tiles',
            imageWidth: 640,
            imageHeight: 640
        });
        // this.playerTiles = new CharacterSheet({imageName: 'player'});
        // this.player = this.playerTiles.getAnimation('walk');
        // this.player.setXY(100, 10);
        
        this.player = new Player(this.game.control);
        this.player.x = 200;
        this.player.y = 450;
    }

    init() {
        super.init();
        const mapData = JSON.parse(ajax.Get('./js/maps/map.json'));
        this.map = this.game.screen.createMap('map', mapData, this.tiles);
        this.mainCamera = new Camera({
            width: this.game.screen.width,
            height: this.game.screen.height,
            limitX: this.map.width - this.game.screen.width,
            limitY: this.map.height - this.game.screen.height
        });
        this.mainCamera.watch(this.player);
        this.game.screen.setCamera(this.mainCamera);
    }

    update(time) {
        this.player.update(time);
        this.mainCamera.update(time);
    }

    render(time) {
        this.update(time);
        this.game.screen.fill('#000');
        this.game.screen.drawSprite(this.map);
        this.game.screen.drawSprite(this.player.view);
        super.render(time);
    }
}



class CharacterSheet extends SpriteSheet {
    constructor({imageName}) {
        super({
            imageName: imageName,
            imageWidth: 384,
            imageHeight: 256
        });
        this.sequences = this.getSequences();
        // Высота героя в 2 спрайта (128)
        this.spriteHeight = 128;
        this.spriteWidth = 128;
    }

    getSequences() {
        const data = JSON.parse(ajax.Get('./js/maps/animations.json'));
        const sequences = {};
        data.layers.forEach(layer => {
            sequences[layer.name] = layer.data.filter(i => i > 0);
        });
        return sequences;
    }

    getAnimation(name, speed = 100, repeat = true, autorun = true) {
        return super.getAnimation(this.sequences[name], speed, repeat, autorun);
    }
}



class Screen {
    constructor(width, height) {
        width = this.screenSizes.defineWidth();
        height = this.screenSizes.defineHeight();

        this.width = width;
        this.height = height;
        this.canvas = this.createCanvas(width, height);
        this.context = this.canvas.getContext('2d');
        this.images = {};
        this.isImagesLoaded = false;
        this.camera = null;
        this.isCameraSet = false;
    }

    setCamera(camera) {
        this.camera = camera;
        this.isCameraSet = true;
    }

    loadImages(imageFiles) {
        const loader = new ImageLoader(imageFiles);
        loader.load().then((names) => {
            this.images = Object.assign(this.images, loader.images);
            this.isImagesLoaded = true;
            // console.log(names);
        })
    }

    createCanvas(width, height) {
        let canvas = document.getElementById('canvas');

        if(canvas === undefined || canvas === null) {
            canvas = canvasWrapper.createElement('canvas');   
        }

        canvas.width = width;
        canvas.height = height;

        return canvas;
    }

    createMap(name, mapData, tileset) {
        const mapImage = document.createElement('canvas');
        mapImage.width = mapData.width * mapData.tilewidth;
        mapImage.height = mapData.height * mapData.tileheight;
        
        const mapContext = mapImage.getContext('2d');
        const hitboxes = [];
        let row, col;
        mapData.layers.forEach(layer => {
            if(layer.type === 'tilelayer') {
                row = 0;
                col = 0;
                layer.data.forEach(index => {
                    if(index > 0) {
                        mapContext.drawImage(this.images[tileset.imageName],
                            tileset.getSourceX(index), tileset.getSourceY(index),
                            mapData.tilewidth, mapData.tileheight,
                            col * mapData.tilewidth, row * mapData.tileheight,
                            mapData.tilewidth, mapData.tileheight);
                    }
                    col++;
                    if(col > (mapData.width - 1)) {
                        col = 0;
                        row++;
                    }
                });
            }
            if(layer.type == "objectgroup") {
                hitboxes.push(...layer.objects.map(obj => ({x1: obj.x, x2: obj.x + obj.width, y1: obj.y, y2: obj.y + obj.height})));
            }
        });

        this.images[name] = mapImage;
        return new TileMap({
            imageName: name,
            sourceX: 0,
            sourceY: 0,
            width: mapImage.width,
            height: mapImage.height,
            hitboxes: hitboxes
        });
    }

    fill(color) {
        this.context.fillStyle = color;
        this.context.fillRect(0,0,this.width,this.height);
    }

    print(x, y, text) {
        this.context.fillStyle = 'red';
        this.context.font = '22px Georgia';
        this.context.fillText(text, x, y);
    }

    drawImage(x, y, imageName) {
        this.context.drawImage(this.images[imageName], x, y);
    }

    drawSprite(sprite) {

        let spriteX = sprite.x;
        let spriteY = sprite.y;

        if(this.isCameraSet) {
            spriteX -= this.camera.x;
            spriteY -= this.camera.y;
        }

        if(
            (spriteX >= this.width) ||
            (spriteY >= this.height) || 
            ((spriteX + sprite.width) <= 0) ||
            ((spriteY + sprite.height) <= 0)
        ) {
            return;
        }

        let sourceX = sprite.sourceX + Math.abs(Math.min(0, spriteX));
        let sourceY = sprite.sourceY + Math.abs(Math.min(0, spriteY));
        let width = Math.min(this.width, spriteX + sprite.width) - Math.max(0, spriteX);
        let height = Math.min(this.height, spriteY + sprite.height) - Math.max(0, spriteY);

        this.context.drawImage(this.images[sprite.imageName],
            sourceX, 
            sourceY, 
            width, 
            height,
            Math.max(0, spriteX), 
            Math.max(0, spriteY), 
            width, 
            height);
    }

    screenSizes = {
        defineWidth() {
            let width = document.body.clientWidth;

            // if(width < ...) {
            //     // ...
            // }

            return width;
        },

        defineHeight() {
            let height = document.body.clientHeight;

            // if(height < ...) {
            //     // ...
            // }

            return height;
        }
    }
}



class Game {
    constructor() {
        this.screen = new Screen();
        this.screen.loadImages({
            player: 'img/player.png',
            title: 'img/title_test.jpg',
            tiles: 'img/map_tiles.png'
        });
        this.control = new ControlState();
        this.scenes = {
            loading: new Loading(this),
            menu: new Menu(this),
            gameLevel: new GameLevel(this)
        };
        this.currentScene = this.scenes.loading;
        this.currentScene.init();
    }

    changeScene(status) {
        switch (status) {
            case Scene.LOADED:
                return this.scenes.menu;
            case Scene.GAME_START:
                return this.scenes.gameLevel;
            default:
                return this.scenes.menu;
        }
    }

    frame(time) {
        if(this.currentScene.status !== Scene.WORKING){
            this.currentScene = this.changeScene(this.currentScene.status);
            this.currentScene.init();
        }
        this.currentScene.render(time);
        requestAnimationFrame(time => this.frame(time));
    }

    run() {
        requestAnimationFrame(time => this.frame(time));
    }
}



// — Running the game after window loading.
window.onload = () => {
    const game = new Game();
    game.run();
};
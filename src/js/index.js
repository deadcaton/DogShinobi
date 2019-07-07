'use strict'



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
            console.log(this);
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
    }

    init() {
        super.init();
    }

    render(time) {
        this.game.screen.fill('orange');
        super.render(time);
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
    }

    loadImages(imageFiles) {
        const loader = new ImageLoader(imageFiles);
        loader.load().then((names) => {
            this.images = Object.assign(this.images, loader.images);
            this.isImagesLoaded = true;
            console.log(names);
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
            player: 'img/player_test.gif',
            title: 'img/title_test.jpg'
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
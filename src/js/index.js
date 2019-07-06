'use strict'



class Scene {
    constructor(game) {
        this.game = game;
    }

    init() {
        this.isActive = true;
    }

    render(time) {

    }
}



class Loading extends Scene {
    constructor(game) {
        super(game);
        this.nextScene = 'menu';
    }

    render(time){
        this.game.screen.fill('#eee');
        super.render(time);
    }
}



class Screen {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = this.createCanvas();
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext('2d');
    }

    createCanvas(){
        let canvasWrapper = document.getElementById('canvasWrapper'),
        canvas = canvasWrapper.getElementsByClassName('Canvas')[0];

        if(canvas !== undefined) {
            return canvas;
        }

        let newCanvas = canvasWrapper.createElement('canvas');
        return newCanvas;
    }

    fill(color) {
        this.context.fillStyle = color;
        this.context.fillRect(0,0,this.width,this.height);
    }
}



class Game {
    constructor() {
        this.screen = new Screen(document.body.clientWidth, document.body.clientHeight);
        this.scenes = {
            loading: new Loading(this)
        };
        this.currentScene = this.scenes.loading;
        this.currentScene.init();
    }

    frame(time) {
        if(!this.currentScene.isActive){
            this.currentScene = this.scenes[this.currentScene.nextScene];
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
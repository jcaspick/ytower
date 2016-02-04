var yTower = yTower || {};

yTower.PreloadState = {
 
    preload: function(){
        
        // load images
        
        this.load.spritesheet("player", "assets/img/jumper.png", 40, 60, 10);
        this.load.image("platform", "assets/img/platform.png");
        this.load.image("cap", "assets/img/cap2.png");
        this.load.image("border", "assets/img/border.png");
        this.load.image("bg", "assets/img/bgbricks.png");
        
        this.load.image("logo", "assets/img/yTowerLogo.png");
        
        this.load.image("jumpBG", "assets/img/jumpBarBG.png");
        this.load.image("jumpMeter", "assets/img/jumpBarFill.png");
        this.load.image("dJumpBG", "assets/img/dJumpBarBG.png");
        this.load.image("dJumpMeter", "assets/img/dJumpBarFill.png");
        this.load.image("flipBG", "assets/img/flipBarBG.png");
        this.load.image("flipMeter", "assets/img/flipBarFill.png");
        
        // load level data file
        
        this.load.text("levels", "assets/data/levels.json");
        
        // load custom fonts
        
        this.load.bitmapFont("menuFont", "assets/fonts/yTowerMenuTall.png", "assets/fonts/yTowerMenuTall.xml");
        this.load.bitmapFont("UIbig", "assets/fonts/UIbig.png", "assets/fonts/UIbig.xml");
        this.load.bitmapFont("UIsmall", "assets/fonts/UIsmall.png", "assets/fonts/UIsmall.xml");
        
    },
    
    create: function(){
        console.log("preloaded");
        this.game.state.start("MenuState");
    }
    
}
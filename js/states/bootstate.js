var yTower = yTower || {};

yTower.BootState = {
    
    // screen size settings
    
    init:function(){
        //this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
    },
    
    create:function(){
        console.log("booted");
        this.game.state.start("PreloadState");
    }
    
}
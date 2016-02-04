var yTower = yTower || {};

yTower.MenuState = {
    
    init: function(deathData){
        
        if(deathData){
            this.previousPlatforms = deathData.platformData;
            this.currentLevel = deathData.levelReached;
        } else {
            this.currentLevel = 0;   
            this.previousPlatforms = false;
        }
    },
    
    create: function(){
        
        this.MENU_SCROLL_SPEED = 40;
        this.X_BORDERS = 8;
        this.CAP_OFFSET = 12;
        this.PLATFORM_OFFSET = 12;
        
        // reset world bounds
        
        this.game.world.setBounds(0,0,this.game.width,this.game.height);
        
        // level data for background colours
        
        this.levelData = JSON.parse(this.game.cache.getText("levels"));
        this.levels = this.levelData.levels;
        
        this.platformSizeMin = this.levels[this.currentLevel].sizeMin;
        this.platformSizeMax = this.levels[this.currentLevel].sizeMax;
        this.platformSpacingMin = this.levels[this.currentLevel].spacingMin;
        this.platformSpacingMax = this.levels[this.currentLevel].spacingMax;
        
        this.platformTint = parseInt(this.levels[this.currentLevel].tint.replace(/^#/,""), 16);
        this.bgTint = parseInt(this.levels[this.currentLevel].bgTint.replace(/^#/,""), 16);
        
        // scrolling background
        
        this.bgBricks = this.add.tileSprite(0, 0, this.game.width, this.game.height, "bg");
        this.bgBricks.tint = this.bgTint;
        this.bgBricks.autoScroll(0, this.MENU_SCROLL_SPEED/2);
        
        this.platforms = this.add.group(); // creating the groups here so they are above the bricks and behind the walls
        this.platformCaps = this.add.group();
        this.platforms.enableBody = true;
        this.platformCaps.enableBody = true;
        
        this.leftXBorder = this.add.tileSprite(0, 0, this.X_BORDERS, this.game.height, "border");
        this.leftXBorder.tint = this.platformTint;
        this.leftXBorder.autoScroll(0, this.MENU_SCROLL_SPEED);
        
        this.rightXBorder = this.add.tileSprite(this.game.width-this.X_BORDERS, 0, this.X_BORDERS, this.game.height, "border");
        this.rightXBorder.tint = this.platformTint;
        this.rightXBorder.tilePosition.y = 8;
        this.rightXBorder.autoScroll(0, this.MENU_SCROLL_SPEED);
        
        // platforms

        if(this.previousPlatforms){
            
            // this bit of code will recreate the platform arrangement from when the player died
            // using an array of data collected an passed to the init function
            // it also keeps track of which of these platforms was the highest
            // so it can calculate the nextPlatform variable from that height
            
            this.highestPlatform = this.game.height;
            
            this.previousPlatforms.forEach(function(data){
                this.highestPlatform = Math.min(this.highestPlatform, data.y);
                this.addPlatform(data);
            }, this);
            
            this.nextPlatform = this.highestPlatform -= this.rnd.integerInRange(this.platformSpacingMin, this.platformSpacingMax);
            
        } else {
            
            this.nextPlatform = this.game.height;
            
            while(this.nextPlatform >= 0){
                
                this.newPlatformSize = this.rnd.integerInRange(this.platformSizeMin, this.platformSizeMax);

                this.platformParams = {
                    size: this.newPlatformSize,
                    x: this.rnd.integerInRange(this.X_BORDERS, this.game.width-this.X_BORDERS-this.newPlatformSize),
                    y: this.nextPlatform - this.PLATFORM_OFFSET
                };

                this.addPlatform(this.platformParams);
                this.nextPlatform -= this.rnd.integerInRange(this.platformSpacingMin, this.platformSpacingMax);
                
            }
                
        }
        
        this.menuScroll = 0;
        
        // because I don't want my lines to be so long  ;)
        
        this.mX = Math.round(this.game.width/2);
        this.mY = Math.round(this.game.height/2);
        
        // text
        
        this.menuText = this.add.group();
        
        this.logo = this.add.sprite(this.mX, this.mY-160, "logo");
        this.logo.anchor.setTo(0.5);
        this.menuText.add(this.logo);
        
        this.instructions1 = this.add.bitmapText(this.mX, this.mY-20, "menuFont", "click - jump", 16);
        this.instructions1.anchor.setTo(0.5, 0);
        this.menuText.add(this.instructions1);
        this.instructions2 = this.add.bitmapText(this.mX, this.mY+20, "menuFont", "hold - jump higher", 16);
        this.instructions2.anchor.setTo(0.5, 0);
        this.menuText.add(this.instructions2);
        this.instructions3 = this.add.bitmapText(this.mX, this.mY+60, "menuFont", "'A' in midair - double jump", 16);
        this.instructions3.anchor.setTo(0.5, 0);
        this.menuText.add(this.instructions3);
        this.instructions4 = this.add.bitmapText(this.mX, this.mY+100, "menuFont", "'S' - change direction", 16);
        this.instructions4.anchor.setTo(0.5, 0);
        this.menuText.add(this.instructions4);
        
        this.clickToStart = this.add.bitmapText(this.mX, this.mY+180, "menuFont", "-= CLICK TO START =-", 16);
        this.clickToStart.anchor.setTo(0.5, 0);
        this.menuText.add(this.clickToStart);
        
        this.menuText.alpha = 0;
        
        // fade text in
        
        this.menuFadeIn = this.game.add.tween(this.menuText);
        this.menuFadeIn.to({alpha: 1}, 1000);
        this.menuFadeIn.start();
        
        // add function to start game
        
        this.game.input.onDown.add(function(){
            this.game.state.start("GameState");
        }, this);
    },
    
    update: function(){
        
        if(this.menuScroll <= this.nextPlatform){
            
            // create a platform and decide when the next one should appear
    
            this.addPlatform(this.newPlatformParams());
            this.nextPlatform -= this.rnd.integerInRange(this.platformSpacingMin, this.platformSpacingMax);
            
        }
        
        this.killPlatforms();
        
        this.menuScroll -= this.MENU_SCROLL_SPEED/50;
        
    },
        
    addPlatform: function(params){
        
        // very similar to addPlatform from the GameState
        // except that it disregards some physics things and gives them a velocity
        
        // get a dead platform from the pool
        
        this.newPlatform = this.platforms.getFirstExists(false);
        
        // if there are none in the platform pool create a new sprite
        // else reset the dead platform in its new position and change its size
        
        if(!this.newPlatform){
            this.newPlatform = this.platforms.create(params.x, params.y, "platform");
        } else {
            this.newPlatform.reset(params.x, params.y);
        }
        
        this.newPlatform.scale.setTo(params.size, 1);
        this.newPlatform.tint = this.platformTint;
        
        this.newPlatform.body.velocity.y = this.MENU_SCROLL_SPEED;
        this.newPlatform.body.allowGravity = false;
        
        // the process is repeated twice to create the two end caps of the platform
        
        // LEFT CAP
        this.newPlatformCapL = this.platformCaps.getFirstExists(false);
        
        if(!this.newPlatformCapL){
            this.newPlatformCapL = this.platformCaps.create(params.x-this.CAP_OFFSET, params.y, "cap");
        } else {
            this.newPlatformCapL.reset(params.x-this.CAP_OFFSET, params.y);
        }
        
        this.newPlatformCapL.scale.setTo(1, 1);
        this.newPlatformCapL.tint = this.platformTint;
        
        this.newPlatformCapL.body.velocity.y = this.MENU_SCROLL_SPEED;
        this.newPlatformCapL.body.allowGravity = false;
        
        // RIGHT CAP
        this.newPlatformCapR = this.platformCaps.getFirstExists(false);
        
        if(!this.newPlatformCapR){
            this.newPlatformCapR = this.platformCaps.create(params.x+params.size+this.CAP_OFFSET, params.y, "cap");
        } else {
            this.newPlatformCapR.reset(params.x+params.size+this.CAP_OFFSET, params.y);
        }
        
        this.newPlatformCapR.scale.setTo(-1, 1);
        this.newPlatformCapR.tint = this.platformTint;
        
        this.newPlatformCapR.body.velocity.y = this.MENU_SCROLL_SPEED;
        this.newPlatformCapR.body.allowGravity = false;
        
    },
        
    newPlatformParams: function(){
        
        // similar to GameState, but starts all platforms at 0 - offset, doesn't scroll with world
        
        this.newPlatformSize = this.rnd.integerInRange(this.platformSizeMin, this.platformSizeMax);

        this.platformParams = {
            size: this.newPlatformSize,
            x: this.rnd.integerInRange(this.X_BORDERS, this.game.width-this.X_BORDERS-this.newPlatformSize),
            y: 0 - this.PLATFORM_OFFSET
        };
        
        return this.platformParams;
        
    },
    
    killPlatforms: function(){
        
        // identical to the GameState function but without the scrolling world calculation
        // ie it only looks for platforms below the game height, doesn't add scroll distance
        
        this.platforms.forEach(function(platform){
            if(platform.y > this.game.height){
                platform.kill();   
            }
        }, this);
        this.platformCaps.forEach(function(cap){
            if(cap.y > this.game.height){
                cap.kill();   
            }
        }, this);
        
    }
}
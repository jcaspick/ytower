var yTower = yTower || {};

yTower.GameState = {
    
    // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ CORE PHASER FUNCTIONS $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    
    /* INITIATE */
    
    init: function(){
        
        // game constants
        
        this.SCROLL_ZONE = 250; // how close to the top of the screen can the player get before it scrolls
        this.X_BORDERS = 8; // dead space on either side of the game
        this.PLATFORM_OFFSET = 12; // the height of the platform sprite
        this.CAP_OFFSET = 12; // the width of the platform caps
        this.PLAYER_OFFSET = 12; // width of the player sprite for wall bouncing purposes
        this.WALK_SPEED = 130;
        this.JUMP_MAX = 450;
        this.JUMP_MIN = 250;
        this.JUMP_CHARGE_TIME = 260;
        this.JUMP_FADE_TIME = 500;
        this.GRAVITY = 780;
        this.FLIP_CHARGE_TIME = 10000;
        this.DOUBLEJUMP_CHARGE_TIME = 10000;
        this.DOUBLEJUMP_POWER = 565;
        
        // key variables
        
        this.Y_DIST = 0;
        
        //physics
        
        this.game.physics.startSystem(Phaser.Physics.ARCADE); 
        this.game.physics.arcade.gravity.y = this.GRAVITY;
        
        // world bounds
        
        this.game.world.setBounds(0,0,this.game.width,this.game.height);
    },
    
    /* CREATE */
    
    create: function(){
        
        //$$$$$$$$$$$$ PARSE LEVEL DATA $$$$$$$$$$$$$$$$$$$$$$$
        
        this.levelData = JSON.parse(this.game.cache.getText("levels"));
        this.levels = this.levelData.levels;
        
        this.currentLevel = 0;
        this.updateLevel();
        this.pendingColourChange = 0; // normally this is set to some value by updateLevel but we need it to be false for the first level
        
        this.cameraDist = 0;
        
        // background
        
        this.bgBricks = this.add.tileSprite(0, 0, this.game.width, this.game.height, "bg");
        this.bgBricks.fixedToCamera = true;
        this.bgBricks.tint = this.bgTint;
        
        //$$$$$$$$$$ PLAYER $$$$$$$$$$$$$
        
        this.player = this.add.sprite(this.game.world.centerX, this.game.height-36, "player", 1);
        this.player.anchor.setTo(0.5, 1);
        this.player.animations.add("walk", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 30, true);
        this.player.play("walk");
        
        // track the height the player has climbed for infinite world purposes
        
        this.player.npp = {yOrig: this.player.y, yDist: 0, onPlatform: true};
        this.player.jumpCharge = 0;
        this.player.flipCharge = 100;
        this.player.doubleJumpCharge = 100;
        
        // fly up through platforms by disabling collisions other than down
        
        this.game.physics.arcade.enable(this.player);
        this.player.body.allowGravity = true;
        this.player.body.checkCollision.up = false;
        this.player.body.checkCollision.left = false;
        this.player.body.checkCollision.right = false;
        
        // start the player moving
        
        this.player.body.velocity.x = this.WALK_SPEED;
        this.pendingJump = false;
        
        //$$$$$$$$$$$ PLATFORMS $$$$$$$$$$$$$
        
        // platforms are made of a single pixel wide sprite which is scaled to length and two end cap sprites
        // there is a separate object pool for platforms and caps
        
        this.platforms = this.add.group();
        this.platforms.enableBody = true;
        
        this.platformCaps = this.add.group();
        this.platformCaps.enableBody = true;
        
        //$$$$$$$$$$$ WORLD $$$$$$$$$$$$
        
        // walls of the tower
        
        this.leftXBorder = this.add.tileSprite(0, 0, this.X_BORDERS, this.game.height, "border");
        this.leftXBorder.fixedToCamera = true;
        this.leftXBorder.tint = this.platformTint;
        
        this.rightXBorder = this.add.tileSprite(this.game.width-this.X_BORDERS, 0, this.X_BORDERS, this.game.height, "border");
        this.rightXBorder.fixedToCamera = true;
        this.rightXBorder.tint = this.platformTint;
        
        // ground floor of the tower
        
        this.ground = this.add.sprite(0, this.game.height-36, "platform");
        this.ground.scale.setTo(this.game.width,3);
        
        this.game.physics.arcade.enable(this.ground);
        this.ground.body.allowGravity = false;
        this.ground.body.immovable = true;
        this.ground.tint = this.platformTint;
        
        // fill the screen with platforms
        
        this.nextPlatform = this.game.height - 36 - this.rnd.integerInRange(this.platformSpacingMin, this.platformSpacingMax);
        this.startPlatforms();
        
        //$$$$$$$$$$$$$$$$$$$ UI $$$$$$$$$$$$$$$$
        
        this.UI = this.add.group();
        this.UI.fixedToCamera = true;
        
        this.heightScore = this.add.bitmapText(14, 6, "UIbig", "HEIGHT: 0", 24);
        this.UI.add(this.heightScore);
        
        this.jumpBG = this.add.sprite(14, 28, "jumpBG");
        this.jumpBG.alpha = 0.5;
        this.jumpBG.scale.setTo(184, 1);
        this.UI.add(this.jumpBG);
        this.dJumpBG = this.add.sprite(14, 42, "dJumpBG");
        this.dJumpBG.scale.setTo(184, 1);
        this.dJumpBG.alpha = 0.5;
        this.UI.add(this.dJumpBG);
        this.flipBG = this.add.sprite(14, 56, "flipBG");
        this.flipBG.scale.setTo(184, 1);
        this.flipBG.alpha = 0.5;
        this.UI.add(this.flipBG);
        
        this.jumpFill = this.add.sprite(14, 28, "jumpMeter");
        this.jumpFill.scale.setTo(0, 1);
        this.UI.add(this.jumpFill);
        this.dJumpFill = this.add.sprite(14, 42, "dJumpMeter");
        this.dJumpFill.scale.setTo(0, 1);
        this.UI.add(this.dJumpFill);
        this.flipFill = this.add.sprite(14, 56, "flipMeter");
        this.flipFill.scale.setTo(0, 1);
        this.UI.add(this.flipFill);
        
        this.jumpLabel = this.add.bitmapText(18, 30, "UIsmall", "JUMP", 12);
        this.UI.add(this.jumpLabel);
        this.dJumpLabel = this.add.bitmapText(18, 44, "UIsmall", "DOUBLE-JUMP", 12);
        this.UI.add(this.dJumpLabel);
        this.flipLabel = this.add.bitmapText(18, 58, "UIsmall", "FLIP", 12);
        this.UI.add(this.flipLabel);
        
        //$$$$$$$$$$$$$$$$ CONTROLS $$$$$$$$$$$$$$$$
        
        this.game.input.onDown.add(this.chargeJump, this);
        this.game.input.onUp.add(this.jump, this);
        
        this.flipKey = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.flipKey.onDown.add(this.flip, this);
        
        this.doubleJumpKey = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
        this.doubleJumpKey.onDown.add(this.doubleJump, this);
        
        this.isChargingJump = false;
        
    },
    
    /* UPDATE */
    
    update: function(){
        
        // collision detection
        
        this.game.physics.arcade.collide(this.player, this.ground);
        this.game.physics.arcade.collide(this.player, this.platforms);
        
        // update GUI
        
        this.heightScore.text = "HEIGHT: " + this.Y_DIST;
        
        this.jumpMeterScale = Math.round(184*(this.player.jumpCharge/this.JUMP_MAX));
        this.jumpFill.scale.setTo(this.jumpMeterScale, 1);
        
        this.flipMeterScale = Math.round(184*(this.player.flipCharge/100));
        this.flipFill.scale.setTo(this.flipMeterScale, 1);
        
        this.doubleJumpMeterScale = Math.round(184*(this.player.doubleJumpCharge/100));
        this.dJumpFill.scale.setTo(this.doubleJumpMeterScale, 1);
        
        // the player bounces off the walls of the tower
        
        if(this.player.x >= this.game.width-this.X_BORDERS-this.PLAYER_OFFSET){
            this.player.body.velocity.x = -this.WALK_SPEED;
            this.player.scale.setTo(-1, 1);
        } else if(this.player.x <= this.X_BORDERS+this.PLAYER_OFFSET){
            this.player.body.velocity.x = this.WALK_SPEED;
            this.player.scale.setTo(1, 1);
        }
        
        // keep track of the ground below the player
        
        if(this.player.npp.onPlatform){
            if(!this.player.body.touching.down){          
                // cancel jump if player walks off an edge
                if(this.isChargingJump){
                    this.isChargingJump = false;
                    this.cancelJump();
                }
                this.player.npp.onPlatform = false;
            }
        }
        if(!this.player.npp.onPlatform){
            if(this.player.body.touching.down){
                // resume walking animation
                this.player.play("walk");
                
                // start charging a jump if the pointer was held
                if(this.pendingJump){
                    this.pendingJump = false;
                    this.chargeJump();
                }
                // change background colour if the player lands on a next level platform
                if(this.pendingColourChange){
                    if(this.player.y < this.pendingColourChange){
                        this.bgColourChange(this.bgBricks, this.bgBricks.tint, this.bgTint, 1000);
                        this.bgColourChange(this.leftXBorder, this.leftXBorder.tint, this.platformTint, 1000);
                        this.bgColourChange(this.rightXBorder, this.rightXBorder.tint, this.platformTint, 1000);
                    }
                }
                this.player.npp.onPlatform = true;
            }
        }

        // check if the player is dead
        
        if(this.player.y > this.cameraDist+this.game.height+50){
            
            // after a brief pause run the gameOver function
            
            this.UIFadeOut = this.game.add.tween(this.UI);
            this.UIFadeOut.to({alpha: 0}, 150);
            this.UIFadeOut.start();

            this.game.time.events.add(500, this.gameOver, this);
            
        }
        
        this.worldScroll(); // scroll the world upwards as the player climbs
        this.killPlatforms(); // kill platforms that are off the screen
        
        // create new platforms if needed
        
        if(this.cameraDist <= this.nextPlatform){
            
            // create a platform and decide when the next one should appear
    
            this.addPlatform(this.newPlatformParams());
            this.nextPlatform -= this.rnd.integerInRange(this.platformSpacingMin, this.platformSpacingMax);
            
        }
        
        // scroll tilesprites
        
        this.leftXBorder.tilePosition.y = -this.cameraDist;
        this.rightXBorder.tilePosition.y = -this.cameraDist+8;
        this.bgBricks.tilePosition.y = -this.cameraDist/2;
        
        // have we advanced to a new level?
        
        if(this.nextLevelAt == -1){
        } else if(this.Y_DIST >= this.nextLevelAt){
            this.updateLevel();
        }
        
    },
    
    
    
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ NON PHASER FUNCTIONS $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    
    
    
    
    worldScroll: function(){
        
        // INFINITE WORLD MAGIC - courtesy of jackrugile of the phaser forums
        // there are 3 basic parts that make this work:
        
        // first we have a variable tracking the vertical progress of the player, it never goes down
        
        this.player.npp.yDist = Math.max(this.player.npp.yDist, Math.abs(this.player.y - this.player.npp.yOrig));
        
        // now, as the player advances the game world "grows" upwards to match
        
        this.world.setBounds(0, -this.player.npp.yDist, this.game.width, this.game.height+this.player.npp.yDist);
        
        // finally, we move the camera upwards when the player rises above the scroll zone
        
        this.cameraDist = Math.min(this.cameraDist, this.player.y - this.SCROLL_ZONE);
        this.game.camera.y = this.cameraDist;
        
        // one last thing is to update the Y_DIST variable which serves as the players score
        
        this.Y_DIST = Math.floor(Math.abs(this.cameraDist)/50);
        
    },
    
    addPlatform: function(params){
        
        // generates a platform given an object with its coordinates and size
        // recycles dead platforms or adds to the pool as needed
        
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
        
        this.newPlatform.body.allowGravity = false;
        this.newPlatform.body.immovable = true;
        
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
        
        this.newPlatformCapL.body.allowGravity = false;
        this.newPlatformCapL.body.immovable = true;
        // RIGHT CAP
        this.newPlatformCapR = this.platformCaps.getFirstExists(false);
        
        if(!this.newPlatformCapR){
            this.newPlatformCapR = this.platformCaps.create(params.x+params.size+this.CAP_OFFSET, params.y, "cap");
        } else {
            this.newPlatformCapR.reset(params.x+params.size+this.CAP_OFFSET, params.y);
        }
        
        this.newPlatformCapR.scale.setTo(-1, 1);
        this.newPlatformCapR.tint = this.platformTint;
        
        this.newPlatformCapR.body.allowGravity = false;
        this.newPlatformCapR.body.immovable = true;
        
    },
    
    killPlatforms: function(){
        
        this.platforms.forEach(function(platform){
            if(platform.y > this.cameraDist+this.game.height){
                platform.kill();   
            }
        }, this);
        this.platformCaps.forEach(function(cap){
            if(cap.y > this.cameraDist+this.game.height){
                cap.kill();   
            }
        }, this);
        
    },
    
    startPlatforms: function(){
        
        // nextPlatform is set to the height of the game minus a randomly generated number based on the platform spacing rules
        // we keep adding platforms and subtracting such random numbers from nextPlatform until they have reached the top of the screen
        
        while(this.nextPlatform >= 0){

            this.addPlatform(this.newPlatformParams());
            this.nextPlatform -= this.rnd.integerInRange(this.platformSpacingMin, this.platformSpacingMax);
            
        }
    },
    
    newPlatformParams: function(){
        
        // helper function that returns an object with all the parameters of the next platform to be generated
        
        this.newPlatformSize = this.rnd.integerInRange(this.platformSizeMin, this.platformSizeMax);

        this.platformParams = {
            size: this.newPlatformSize,
            x: this.rnd.integerInRange(this.X_BORDERS, this.game.width-this.X_BORDERS-this.newPlatformSize),
            y: this.nextPlatform - this.PLATFORM_OFFSET
        };
        
        return this.platformParams;
        
    },
    
    updateLevel: function(){
        
        // sets platform generation variables according to the level data
        
        this.platformSizeMin = this.levels[this.currentLevel].sizeMin;
        this.platformSizeMax = this.levels[this.currentLevel].sizeMax;
        this.platformSpacingMin = this.levels[this.currentLevel].spacingMin;
        this.platformSpacingMax = this.levels[this.currentLevel].spacingMax;
        
        // hex values are not allowed in JSON so I've stored them as strings
        // this bit of code strips the leading "#" from the string and converts the rest into a hex value that phaser can use for tinting sprites
        
        this.platformTint = parseInt(this.levels[this.currentLevel].tint.replace(/^#/,""), 16);
        this.bgTint = parseInt(this.levels[this.currentLevel].bgTint.replace(/^#/,""), 16);
        
        // advance the level counter
        
        this.currentLevel++;
        
        // we set the height at which the next level will start
        // if there are no more levels we set nextLevelAt to the special value -1 which stops levels from advancing
        
        if(!this.levels[this.currentLevel]){
            this.nextLevelAt = -1;
        } else {
            this.nextLevelAt = this.levels[this.currentLevel].startsAt;
            // the background colour changes when the player steps on the first new coloured platform
            // this variable keeps track of whether or not there is a colour change pending and at what height
            this.pendingColourChange = this.cameraDist;
        }
    },
    
    chargeJump: function(){
        
        // only allow a jump to charge if the player is on a platform and not already charging a jump somehow
        
        if(!this.player.body.touching.down || this.isChargingJump == true){
            this.pendingJump = true; // allow a jump to start charging upon landing if the button is held
            return false;   
        }
        
        this.isChargingJump = true;
        
        // create two tweens which loop back and forth to specify the rate that the jump meter oscillates when the mouse is held
        
        this.jumpChargeUp = this.game.add.tween(this.player);
        this.jumpChargeUp.to({jumpCharge:this.JUMP_MAX}, this.JUMP_CHARGE_TIME);
        this.jumpChargeUp.easing(Phaser.Easing.Quadratic.In);
        
        this.jumpChargeDown = this.game.add.tween(this.player);
        this.jumpChargeDown.to({jumpCharge:0}, this.JUMP_FADE_TIME);
        
        // the tweens start each other in their callback functions to make a loop
        
        this.jumpChargeUp.onComplete.add(function(){
            this.jumpChargeDown.start();
        }, this);
        this.jumpChargeDown.onComplete.add(function(){
            this.jumpChargeUp.start();
        }, this);
        
        // start the up tween
        
        this.jumpChargeUp.start();
        
    },
    
    jump: function(){
        
        this.pendingJump = false;
        
        // only complete a jump if the player is touching ground and is actually charging a jump
        // without the second part the player can walk off the edge, cancel a charge, but still jump after landing on another platform
        
        if(!this.player.body.touching.down || !this.isChargingJump){
            return false;   
        }
        
        this.player.body.velocity.y = -this.JUMP_MIN - this.player.jumpCharge;
        this.player.jumpCharge = 0;
        
        // hold single animation frame when airborne
        
        this.player.animations.stop();
        this.player.frame = 9;
        
    },
    
    cancelJump: function(){
        
        // cancels the currently active tween and sets the jump charge to zero
    
        if(this.jumpChargeUp.isRunning){
            this.jumpChargeUp.stop();
        }
        if(this.jumpChargeDown.isRunning){
            this.jumpChargeDown.stop();
        }
        this.player.jumpCharge = 0;
        
    },
    
    flip: function(){
        
        if(this.player.flipCharge < 100){
            return false;
        }
        
        this.player.body.velocity.x = - this.player.body.velocity.x;
        this.player.scale.x = -this.player.scale.x;
        
        this.player.flipCharge = 0;
        
        this.flipChargeUp = this.game.add.tween(this.player);
        this.flipChargeUp.to({flipCharge:100}, this.FLIP_CHARGE_TIME);
        this.flipChargeUp.start();
        
    },
    
    doubleJump: function(){
        
        if(this.player.body.touching.down || this.player.doubleJumpCharge < 100){
            return false;
        }
        
        this.player.body.velocity.y = -this.DOUBLEJUMP_POWER;
        
        this.player.doubleJumpCharge = 0;
        
        this.doubleJumpChargeUp = this.game.add.tween(this.player);
        this.doubleJumpChargeUp.to({doubleJumpCharge:100}, this.DOUBLEJUMP_CHARGE_TIME);
        this.doubleJumpChargeUp.start();
        
    },
    
    bgColourChange: function(obj, startColour, endColour, time){
        // a function for tweening the tint of a sprite
        // thanks to lewster32 of the Phaser forums
        
        // create a dummy object to apply the tween to
        var colourBlend = {step:0};
        
        // add a tween to this object to increase the step property
        var colourTween = this.game.add.tween(colourBlend).to({step: 100}, time);
        
        // we add an update callback to the tween which runs Phaser's interpolateColor method for each update of the tween
        colourTween.onUpdateCallback(function(){
            obj.tint = Phaser.Color.interpolateColor(startColour, endColour, 110, 10*(Math.ceil(colourBlend.step/10)));
        });
        
        colourTween.onComplete.add(function(){
            obj.tint = endColour;
        });
        
        // set the obj to the start colour
        obj.tint = startColour;
        
        // start the tween
        colourTween.start();
    },
    
    gameOver: function(){
            
        this.deathData = {
            platformData: [],
            levelReached: this.currentLevel-1
        };

        this.platforms.forEachAlive(function(platform){
            this.deathData.platformData.push({x: platform.x, y: Math.round(platform.y-this.cameraDist), size: platform.scale.x});
        }, this);

        this.game.state.start("MenuState", true, false, this.deathData);  
        
    }
    
    //$$$$$$$$$$$$$$$$$$$$$$ SWIPE CONTROLS $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    
    /*
    beginSwipe: function(){
        this.startX = game.input.x;
    },
    
    endSwipe: function(){
           
    }
    */
}
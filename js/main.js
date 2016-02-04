var yTower = yTower || {};

yTower.game = new Phaser.Game(320, 600, Phaser.AUTO);

yTower.game.state.add("BootState", yTower.BootState);
yTower.game.state.add("PreloadState", yTower.PreloadState);
yTower.game.state.add("MenuState", yTower.MenuState);
yTower.game.state.add("GameState", yTower.GameState);

yTower.game.state.start("BootState");
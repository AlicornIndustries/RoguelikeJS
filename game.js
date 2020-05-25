// Wrap code in Game object to avoid cluttering namespace
var Game = {
    display: null,
    map: {},
    engine: null,
    player: null,

    init:function() {
        this.display = new ROT.Display();
        document.body.appendChild(this.display.getContainer());
        this._generateMap();

        var scheduler = new ROT.Scheduler.Simple(); //Rotate through all dudes on the schedule
        scheduler.add(this.player, true);
        this.engine = new ROT.Engine(scheduler);
        this.engine.start();
    },

    _generateMap: function() {
        var digger = new ROT.Map.Digger();
        var freeCells = []; // will be the non-wall cells. 1D array, stores x,y pair
        var digCallback = function(x,y,value) {
            if(value) {return;} // do not store walls

            var key = x+","+y;
            this.map[key] = "."; // For now, the map is just "." for floor and nothing elsewhere
            freeCells.push(key);
        }
        digger.create(digCallback.bind(this));
        this._drawMap();
        this._createPlayer(freeCells);
    },

    _createPlayer: function(freeCells) {
        var index = Math.floor(ROT.RNG.getUniform() * freeCells.length); // Choose a random freeCell
        var key = freeCells.splice(index, 1)[0];
        var parts = key.split(",");
        var x = parseInt(parts[0]);
        var y = parseInt(parts[1]);
        this.player = new Player(x,y,12); 
    },

    _drawMap: function() {
    // Iterate through all floor tiles and draw them
        for (var key in this.map) {
            var parts = key.split(",");
            var x = parseInt(parts[0]);
            var y = parseInt(parts[1]);
            this.display.draw(x,y,this.map[key]);
        }
    }
}

var Player = function(x, y, healthMax) {
    this._x = x;
    this._y = y;
    this._healthMax = healthMax;
    this._healthCurrent = this._healthMax;
    this._draw();
}

Player.prototype.act = function() {
    // Any JS object with act method is an actor for ROT.js's scheduler
    // act() is called by engine whenever it's that actor's "turn"
    Game.engine.lock(); // Wait for user input
    window.addEventListener("keydown", this); // On keydown, call the handleEvent method of this (Player.handleEvent) (uncommon way to assign event handlers)

}

Player.prototype.handleEvent = function(e) {
    // Process user input. Called on keydown by Player.prototype.act()'s event listener
    var keyMap = {};
    // Numpad keys (Top is 0 (aka the 8 key), going clockwise)
    keyMap[38] = 0;keyMap[33] = 1;keyMap[39] = 2;keyMap[34] = 3;keyMap[40] = 4;keyMap[35] = 5;keyMap[37] = 6;keyMap[36] = 7;

    var code = e.keyCode; // the button pressed by the user

    // Validate user input: is the key in the keymap?
    if(!(code in keyMap)) {return;}
    // Now check if the player can move in that direction
    var diff = ROT.DIRS[8][keyMap[code]]; // x,y coords of the move (e.g. 6 on the numpad is (0,1)
    var newX = this._x + diff[0];
    var newY = this._y + diff[1];

    var newKey = newX+","+newY; // Key as in map key.
    if(!(newKey in Game.map)) {return;} // can't move off the map // NOTE: Doesn't handle walls that are part of the map. Will have to be redone if we move to a proper system with walls as separate tiles

    Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]); // First clear the location player used to be
    this._x = newX;
    this._y = newY;
    this._draw();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
}

Player.prototype._draw = function() {
    Game.display.draw(this._x, this._y, "@", "#ff0");
}
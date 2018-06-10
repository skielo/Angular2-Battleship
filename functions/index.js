"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var functions = require("firebase-functions");
var _boardSize = 7, _numShips = 3;
exports.command = functions.database.ref('/commands/{uid}/{cmd_id}').onWrite(function (snapshot, context) {
    var uid = context.params.uid;
    var cmd_id = context.params.cmd_id;
    var bs = new BattleshipServer();
    console.log("data: ", snapshot.after.val());
    if (!snapshot.after.exists()) {
        return Promise.reject("command was deleted " + cmd_id);
    }
    var command = snapshot.after.val();
    var cmd_name = command.command;
    console.log("command " + cmd_name + " uid=" + uid + " cmd_id=" + cmd_id);
    var root = snapshot.after.ref.root;
    var pr_cmd;
    switch (cmd_name) {
        case 'play':
            pr_cmd = bs.match(root, uid);
            break;
        case 'move':
            pr_cmd = bs.move(root, uid, command);
            break;
        case 'checkin':
            //pr_cmd = checkin(root, uid)
            break;
        default:
            console.log("Unknown command: " + cmd_name);
            pr_cmd = Promise.reject("Unknown command");
            break;
    }
    var pr_remove = snapshot.after.ref.remove();
    return Promise.all([pr_cmd, pr_remove]);
});
var BattleshipServer = /** @class */ (function () {
    function BattleshipServer() {
    }
    /**
    *
    * @param {admin.database.Reference} root
    * @param {string} uid
    * @type {Promise}
    */
    BattleshipServer.prototype.match = function (root, uid) {
        var _this = this;
        var p1uid, p2uid;
        return root.child('queue').transaction(function (data) {
            if (data === null) {
                console.log(uid + " waiting for match");
                return { uid: uid };
            }
            else {
                p1uid = data.uid;
                p2uid = uid;
                if (p1uid === p2uid) {
                    console.log(p1uid + " tried to match with self!");
                    return;
                }
                else {
                    console.log("matched " + p1uid + " with " + p2uid);
                    return {};
                }
            }
        }, function (error, committed, snapshot) {
            if (error) {
                throw error;
            }
            else {
                return {
                    committed: committed,
                    snapshot: snapshot
                };
            }
        }, false).then(function (result) {
            var matching = result.snapshot.val();
            if (matching && matching.uid) {
                return root.child("player_states/" + uid).set({
                    matching: true
                });
            }
            else {
                // Create a new game state object and push it under /games
                var now = new Date().getTime();
                var ref_game = root.child("games").push();
                var pr_game = ref_game.set(new Game(p1uid, p2uid, p1uid, now, now, _this.generateShipLocations(), _this.generateShipLocations()));
                var game_id = ref_game.key;
                console.log("starting game " + game_id + " with p1uid: " + p1uid + ", p2uid: " + p2uid);
                var pr_state1 = root.child("player_states/" + p1uid).set(new PlayerState(game_id, "It's your turn! Make a move!"));
                var pr_state2 = root.child("player_states/" + p2uid).set(new PlayerState(game_id, "Waiting for other player..."));
                return Promise.all([pr_game, pr_state1, pr_state2]);
            }
        });
    };
    BattleshipServer.prototype.generateShipLocations = function () {
        var locations = [];
        var ships = new Array();
        var hits = ["", "", ""];
        for (var i = 0; i < _numShips; i++) {
            do {
                locations = this.generateShip();
            } while (this.collision(locations, ships));
            ships.push(new Ship(hits, locations));
        }
        return ships;
    };
    BattleshipServer.prototype.generateShip = function () {
        var direction = Math.floor(Math.random() * 2);
        var row, col = 0;
        if (direction === 1) { // horizontal
            row = Math.floor(Math.random() * _boardSize);
            col = Math.floor(Math.random() * (_boardSize - 3 + 1));
        }
        else { // vertical
            row = Math.floor(Math.random() * (_boardSize - 3 + 1));
            col = Math.floor(Math.random() * _boardSize);
        }
        var newShipLocations = [];
        for (var i = 0; i < 3; i++) {
            if (direction === 1) {
                newShipLocations.push(row + "" + (col + i));
            }
            else {
                newShipLocations.push((row + i) + "" + col);
            }
        }
        return newShipLocations;
    };
    BattleshipServer.prototype.collision = function (locations, ships) {
        var retval = false;
        ships.forEach(function (ship) {
            locations.forEach(function (loc) {
                if (ship.locations.indexOf(loc) >= 0)
                    retval = true;
            });
        });
        return retval;
    };
    BattleshipServer.prototype.move = function (root, uid, command) {
        var _this = this;
        /*const x = parseInt(command.x)
        const y = parseInt(command.y)
        if (x < 0 || x > 2 || y < 0 || y > 2) {
        throw new Error("That move is out of bounds!")
        }*/
        var ref_self_state = root.child("player_states/" + uid);
        var self_state;
        return ref_self_state.once("value").then(function (snap) {
            self_state = snap.val();
            if (self_state && self_state.game) {
                console.log("command pos: ", command.data[0].position);
                return _this.transactMove(root, uid, self_state.game, command.data[0].position);
            }
            else {
                throw new Error("You're not in a game");
            }
        }).catch(function (reason) {
            console.log("Move failed");
            console.log(reason);
            return ref_self_state.update({
                message: reason.message
            });
        });
    };
    BattleshipServer.prototype.transactMove = function (root, uid, game_id, position) {
        var _this = this;
        var move_error;
        root.child("games/" + game_id).transaction(function (game_state) {
            console.log("transactMove");
            console.log(game_state);
            if (game_state == null) {
                return null;
            }
            try {
                return _this.checkAndApplyMove(root, uid, game_state, position);
            }
            catch (error) {
                move_error = error;
                return;
            }
        }, function (error, committed, snapshot) {
            console.log("transactMove end");
            if (error) {
                console.log(error);
                throw error;
            }
            else if (!committed) {
                console.log("Not committed, move error");
                console.log(move_error);
                return root.child("player_states/" + uid).update({
                    message: move_error.message
                });
            }
            else {
                console.log("Committed move");
                return {
                    committed: committed,
                    snapshot: snapshot
                };
            }
        }, false).then(function (result) {
            if (result.committed) {
                return _this.notifyPlayers(root, uid, result.snapshot.val(), result.snapshot.key);
            }
            else {
                return console.log('transac not commited: ', result);
            }
        });
    };
    BattleshipServer.prototype.checkAndApplyMove = function (root, uid, game_state, position) {
        if (game_state.outcome) {
            throw new Error("Game is over!");
        }
        var p1uid = game_state.p1uid;
        var p2uid = game_state.p2uid;
        var shoot = new Shoot();
        shoot.hasboat = false;
        shoot.attacked = true;
        shoot.position = position;
        if (!game_state[game_state.p1uid + "_attemps"]) {
            game_state[game_state.p1uid + "_attemps"] = [];
        }
        if (!game_state[game_state.p2uid + "_attemps"]) {
            game_state[game_state.p2uid + "_attemps"] = [];
        }
        var pl_ships, pl_num;
        if (uid === p1uid) {
            pl_ships = game_state.p1ships;
            pl_num = 1;
        }
        else if (uid === p2uid) {
            pl_ships = game_state.p2ships;
            pl_num = 2;
        }
        else {
            throw new Error("You're not playing this game!");
        }
        // Check if it's my turn
        var turn = game_state.turn;
        if (uid !== game_state.turn) {
            throw new Error("It's not your turn. Be patient!");
        }
        var ship = this.findShip(pl_ships, position);
        if (ship) {
            var index = pl_ships.indexOf(ship);
            pl_ships[index] = this.hitShip(position, ship);
            if (pl_num == 1) {
                game_state.p1ships = pl_ships;
            }
            else if (pl_num == 2) {
                game_state.p2ships = pl_ships;
            }
            if (this.isSunk(ship)) {
                game_state.message = "You sank my battleship!";
            }
            shoot.hasboat = true;
        }
        else {
            game_state.message = "";
        }
        if (this.isMatchOver(pl_ships)) {
            if (pl_num == 1) {
                game_state.outcome = 'win_p1';
            }
            else if (pl_num == 2) {
                game_state.outcome = 'win_p2';
            }
        }
        else {
            // Other player's turn now
            game_state.turn = pl_num == 1 ? p2uid : p1uid;
        }
        if (pl_num == 1) {
            if (game_state[game_state.p1uid + "_attemps"].find(function (attemp) {
                return attemp.position == position;
            }) == null) {
                game_state[game_state.p1uid + "_attemps"].push(shoot);
            }
        }
        else if (pl_num == 2) {
            if (game_state[game_state.p2uid + "_attemps"].find(function (attemp) {
                return attemp.position == position;
            }) == null) {
                game_state[game_state.p2uid + "_attemps"].push(shoot);
            }
        }
        return game_state;
    };
    BattleshipServer.prototype.findShip = function (ships, boardLocation) {
        return ships.find(function (ship) {
            return ship.locations.find(function (position) {
                return position == boardLocation;
            }) != null;
        });
    };
    BattleshipServer.prototype.isMatchOver = function (ships) {
        var _this = this;
        return ships.every(function (ship) {
            return _this.isSunk(ship);
        });
    };
    BattleshipServer.prototype.isSunk = function (ship) {
        var retval = true;
        ship.hits.forEach(function (attacked) {
            if (attacked != "hit")
                retval = false;
        });
        return retval;
    };
    BattleshipServer.prototype.hitShip = function (position, ship) {
        var index = ship.locations.indexOf(position);
        ship.hits[index] = "hit";
        return ship;
    };
    BattleshipServer.prototype.notifyPlayers = function (root, uid, game_state, game_id) {
        // Figure out what message should be displayed for each player
        var p1_message = "", p2_message = "";
        if (game_state.message) {
            if (game_state.p1uid == uid) {
                p1_message = game_state.message + ", ";
            }
            else if (game_state.p2uid == uid) {
                p2_message = game_state.message + ", ";
            }
        }
        if (game_state.outcome) {
            var outcome = game_state.outcome;
            if (outcome === 'win_p1') {
                p1_message = "You won! Good job!";
                p2_message = "They won! Better luck next time!";
            }
            else if (outcome === 'win_p2') {
                p1_message = "They won! Better luck next time!";
                p2_message = "You won! Good job!";
            }
            else if (outcome === 'tie') {
                p1_message = p2_message = "It's a tie game!";
            }
            else if (outcome == 'forfeit_p1') {
                p1_message = "Looks like you gave up.";
                p2_message = "The other player has apparently quit, so you win!";
            }
            else if (outcome == 'forfeit_p2') {
                p1_message = "The other player has apparently quit, so you win!";
                p2_message = "Looks like you gave up.";
            }
        }
        else {
            if (game_state.turn === game_state.p1uid) {
                p1_message = "It's your turn! Make a move!";
                p2_message += "Waiting for other player...";
            }
            else {
                p1_message += "Waiting for other player...";
                p2_message = "It's your turn! Make a move!";
            }
        }
        if (p1_message && p2_message) {
            var update_p1 = new PlayerState(game_id, p1_message);
            var update_p2 = new PlayerState(game_id, p2_message);
            if (game_state.outcome) {
                update_p1.game = update_p2.game = null;
            }
            // Perform the updates
            // Construct refs to each players' inividual state locations
            // const ref_self_state = root.child(`player_states/${uid}`)
            var ref_p1_state = root.child("player_states/" + game_state.p1uid);
            var ref_p2_state = root.child("player_states/" + game_state.p2uid);
            var pr_update_p1 = ref_p1_state.update(update_p1);
            var pr_update_p2 = ref_p2_state.update(update_p2);
            return Promise.all([pr_update_p1, pr_update_p2]);
        }
        else {
            throw new Error("Unexpected case for notifications");
        }
    };
    return BattleshipServer;
}());
exports.BattleshipServer = BattleshipServer;
var Shoot = /** @class */ (function () {
    function Shoot() {
    }
    return Shoot;
}());
exports.Shoot = Shoot;
var Game = /** @class */ (function () {
    function Game(_p1uid, _p2uid, _turn, _p1checkin, _p2checkin, _p1ships, _p2ships) {
        this.p1uid = _p1uid;
        this.p2uid = _p2uid;
        this.turn = _turn;
        this.p1checkin = _p1checkin;
        this.p2checkin = _p2checkin;
        this.p1ships = _p1ships;
        this.p2ships = _p2ships;
    }
    return Game;
}());
exports.Game = Game;
var Ship = /** @class */ (function () {
    function Ship(_hits, _locations) {
        this.hits = _hits;
        this.locations = _locations;
    }
    return Ship;
}());
exports.Ship = Ship;
var PlayerState = /** @class */ (function () {
    function PlayerState(_game, _message) {
        this.game = _game;
        this.message = _message;
    }
    return PlayerState;
}());
exports.PlayerState = PlayerState;

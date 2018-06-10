import * as functions from "firebase-functions";

const _boardSize = 7,
      _numShips = 3;

export let command = functions.database.ref('/commands/{uid}/{cmd_id}').onWrite((snapshot, context) => {
    const uid = context.params.uid
    const cmd_id = context.params.cmd_id
    let bs = new BattleshipServer()
    console.log("data: ", snapshot.after.val())
    if (!snapshot.after.exists()) {
        return Promise.reject(`command was deleted ${cmd_id}`)
    }

    const command = snapshot.after.val()
    const cmd_name = command.command
    console.log(`command ${cmd_name} uid=${uid} cmd_id=${cmd_id}`)
    const root = snapshot.after.ref.root
    let pr_cmd
    switch (cmd_name) {
        case 'play':
            pr_cmd = bs.match(root, uid)
            break
        case 'move':
            pr_cmd = bs.move(root, uid, command)
            break
        case 'checkin':
            //pr_cmd = checkin(root, uid)
            break
        default:
            console.log(`Unknown command: ${cmd_name}`)
            pr_cmd = Promise.reject("Unknown command")
            break
    }

    const pr_remove = snapshot.after.ref.remove()
    return Promise.all([pr_cmd, pr_remove])
})

export class BattleshipServer {

    /**
    * 
    * @param {admin.database.Reference} root
    * @param {string} uid
    * @type {Promise}
    */
    match(root, uid) {
        let p1uid, p2uid
        return root.child('queue').transaction((data) => {
            if (data === null) {
                console.log(`${uid} waiting for match`)
                return { uid: uid }
            }
            else {
                p1uid = data.uid
                p2uid = uid
                if (p1uid === p2uid) {
                    console.log(`${p1uid} tried to match with self!`)
                    return
                }
                else {
                    console.log(`matched ${p1uid} with ${p2uid}`)
                    return {}
                }
            }
        },
        (error, committed, snapshot) => {
            if (error) {
                throw error
            }
            else {
                return {
                    committed: committed,
                    snapshot: snapshot
                }
            }
        },
        false).then(result => {
            const matching = result.snapshot.val()
            if (matching && matching.uid) {
                return root.child(`player_states/${uid}`).set({
                    matching: true
                })
            }
            else {
                // Create a new game state object and push it under /games
                const now = new Date().getTime()
                const ref_game = root.child("games").push()
                const pr_game = ref_game.set(new Game(p1uid, p2uid, p1uid, now, now,this.generateShipLocations(),this.generateShipLocations()))
                const game_id = ref_game.key
                console.log(`starting game ${game_id} with p1uid: ${p1uid}, p2uid: ${p2uid}`)
                const pr_state1 = root.child(`player_states/${p1uid}`).set(new PlayerState(game_id, "It's your turn! Make a move!"))
                const pr_state2 = root.child(`player_states/${p2uid}`).set(new PlayerState(game_id, "Waiting for other player..."))
                return Promise.all([pr_game, pr_state1, pr_state2])
            }
        })
    }
    
    generateShipLocations() {
        let locations = [];
        let ships = new Array<Ship>();
        let hits = ["","",""];
        for (var i = 0; i < _numShips; i++) {
            do {
                locations = this.generateShip();
            } while (this.collision(locations, ships));
            ships.push(new Ship(hits, locations))
        }
        return ships;
    }
    
    generateShip(): Array<string> {
        let direction = Math.floor(Math.random() * 2);
        let row, col = 0;
        
        if (direction === 1) { // horizontal
            row = Math.floor(Math.random() * _boardSize);
            col = Math.floor(Math.random() * (_boardSize - 3 + 1));
        } 
        else { // vertical
            row = Math.floor(Math.random() * (_boardSize - 3 + 1));
            col = Math.floor(Math.random() * _boardSize);
        }
        
        let newShipLocations = [];
        for (var i = 0; i < 3; i++) {
            if (direction === 1) {
                newShipLocations.push(row + "" + (col + i));
            } 
            else {
                newShipLocations.push((row + i) + "" + col);
            }
        }
        return newShipLocations;
    }
    
    collision(locations, ships) {
        let retval = false;
        ships.forEach(ship => {
            locations.forEach(loc => {
                if(ship.locations.indexOf(loc) >= 0) 
                    retval = true;               
            })
        })
        return retval;
    }
    
    move(root, uid, command) {
        /*const x = parseInt(command.x)
        const y = parseInt(command.y)
        if (x < 0 || x > 2 || y < 0 || y > 2) {
        throw new Error("That move is out of bounds!")
        }*/
        const ref_self_state = root.child("player_states/" + uid)
        let self_state
        
        return ref_self_state.once("value").then(snap => {
                self_state = snap.val()
                if (self_state && self_state.game) {
                    console.log("command pos: ", command.data[0].position);
                    return this.transactMove(root, uid, self_state.game, command.data[0].position)
                }
                else {
                    throw new Error("You're not in a game")
                }
            }).catch(reason => {
                console.log("Move failed")
                console.log(reason)
                return ref_self_state.update({
                    message: reason.message
                })
            })
    }
    
    transactMove(root, uid, game_id, position){
        let move_error
        root.child(`games/${game_id}`).transaction(game_state => {
            console.log("transactMove")
            console.log(game_state)
            if (game_state == null) {
                return null
            }
            try {
                return this.checkAndApplyMove(root, uid, game_state, position);
            }
            catch (error) {
                move_error = error
                return
            }
        },
        (error, committed, snapshot) => {
            console.log("transactMove end")
            if (error) {
                console.log(error)
                throw error
            }
            else if (!committed) {
                console.log("Not committed, move error")
                console.log(move_error)
                return root.child(`player_states/${uid}`).update({
                    message: move_error.message
                })
            }
            else {
                console.log("Committed move")
                return {
                    committed: committed,
                    snapshot: snapshot
                }
            }
        },false).then(result => {
            if (result.committed) {
                return this.notifyPlayers(root, uid, result.snapshot.val(), result.snapshot.key)
            }
            else {
                return console.log('transac not commited: ', result);
            }
        })
    }
    
    checkAndApplyMove(root, uid, game_state: Game, position: string) {
        if (game_state.outcome) {
            throw new Error("Game is over!")
        }
        
        const p1uid = game_state.p1uid
        const p2uid = game_state.p2uid
        let shoot = new Shoot()
        shoot.hasboat = false
        shoot.attacked = true
        shoot.position = position
    
        if(!game_state[`${game_state.p1uid}_attemps`]){
            game_state[`${game_state.p1uid}_attemps`] = []
        }
        if(!game_state[`${game_state.p2uid}_attemps`]){
            game_state[`${game_state.p2uid}_attemps`] = []
        }
    
        let pl_ships: Array<Ship>,pl_num: number
        if (uid === p1uid) {
            pl_ships = game_state.p1ships
            pl_num = 1
        }
        else if (uid === p2uid) {
            pl_ships = game_state.p2ships
            pl_num = 2
        }
        else {
            throw new Error("You're not playing this game!")
        }
    
        // Check if it's my turn
        const turn = game_state.turn
        if (uid !== game_state.turn) {
            throw new Error("It's not your turn. Be patient!")
        }
        
        let ship = this.findShip(pl_ships, position);
        if(ship){
            let index = pl_ships.indexOf(ship);
            pl_ships[index] = this.hitShip(position, ship);
            if (pl_num == 1) {
                game_state.p1ships = pl_ships;
            }
            else if (pl_num == 2) {
                game_state.p2ships = pl_ships;
            }
        
            if(this.isSunk(ship)){
                game_state.message = "You sank my battleship!";
            }
            shoot.hasboat = true;
        }
        else {
            game_state.message = "";
        }
    
        if(this.isMatchOver(pl_ships)){
            if (pl_num == 1) {
                game_state.outcome = 'win_p1';
            }
            else if (pl_num == 2) {
                game_state.outcome = 'win_p2';
            }
        }
        else {
            // Other player's turn now
            game_state.turn = pl_num == 1 ? p2uid : p1uid
        }
    
        if (pl_num == 1) {
            if(game_state[`${game_state.p1uid}_attemps`].find(attemp => { 
                return attemp.position == position; 
            }) == null){
                game_state[`${game_state.p1uid}_attemps`].push(shoot) 
            }
        }
        else if (pl_num == 2) {
            if(game_state[`${game_state.p2uid}_attemps`].find(attemp => { 
                return attemp.position == position; 
            }) == null){
                game_state[`${game_state.p2uid}_attemps`].push(shoot); 
            }
        }
        
        return game_state
    }
    
    findShip(ships: Array<Ship>, boardLocation: string) {
        return ships.find(ship => {
            return ship.locations.find(position => { 
                return position == boardLocation; 
            }) != null;
        })
    }
    
    isMatchOver(ships: Array<Ship>) {
        return ships.every(ship => {
            return this.isSunk(ship);
        });
    }
    
    isSunk(ship: Ship) {
        let retval= true;
        ship.hits.forEach(attacked => {
            if(attacked != "hit")
                retval = false;
        });
        return retval;
    }
    
    hitShip(position: string, ship: Ship){
        let index = ship.locations.indexOf(position);
        ship.hits[index] = "hit";
        return ship;
    }
    
    notifyPlayers(root, uid, game_state: Game, game_id:string) {
        // Figure out what message should be displayed for each player
        let p1_message = "", p2_message = "";
        if(game_state.message){
            if(game_state.p1uid == uid){
                p1_message = game_state.message + ", ";
            }
            else if(game_state.p2uid == uid){
                p2_message = game_state.message + ", ";
            }
        }
        if (game_state.outcome) {
            const outcome = game_state.outcome
            if (outcome === 'win_p1') {
                p1_message = "You won! Good job!"
                p2_message = "They won! Better luck next time!"
            }
            else if (outcome === 'win_p2') {
                p1_message = "They won! Better luck next time!"
                p2_message = "You won! Good job!"
            }
            else if (outcome === 'tie') {
                p1_message = p2_message = "It's a tie game!"
            }
            else if (outcome == 'forfeit_p1') {
                p1_message = "Looks like you gave up."
                p2_message = "The other player has apparently quit, so you win!"
            }
            else if (outcome == 'forfeit_p2') {
                p1_message = "The other player has apparently quit, so you win!"
                p2_message = "Looks like you gave up."
            }
        }
        else {
            if (game_state.turn === game_state.p1uid) {
                p1_message = "It's your turn! Make a move!"
                p2_message += "Waiting for other player..."
            }
            else {
                p1_message += "Waiting for other player..."
                p2_message = "It's your turn! Make a move!"
            }
        }
        
        if (p1_message && p2_message) {
            const update_p1 = new PlayerState(game_id, p1_message)
            const update_p2 = new PlayerState(game_id, p2_message)
            if (game_state.outcome) {
                update_p1.game = update_p2.game = null
            }
            
            // Perform the updates
            // Construct refs to each players' inividual state locations
            // const ref_self_state = root.child(`player_states/${uid}`)
            const ref_p1_state = root.child(`player_states/${game_state.p1uid}`)
            const ref_p2_state = root.child(`player_states/${game_state.p2uid}`)
            const pr_update_p1 = ref_p1_state.update(update_p1)
            const pr_update_p2 = ref_p2_state.update(update_p2)
            return Promise.all([pr_update_p1, pr_update_p2])
        }
        else {
            throw new Error("Unexpected case for notifications")
        }
    }
}

export class Shoot {
    hasboat: boolean;
    attacked: boolean;
    position: string;
}

export class Game {

    constructor(_p1uid: string, _p2uid: string, _turn: string, _p1checkin: number, _p2checkin: number,
        _p1ships: Array<Ship>, _p2ships: Array<Ship>) {
        this.p1uid = _p1uid;
        this.p2uid = _p2uid;
        this.turn = _turn;
        this.p1checkin = _p1checkin;
        this.p2checkin = _p2checkin;
        this.p1ships = _p1ships;
        this.p2ships = _p2ships;
    }
    p1uid: string;
    p2uid: string;
    turn: string;
    outcome: string;
    message: string;
    p1checkin: number;
    p2checkin: number;
    p1ships: Array<Ship>;
    p2ships: Array<Ship>;
}

export class Ship {

    constructor(_hits: Array<string>, _locations: Array<string>) {
        this.hits = _hits;
        this.locations = _locations;
    }
    hits: Array<string>;
    locations: Array<string>
}

export class PlayerState {

    constructor(_game: string, _message: string) {
        this.game = _game;
        this.message = _message;
    }
    game: string;
    message: string;
}
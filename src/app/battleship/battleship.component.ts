import { Component, OnInit, Input } from '@angular/core';
import { DatabaseService, Battle, Board, BoardItem, Boat, User } from '../core/database.service';
import { AngularFire, FirebaseObjectObservable, FirebaseListObservable, FirebaseAuthState } from 'angularfire2';
import { Router } from '@angular/router';
import { moveIn, fallIn, moveInLeft } from '../router.animations';

@Component({
    moduleId: module.id,
    selector: 'battleship',
    templateUrl: 'battleship.component.html',
    styleUrls: ['battleship.component.css'],
    animations: [moveIn(), fallIn(), moveInLeft()],
    host: {'[@moveIn]': ''}
})
export class BattleshipComponent implements OnInit {
    constructor(private _db: DatabaseService,private router: Router) {
        this._db.auth().subscribe(auth => {
            if(auth) {
                this.user = auth;
            }
        });
     }
    
    _battle: Battle;
    _battleOnGoing: boolean = false;
    _numShips: number = 3;
    _boardSize: number = 7;
    _battleUid: string = "";
    _hostedBattle: boolean = false;
    _onGoingBattles: FirebaseListObservable<Battle[]>;
    _message: string = "";
    user: FirebaseAuthState;

    ngOnInit() {   
        this._onGoingBattles = this._db.getOpenBattles();
    }

    hostBattle(){
        this._battle = new Battle();
        this._battle.owner = new User(this.user.auth.displayName?this.user.auth.displayName : this.user.auth.email, this.user.uid);
        this.generateShipLocations(this._battle.hostBoats, this._battle);
        this.generateShipLocations(this._battle.opponentBoats, this._battle);
        this._db.createBattle(this._battle)
        .then(response => { 
            this._battleUid = response.key;
            this._battleOnGoing = true;
            this._hostedBattle = true;
        });
    }

    createBattle(){
        this._battle = new Battle();
        this._battle.owner = new User(this.user.auth.displayName?this.user.auth.displayName : this.user.auth.email, this.user.uid);
        this._battle.isLocal = true;
        this._battle.turn = this.user.uid;
        this.generateShipLocations(this._battle.opponentBoats, this._battle);
        this._db.createBattle(this._battle)
        .then(response => { 
            this._battleUid = response.key;
            this._battleOnGoing = true;
        });
    }

    endBattle(){
        this._battle.isOpen = false;
        this._battleOnGoing = false;
        this._battle.winner = this._battle.owner.name == this.user.auth.displayName || this._battle.owner.name == this.user.auth.email ? this._battle.opponent : this._battle.owner;
        this._db.updateBattleByUid(this._battleUid, this._battle);
    }

    //
    generateShipLocations(ships: Boat[], battle: Battle) {
		var locations: string[];
		for (var i = 0; i < this._numShips; i++) {
			do {
				locations = this.generateShip();
			} while (this.collision(locations, ships));
            let boat = new Boat();
            boat.locations = locations
			ships.push(boat);
		}
	}

	generateShip() {
		let direction = Math.floor(Math.random() * 2);
		let row: number;
        let col: number;

		if (direction === 1) { // horizontal
			row = Math.floor(Math.random() * this._boardSize);
			col = Math.floor(Math.random() * (this._boardSize - 3 + 1));
		} else { // vertical
			row = Math.floor(Math.random() * (this._boardSize - 3 + 1));
			col = Math.floor(Math.random() * this._boardSize);
		}

		var newShipLocations: string[] = [];
		for (var i = 0; i < 3; i++) {
			if (direction === 1) {
				newShipLocations.push(row + "" + (col + i));
			} else {
				newShipLocations.push((row + i) + "" + col);
			}
		}
		return newShipLocations;
	}

	collision(locations: string[], ships: Boat[]) {
        let retval: boolean = false;
        ships.forEach(ship => {
            ship.locations.forEach(loc => {
                if(locations.indexOf(loc) >= 0) 
                    retval = true;               
            });
        });
		return retval;
	}

    handleHostFire(position:string){
        this._message = "";
        let ship = this.findShip(this._battle.hostBoats, position);
        this.hitShip(position, ship);
        if(this.isSunk(ship)){
            this._message = "You sank my battleship!";
        }
        if(this.isMatchOver(this._battle.hostBoats)){
            this._message = "Congratulations " + this._battle.opponent.name + " has won this battle.";
            this._battle.winner = this._battle.opponent;
            this._battle.isOpen = false;
        }
    }

    handleOponentFire(position:string){
        this._message = "";
        let ship = this.findShip(this._battle.opponentBoats, position);
        this.hitShip(position, ship);
        if(this.isSunk(ship)){
            this._message = "You sank my battleship!";
        }
        if(this.isMatchOver(this._battle.opponentBoats)){
            this._message = "Congratulations " + this._battle.owner.name + " has won this battle.";
            this._battle.winner = this._battle.owner;
            this._battle.isOpen = false;
        }
        this._db.updateBattleByUid(this._battleUid, this._battle)
    }

    hitShip(position: string, ship: Boat){
        let index = ship.locations.indexOf(position);
        ship.hits[index] = "hit";
    }

    findShip(ships: Boat[], boardLocation: string): Boat{
        return ships.find((ship: Boat) => {
            return ship.locations.find(position => { return position == boardLocation; }) != null;
        });
    }

    isMatchOver(ships: Boat[]): boolean{
        return ships.every(ship => {
                    return this.isSunk(ship);
                });
    }

    isSunk(ship: Boat): boolean{
        let retval: boolean = true;
        ship.hits.forEach(attacked => {
            if(attacked != "hit")
                retval = false;
        });
        return retval;
    }

    logout() {
        this._db.auth().logout();
        this.router.navigateByUrl('/login');
    }
}

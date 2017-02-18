import { Component, OnInit, Input } from '@angular/core';
import { DatabaseService, Battle, Board, BoardItem, Boat } from '../core/database.service';

@Component({
    moduleId: module.id,
    selector: 'board',
    templateUrl: 'board.component.html',
    styleUrls: ['board.component.css']
})
export class BoardComponent implements OnInit {
    _board: Board = new Board();
    _message: string;
    @Input() _battle: Battle;
    @Input() _isLocal: boolean;
    @Input() _battleUid: string;

    constructor(private _db: DatabaseService) { }

    ngOnInit() { 
        if(this._isLocal){
            this.initBoard(this._battle.hostBoats);
        }
        else{
            this.initBoard(this._battle.opponentBoats);
        }
    }

    fire(col: BoardItem){
        col.attacked = true;
        let ship: Boat = new Boat();
        let index: number = 0;
        this._board.guesses = this._board.guesses + 1;
        if(col.hasboat ){
            if(this._isLocal){
                ship = this.findShip(this._battle.hostBoats, col.position);
            }
            else {
                ship = this.findShip(this._battle.opponentBoats, col.position);
            }
            index = ship.locations.indexOf(col.position);
            ship.hits[index] = "hit";
            if(this.isSunk(ship)){
                this._message = "You sank my battleship!";
            }
            if(this._isLocal){
                if(this.isMatchOver(this._battle.hostBoats)){
                    this._message = "Congratulations " + this._battle.opponent.name + "has won this battle.";
                    this._battle.winner = this._battle.opponent;
                    this._battle.isOpen = false;
                }
            }
            else {
                if(this.isMatchOver(this._battle.opponentBoats)){
                    this._message = "Congratulations " + this._battle.owner.name + "has won this battle.";
                    this._battle.winner = this._battle.owner;
                    this._battle.isOpen = false;
                }
            }
            this._db.updateBattleByUid(this._battleUid, this._battle)
            .then(response => {
                console.log(response);
            });
        }
    }

    initBoard(ships: Boat[]){
        ships.forEach((ship: Boat) => {
            ship.locations.forEach(position => {
                this._board.matrix[position[0]][position[1]].hasboat = true;
                this._board.matrix[position[0]][position[1]].position = position;
                if(this._isLocal){
                    this._board.matrix[position[0]][position[1]].attacked = true;
                }
            });
        });
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
}
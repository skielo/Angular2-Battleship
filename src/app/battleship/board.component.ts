import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DatabaseService, Battle, Board, BoardItem, Boat, User } from '../core/database.service';
import { AngularFire, FirebaseObjectObservable, FirebaseListObservable, FirebaseAuthState } from 'angularfire2';

@Component({
    moduleId: module.id,
    selector: 'board',
    templateUrl: 'board.component.html',
    styleUrls: ['board.component.css']
})
export class BoardComponent implements OnInit {
    _board: Board = new Board();
    _loggedInUser: FirebaseAuthState;
    @Input() _ships: Boat[];
    @Input() _user: User;
    @Output() boardUpdated: EventEmitter<string> = new EventEmitter();

    constructor(private _db: DatabaseService) { 
        this._db.auth().subscribe(auth => {
            if(auth) {
                this._loggedInUser = auth;
            }
        });
    }

    ngOnInit() { 
        this.initBoard(this._ships);
        this._board.user = this._user;
    }

    fire(col: BoardItem){
        col.attacked = true;
        let ship: Boat = new Boat();
        let index: number = 0;
        this._board.guesses = this._board.guesses + 1;
        if(col.hasboat ){
            this.boardUpdated.emit(col.position);
        }
    }

    initBoard(ships: Boat[]){
        ships.forEach((ship: Boat) => {
            ship.locations.forEach(position => {
                this._board.matrix[position[0]][position[1]].hasboat = true;
                this._board.matrix[position[0]][position[1]].position = position;
                if(this._loggedInUser.uid == this._user.uid)
                    this._board.matrix[position[0]][position[1]].attacked = true;
            });
        });
    }
}
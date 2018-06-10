import { Component, OnInit, Input } from '@angular/core';
import { DatabaseService, Board, BoardItem, Boat } from "../core/database.service";
import { AngularFireObject, DatabaseSnapshot } from "angularfire2/database";

@Component({
  selector: 'app-battleship',
  templateUrl: './battleship.component.html',
  styleUrls: ['./battleship.component.css']
})
export class BattleshipComponent implements OnInit {
  _board: Board = new Board();
  gameState: AngularFireObject<any>;

  constructor(private _db: DatabaseService) {
    this.gameState = this._db.getGameState();
  }

  ngOnInit() {
    this.gameState.snapshotChanges().subscribe(snap => {
      this.initBoard(snap.payload.val().game);
    });
  }

  initBoard(game_id){
    if(game_id != ""){
      this._db.getLocalGame(game_id).snapshotChanges().subscribe(snap => {
        this._board.guesses = snap.length;
        snap.forEach(attemp => {
          this._board.matrix[attemp.payload.val().position[0]][attemp.payload.val().position[1]].hasboat = attemp.payload.val().hasboat;
          this._board.matrix[attemp.payload.val().position[0]][attemp.payload.val().position[1]].position = attemp.payload.val().position;
          this._board.matrix[attemp.payload.val().position[0]][attemp.payload.val().position[1]].attacked = attemp.payload.val().attacked;
        });
      });
    }
  }

  fire(col: BoardItem){
      //this._board.guesses = this._board.guesses + 1;
      this._db.fire(col.position);
  }
}

import { Component, OnInit, Input } from '@angular/core';
import { DatabaseService, Board, BoardItem, Boat } from "../core/database.service";
import { FirebaseObjectObservable } from "angularfire2/database";

@Component({
  selector: 'app-battleship',
  templateUrl: './battleship.component.html',
  styleUrls: ['./battleship.component.css']
})
export class BattleshipComponent implements OnInit {
  _board: Board = new Board();
  gameState: FirebaseObjectObservable<any>;

  constructor(private _db: DatabaseService) {
    this.gameState = this._db.getGameState();
  }

  ngOnInit() {
    this.gameState.subscribe(snap => {
      this.initBoard(snap.game);
    });
  }

  initBoard(game_id){
    if(game_id != ""){
      this._db.getLocalGame(game_id).subscribe(snap => {
        snap.forEach(attemp => {
          this._board.matrix[attemp.position[0]][attemp.position[1]].hasboat = attemp.hasboat;
          this._board.matrix[attemp.position[0]][attemp.position[1]].position = attemp.position;
          this._board.matrix[attemp.position[0]][attemp.position[1]].attacked = attemp.attacked;
        });
      });
    }
  }

  fire(col: BoardItem){
      this._board.guesses = this._board.guesses + 1;
      this._db.fire(col.position);
  }
}

import { Component, OnInit } from '@angular/core';
import { DatabaseService, Board, BoardItem } from "../core/database.service";

@Component({
  selector: 'app-battleship',
  templateUrl: './battleship.component.html',
  styleUrls: ['./battleship.component.css']
})
export class BattleshipComponent implements OnInit {
  _board: Board = new Board();
  
  constructor(private _db: DatabaseService) {

  }

  ngOnInit() {
  }

  fire(col: BoardItem){
      col.attacked = true;
      this._board.guesses = this._board.guesses + 1;
      this._db.fire(col.position);
  }
}

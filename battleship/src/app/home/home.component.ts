import { Component, OnInit } from '@angular/core';
import { FirebaseObjectObservable } from "angularfire2/database";
import { DatabaseService } from "../core/database.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  gameState: FirebaseObjectObservable<any>;
  message: string;
  gameStarted: boolean = false;
  gameId: any = "";
  
  constructor(private _db: DatabaseService) {
    this.gameState = this._db.getGameState();
  }

  ngOnInit(): void {
    this.gameState.subscribe(snap => {
      if(snap.$exists()){
        if(snap.message){
          this.message = snap.message;
          this.gameStarted = true; 
          this.gameId = snap.game;
        }
      }
    });
  }
  startGame() {
    this._db.startGame();
  }
}

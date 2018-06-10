import { Component, OnInit } from '@angular/core';
import { AngularFireObject } from "angularfire2/database";
import { DatabaseService } from "../core/database.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  gameState: AngularFireObject<any>;
  message: string;
  gameStarted: boolean = false;
  waiting: boolean = false;
  gameId: any = "";
  
  constructor(private _db: DatabaseService) {
    this.gameState = this._db.getGameState();
  }

  ngOnInit(): void {
    this.gameState.snapshotChanges().subscribe(snap => {
      if(snap.payload.exists()){
        if(snap.payload.val().message){
          this.message = snap.payload.val().message;
          this.waiting = true;
          this.gameStarted = true; 
          this.gameId = snap.payload.val().game;
        }
        if(snap.payload.val().matching){
          this.message = 'Waiting for another player';
          this.waiting = true; 
        }
      }
    });
  }
  startGame() {
    this._db.startGame();
  }
}

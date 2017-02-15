import { Component, OnInit, Input } from '@angular/core';
import { DatabaseService, Battle, Board, Item } from '../core/database.service';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';

@Component({
    moduleId: module.id,
    selector: 'battleship',
    templateUrl: 'battleship.component.html'
})
export class BattleshipComponent implements OnInit {
    constructor(private _db: DatabaseService) { }
    @Input() battleUid: string;
    
    _battle: Battle;
    _hostBoard: Board = new Board("");
    _opponentBoard: Board = new Board("");
    _battleOnGoing: boolean = false;

    ngOnInit() {
        if(!this.battleUid){
            this._db.getBattleByUid(this.battleUid)
            .subscribe(
                // it worked
                (battle) => this._battle = battle,
                // error
                (err) => { console.log(err); }
            );
        }      
    }

    createBattle(){
        let battle = new Battle();
        battle.hostBoard = new Board('local user');
        battle.opponentBoard = new Board('remote user');
        this._db.createBattle(battle)
        .then(response => { 
            this.battleUid = response.key;
            this._db.getBattleByUid(this.battleUid)
            .subscribe(
                // it worked
                (battle) => {
                    this._battleOnGoing = true;
                    this._battle = battle as Battle;
                    this._hostBoard = this._battle.hostBoard;
                    this._opponentBoard = this._battle.opponentBoard;
                },
                // error
                (err) => { console.log(err); }
            );
        });
    }
}

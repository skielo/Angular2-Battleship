import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

@Injectable()
export class DatabaseService {

    constructor(private _af: AngularFire) { }

    createBattle(obj: Battle){
        return this._af.database.list('/battles').push(obj);
    }

    getOpenBattles(){
        return this._af.database.list('/battles', {
                                    query: {
                                        orderByChild: 'isOpen',
                                        equalTo: 'true' 
                                    }
                                })
                                .catch((err: any) => {
                                    console.log(err); // again, customize me please
                                    return Promise.reject(err);
                                });
    }

    getBattleByUid(uid: string){
        return this._af.database.object('/battles/' + uid)
                                .catch((err: any) => {
                                    console.log(err); // again, customize me please
                                    return Promise.reject(err);
                                });
    }

    getBoard(uid: string, type: string) {
        return this._af.database.object('/battles/' + uid + '/' + type)
                                .catch((err: any) => {
                                    console.log(err); // again, customize me please
                                    return Promise.reject(err);
                                });
    }

    updateBattleByUid(uid: string, obj: Battle){
        this._af.database.object('/battles/' + uid).update(obj)
                                .catch((err: any) => {
                                    console.log(err); // again, customize me please
                                });
    }
}

export class Battle{
    hostBoard: Board;
    opponentBoard: Board;
    isOpen: boolean = true;
    winnerName: string = "";
    winnerUid: string = "";
}
export class Board{
    constructor(){
        this.matrix = [];

        for(var i: number = 0; i < 10; i++) {
            this.matrix[i] = [];
            for(var j: number = 0; j< 10; j++) {
                this.matrix[i][j] = new BoardItem();
            }
        }
    }
    matrix: BoardItem[][];
    username: string = "";
    userUid: string = "";
}
export class BoardItem{
    hasboat: boolean = false;
    attacked: boolean = false;
}
export class Boat{
    locations: number[] = [0,0,0];
    hits: string[] = ["","",""];
}

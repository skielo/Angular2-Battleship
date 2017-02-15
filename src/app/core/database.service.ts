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
}

export class Battle{
    hostBoard: Board;
    opponentBoard: Board;
    isOpen: boolean;
}
export class Board{
    constructor(username: string){
        this.matrix = [];

        for(var i: number = 0; i < 10; i++) {
            this.matrix[i] = [];
            for(var j: number = 0; j< 10; j++) {
                this.matrix[i][j] = new Item();
            }
        }
        this.username = username;
    }
    matrix: Item[][];
    username: string;
}
export class Item{
    constructor() {
        this.attacked = false;
        this.hasboat = false;        
    }
    hasboat: boolean;
    attacked: boolean;
}

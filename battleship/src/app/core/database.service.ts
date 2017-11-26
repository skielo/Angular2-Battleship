import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { AngularFireAuth } from "angularfire2/auth";
import { AngularFireDatabase, AngularFireObject, AngularFireList, DatabaseQuery } from "angularfire2/database";
import { Query } from '@angular/core/src/metadata/di';

@Injectable()
export class DatabaseService {

    constructor(private _af: AngularFireDatabase, public _auth: AngularFireAuth) { }

    auth(): AngularFireAuth{
        return this._auth;
    }

    createBattle(obj: Battle){
        return this._af.list('/battles').push(obj);
        
    }

    getOpenBattles(pageNo: number){
        return this._af.list('/battles', ref => ref.orderByChild('isOpen').equalTo(true).limitToFirst(pageNo * 10));
    }

    getBattleByUid(uid: string): AngularFireObject<Battle>{
        return this._af.object('/battles/' + uid);
    }

    getBattleByUidPromise(uid: string){
        return this._af.object('/battles/' + uid)
                                .snapshotChanges()
                                .toPromise()
                                .catch((err: any) => {
                                    console.log(err); // again, customize me please
                                    return Promise.reject(err);
                                });
    }

    getTurn(uid:string){
        return this._af.object('/battles/' + uid + "turn");
    }

    getBoard(uid: string, type: string) {
        return this._af.object('/battles/' + uid + '/' + type)
                                .snapshotChanges()
                                .catch((err: any) => {
                                    console.log(err); // again, customize me please
                                    return Promise.reject(err);
                                });
    }

    updateBattleByUid(uid: string, obj: Battle){
        return this._af.list('/battles').update(uid, obj)
                                        .catch((err: any) => {
                                            console.log(err); // again, customize me please
                                        });
    }

    startGame() {
        this._af.list(`commands/${this._auth.auth.currentUser.uid}`).push(new Command("play"));
    }

    getGameState() {
        return this._af.object(`player_states/${this._auth.auth.currentUser.uid}`);
    }

    getLocalGame(game_id: string){
        return this._af.list(`games/${game_id}/${this._auth.auth.currentUser.uid}_attemps`);
    }

    fire(position: string) {
        let command = new Command("move");
        command.data.push({ position: position});
        this._af.list(`commands/${this._auth.auth.currentUser.uid}`).push(command);
    }
}

export class Battle{
    hostBoats: Boat[] = new Array<Boat>();
    opponentBoats: Boat[] = new Array<Boat>();
    isOpen: boolean = true;
    owner: User = new User("","");
    opponent: User = new User("","");
    winner: User;
    shipLength: number = 3;
    isLocal: boolean = false;
    turn: string = "";
}
export class Board{
    constructor(){
        this.matrix = [];

        for(var i: number = 0; i < 7; i++) {
            this.matrix[i] = [];
            for(var j: number = 0; j< 7; j++) {
                this.matrix[i][j] = new BoardItem(i+""+j);
            }
        }
    }
    matrix: any[];
    guesses: number = 0;
}
export class BoardItem{
    constructor(pos: string) {
        this.position = pos;
    }
    hasboat: boolean = false;
    attacked: boolean = false;
    position: string;
}
export class Boat{
    locations: string[] = ["0","0","0"];
    hits: string[] = ["","",""];
}
export class User{
    constructor(_name: string, _uid: string) {
        this.name = _name;
        this.uid = _uid;
    }
    name: string = "";
    uid: string = "";
    guesses: string[] = new Array<string>();
}
export class Command {
    constructor(_command: string) {
        this.command = _command;
        this.data = [];
    }
    command: string = "";
    data: Array<any>;
}
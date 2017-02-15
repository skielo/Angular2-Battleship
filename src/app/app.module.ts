import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent }  from './app.component';
import { AngularFireModule } from 'angularfire2';
import { MaterialModule } from '@angular/material';

import { BattleshipComponent, BoardComponent } from './battleship/index';

export const firebaseConfig = {
    apiKey: 'AIzaSyA6C25YGEosGxf-fw5xYDm2LMhcNJ6KP60',
    authDomain: 'battleship-509b1.firebaseapp.com',
    databaseURL: 'https://battleship-509b1.firebaseio.com',
    storageBucket: 'battleship-509b1.appspot.com',
    messagingSenderId: '186646328647'
};

@NgModule({
  imports:      [ BrowserModule, AngularFireModule.initializeApp(firebaseConfig), MaterialModule.forRoot()],
  declarations: [ AppComponent, BattleshipComponent, BoardComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }

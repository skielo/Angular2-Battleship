import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent }  from './app.component';
import { AngularFireModule } from 'angularfire2';
import { MaterialModule } from '@angular/material';
import { FlexLayoutModule } from "@angular/flex-layout";

import { BattleshipComponent, BoardComponent } from './battleship/index';
import { EmailComponent, LoginComponent, SignupComponent } from './login/index';
import { AuthGuardService } from './core/authguard.service';
import { routes } from './app.routes';

export const firebaseConfig = {
    apiKey: 'AIzaSyA6C25YGEosGxf-fw5xYDm2LMhcNJ6KP60',
    authDomain: 'battleship-509b1.firebaseapp.com',
    databaseURL: 'https://battleship-509b1.firebaseio.com',
    storageBucket: 'battleship-509b1.appspot.com',
    messagingSenderId: '186646328647'
};

@NgModule({
  imports:      [ 
    BrowserModule, 
    FormsModule,
    AngularFireModule.initializeApp(firebaseConfig), 
    MaterialModule.forRoot(),
    FlexLayoutModule.forRoot(),
    routes
  ],
  providers: [AuthGuardService],
  declarations: [ AppComponent, BattleshipComponent, BoardComponent, EmailComponent, LoginComponent, SignupComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }

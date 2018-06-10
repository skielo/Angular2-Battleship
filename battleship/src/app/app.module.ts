import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularFireModule } from 'angularfire2';
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule, MatCardModule, MatMenuModule, MatToolbarModule, MatIconModule, MatListModule } from '@angular/material';

import { AppComponent } from './app.component';
import { EmailComponent, LoginComponent, SignupComponent } from './login/index';
import { AuthGuardService } from './core/authguard.service';
import { routes } from './app.routes';
import { BattleshipComponent } from './battleship/battleship.component';
import { AngularFireAuth } from "angularfire2/auth";
import { AngularFireDatabase } from "angularfire2/database";
import { HomeComponent } from './home/home.component';

export const firebaseConfig = {
  apiKey: "AIzaSyA6C25YGEosGxf-fw5xYDm2LMhcNJ6KP60",
  authDomain: "battleship-509b1.firebaseapp.com",
  databaseURL: "https://battleship-509b1.firebaseio.com",
  projectId: "battleship-509b1",
  storageBucket: "battleship-509b1.appspot.com",
  messagingSenderId: "186646328647"
};


@NgModule({
  declarations: [
    AppComponent, EmailComponent, LoginComponent, SignupComponent, BattleshipComponent, HomeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AngularFireModule.initializeApp(firebaseConfig), 
    FlexLayoutModule,
    routes,
    MatButtonModule, 
    MatCardModule, 
    MatMenuModule, 
    MatToolbarModule, 
    MatIconModule, 
    MatListModule 
  ],
  providers: [AuthGuardService, AngularFireDatabase, AngularFireAuth],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }

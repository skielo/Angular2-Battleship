import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFireModule } from 'angularfire2';
import { MaterialModule } from '@angular/material';
import { FlexLayoutModule } from "@angular/flex-layout";

import { AppComponent } from './app.component';
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
  declarations: [
    AppComponent, EmailComponent, LoginComponent, SignupComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(firebaseConfig), 
    MaterialModule.forRoot(),
    FlexLayoutModule.forRoot()
  ],
  providers: [AuthGuardService],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }

import { Component, OnInit } from '@angular/core';
import { DatabaseService } from './core/database.service';
import { FirebaseObjectObservable } from "angularfire2/database";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [DatabaseService]
})
export class AppComponent {



}

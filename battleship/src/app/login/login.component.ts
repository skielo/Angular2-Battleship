import { Component, OnInit, HostBinding } from '@angular/core';
import { AngularFireAuth } from "angularfire2/auth";
import { DatabaseService } from '../core/database.service';
import { Router } from '@angular/router';
import { moveIn } from '../router.animations';

@Component({
    moduleId: module.id,
    selector: 'app-login',
    templateUrl: 'login.component.html',
    styleUrls: ['login.component.css'],
    animations: [moveIn()],
    host: {'[@moveIn]': ''}
})
export class LoginComponent implements OnInit {

    error: any;
    
    constructor(private _db: DatabaseService,private router: Router) {

      this._db.auth().authState.subscribe(auth => { 
                        if(auth) {
                            this.router.navigateByUrl('/home');
                        }
                    });
    }

    ngOnInit() { }
}
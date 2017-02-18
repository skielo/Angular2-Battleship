import { Component, OnInit } from '@angular/core';
import { AngularFire, AuthProviders, AuthMethods } from 'angularfire2';
import { DatabaseService } from '../core/database.service';
import { Router } from '@angular/router';
import { moveIn, fallIn } from '../router.animations';

@Component({
    moduleId: module.id,
    selector: 'app-signup',
    templateUrl: 'signup.component.html',
    styleUrls: ['signup.component.css'],
    animations: [moveIn(), fallIn()],
    host: {'[@moveIn]': ''}
})
export class SignupComponent implements OnInit {  
    state: string = '';
    error: any;

    constructor(private _db: DatabaseService,private router: Router) {

    }

    ngOnInit() { }

    onSubmit(formData: any) {
        if(formData.valid) {
            this._db.auth().createUser({
                            email: formData.value.email,
                            password: formData.value.password
                        }).then((success) => {
                            this.router.navigate(['/login'])
                        }).catch((err) => {
                            this.error = err;
                        })
        }
    }
}
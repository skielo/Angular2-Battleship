import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from "angularfire2/auth";
import { DatabaseService } from '../core/database.service';
import { Router } from '@angular/router';
import { moveIn, fallIn } from '../router.animations';

@Component({
    moduleId: module.id,
    selector: 'app-email',
    templateUrl: 'email.component.html',
    styleUrls: ['email.component.css'],
    animations: [moveIn(), fallIn()],
    host: {'[@moveIn]': ''}
})
export class EmailComponent implements OnInit {
    state: string = '';
    error: any;

    constructor(private _db: DatabaseService,private router: Router) {
        this._db.auth().authState.subscribe(auth => { 
            if(auth) {
                this.router.navigateByUrl('/battleship');
            }
        });
    }

    ngOnInit() { }

    onSubmit(formData: any) {
        if(formData.valid) {
            this._db.auth().auth.signInWithEmailAndPassword(formData.value.email,formData.value.password)
            .then((success) => {
                this.router.navigate(['/battleship']);
            })
            .catch((err) => {
                this.error = err;
            })
        }
    }
    
}
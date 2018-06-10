import { Router } from '@angular/router';
import { AngularFireAuth } from "angularfire2/auth";
import { Injectable } from "@angular/core";
import 'rxjs/operators';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

@Injectable()
export class AuthGuardService {
    constructor(private auth: AngularFireAuth, private router: Router) {}

    canActivate(): Observable<boolean> {
      return this.auth.authState
        .pipe(
          take(1), 
          map(state => !!state),
          tap(authenticated => {
            if(!authenticated)
               this.router.navigate([ '/login' ]);
          }));
    }
}
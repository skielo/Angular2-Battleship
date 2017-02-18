import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { BattleshipComponent } from './battleship/battleship.component';
import { AuthGuardService } from './core/authguard.service';
import { SignupComponent } from './signup/signup.component';
import { EmailComponent } from './email/email.component';

export const router: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'login-email', component: EmailComponent },
    { path: 'battleship', component: BattleshipComponent, canActivate: [AuthGuardService] }

]

export const routes: ModuleWithProviders = RouterModule.forRoot(router);
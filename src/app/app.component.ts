import { Component } from '@angular/core';
import { DatabaseService } from './core/database.service';

@Component({
  moduleId: module.id,
  selector: 'my-app',
  templateUrl: 'app.component.html',
  providers: [DatabaseService]
})
export class AppComponent  { 

}

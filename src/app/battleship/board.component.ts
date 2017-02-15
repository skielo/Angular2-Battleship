import { Component, OnInit, Input } from '@angular/core';
import { DatabaseService, Battle, Board, Item } from '../core/database.service';

@Component({
    moduleId: module.id,
    selector: 'board',
    templateUrl: 'board.component.html'
})
export class BoardComponent implements OnInit {
    @Input() _board: Board;

    constructor(private _db: DatabaseService) { }

    ngOnInit() { 

    }
}
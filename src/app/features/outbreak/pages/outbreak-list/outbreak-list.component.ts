import { Component, ViewEncapsulation } from '@angular/core';
import {OutbreakDataService} from "../../../../core/services/data/outbreak.data.service";

import {MatTableDataSource,  MatSliderModule, MatSlideToggleModule} from '@angular/material';


@Component({
    selector: 'app-outbreak-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './outbreak-list.component.html',
    styleUrls: ['./outbreak-list.component.less']
})
export class OutbreakListComponent {

    outbreaks;
    dataSource;
    displayedColumns = ['name', 'description', 'disease', 'active'];

    constructor(
        private outbreakDataService: OutbreakDataService
    ) {
        outbreakDataService.getOutbreaks().subscribe( response =>{
            this.outbreaks = response;
            this.dataSource = new MatTableDataSource( this.outbreaks );
        });
    }
}

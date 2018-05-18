import { Component, ViewEncapsulation } from '@angular/core';
import {OutbreakDataService} from "../../../../core/services/data/outbreak.data.service";
import {MatDialogModule} from '@angular/material/dialog';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
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
    displayedColumns = ['name', 'disease', 'country', 'startDate', 'endDate', 'active','actions' ];

    constructor(
        private outbreakDataService: OutbreakDataService,
        private snackbarService:SnackbarService
    ) {
        outbreakDataService.getOutbreaks().subscribe( response =>{
            this.outbreaks = response;
            this.dataSource = new MatTableDataSource( this.outbreaks );
        });
    }

    delete(event,outbreakId, outbreakName){
        if(confirm('Are you sure you want to delete '+outbreakName+' ?')){
            this.outbreakDataService
                .delete(outbreakId)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe( response => {
                    this.outbreakDataService.getOutbreaks().subscribe( response =>{
                        this.snackbarService.showSuccess('Success');
                        this.outbreaks = response;
                        this.dataSource = new MatTableDataSource( this.outbreaks );
                    });
                });
        }
    }

}

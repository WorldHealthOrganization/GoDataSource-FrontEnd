import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from "../../../../core/services/data/outbreak.data.service";
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from "../../../../shared/components/breadcrumbs/breadcrumb-item.model";
import { Observable } from "rxjs/Observable";
import { OutbreakModel } from "../../../../core/models/outbreak.model";
import { UserModel } from '../../../../core/models/user.model';


@Component({
    selector: 'app-outbreak-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './outbreak-list.component.html',
    styleUrls: ['./outbreak-list.component.less']
})
export class OutbreakListComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Outbreaks', '.', true)
    ];

    // list of existing outbreaks
    outbreaksListObs: Observable<OutbreakModel[]>;


    constructor(
        private outbreakDataService: OutbreakDataService,
        private snackbarService:SnackbarService
    ) {
        this.loadOutbreaksList();
    }

    loadOutbreaksList() {
        // get the list of existing roles
        this.outbreaksListObs = this.outbreakDataService.getOutbreaksList();
    }

    delete(outbreak){
        if(confirm('Are you sure you want to delete '+outbreak.name+' ?')){
            this.outbreakDataService
                .deleteOutbreak(outbreak.id)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe( response => {
                    this.snackbarService.showSuccess("Success");
                    this.loadOutbreaksList();
                });
        }
    }

}

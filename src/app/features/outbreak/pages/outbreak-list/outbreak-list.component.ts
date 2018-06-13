import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from "../../../../core/services/data/outbreak.data.service";
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from "../../../../shared/components/breadcrumbs/breadcrumb-item.model";
import { Observable } from "rxjs/Observable";
import { OutbreakModel } from "../../../../core/models/outbreak.model";
import { RequestQueryBuilder } from "../../../../core/services/helper/request-query-builder";
import { CaseModel } from "../../../../core/models/case.model";

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
    outbreaksList$: Observable<OutbreakModel[]>;
    outbreaksListQueryBuilder: RequestQueryBuilder = new RequestQueryBuilder();


    constructor(
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService
    ) {
        this.loadOutbreaksList();
    }

    /**
     * Load the list of outbreaks
     */
    loadOutbreaksList() {
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList(this.outbreaksListQueryBuilder);
    }

    /**
     * Delete an outbreak instance
     * @param outbreak
     */
    delete(outbreak) {
        if (confirm('Are you sure you want to delete ' + outbreak.name + ' ?')) {
            this.outbreakDataService
                .deleteOutbreak(outbreak.id)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe(response => {
                    this.snackbarService.showSuccess("Success");
                    this.loadOutbreaksList();
                });
        }
    }

    /**
     * Filter the Outbreaks list by some field
     * @param property
     * @param value
     */
    filterBy(property, value) {
        this.outbreaksListQueryBuilder.where({
            [property]: {
                regexp: `/^${value}/i`
            }
        });
        this.loadOutbreaksList();
    }

    /**
     * Filter the Outbreaks list by some field
     * @param property
     * @param value
     */
    filterActiveBy(property, option) {
        if (option.value == 'all') {
            this.outbreaksListQueryBuilder.where({
                [property]: {
                    gte: 0
                }
            });
        }else{
            this.outbreaksListQueryBuilder.where({
                [property]: option.value
            });
        }
        this.loadOutbreaksList();
    }

}

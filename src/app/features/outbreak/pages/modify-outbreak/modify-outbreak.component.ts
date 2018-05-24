import { Component, ViewEncapsulation } from '@angular/core';
import {OutbreakDataService} from "../../../../core/services/data/outbreak.data.service";
import {ActivatedRoute, Router} from "@angular/router";
import {OutbreakModel} from "../../../../core/models/outbreak.model";
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

import * as moment from 'moment';
import { BreadcrumbItemModel } from "../../../../shared/components/breadcrumbs/breadcrumb-item.model";

@Component({
    selector: 'app-modify-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-outbreak.component.html',
    styleUrls: ['./modify-outbreak.component.less']
})
export class ModifyOutbreakComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Outbreaks', '/outbreaks'),
        new BreadcrumbItemModel('Modify Outbreak', '.', true)
    ];

    outbreakId: string;
    outbreak: OutbreakModel = new OutbreakModel();

    constructor(private outbreakDataService:OutbreakDataService,
                private route:ActivatedRoute,
                private router:Router,
                private snackbarService:SnackbarService) {

        this.route.params.subscribe(params => {
            this.outbreakId = params.outbreakId;

           // get the outbreak to modify
            this.outbreakDataService
                .getOutbreak(this.outbreakId)
                .subscribe(outbreakData => {
                    this.outbreak = outbreakData;
                });
        });
    }

    modifyOutbreak(form) {
        if (form.valid) {
            const dirtyFields: any[] = form.value;

            // modify the role
            this.outbreakDataService
                .modifyOutbreak(this.outbreakId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('Outbreak modified!');

                    // navigate to listing page
                    this.router.navigate(['/outbreaks']);
                });
        }
    }

    cancel(event) {
        event.preventDefault();
        if (confirm("Are you sure you want to cancel ? The data updates will be lost.")) {
            this.router.navigate(['/outbreaks']);
        }
    }
}

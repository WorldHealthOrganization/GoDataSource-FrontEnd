import { Component, ViewEncapsulation } from '@angular/core';
import {OutbreakDataService} from "../../../../core/services/data/outbreak.data.service";
import {ActivatedRoute, Router} from "@angular/router";
import {OutbreakModel} from "../../../../core/models/outbreak.model";
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

@Component({
    selector: 'app-modify-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-outbreak.component.html',
    styleUrls: ['./modify-outbreak.component.less']
})
export class ModifyOutbreakComponent {
    outbreak:any;
    //outbreak = {
    //    name: '',
    //    description: '',
    //    disease: '',
    //    active: '',
    //    startDate: '',
    //    endDate: '',
    //    country: '',
    //    periodOfFollowup: '',
    //    frequencyOfFollowUp: '',
    //    displayDateFormat: '',
    //    noDaysAmongContacts: '',
    //    noDaysDaysInChains: '',
    //    noDaysNotSeen: '',
    //    noLessContacts:'',
    //    highExposureDuration: ''
    //};

    constructor(private outbreakDataService:OutbreakDataService,
                private route:ActivatedRoute,
                private router:Router,
                private snackbarService:SnackbarService
    ) {
        this.outbreak = {};
        this.outbreak.name = '';
        this.route.params.subscribe(params => {
            let outbreakId = params.outbreakId;

            outbreakDataService.getOutbreak(outbreakId)
                .subscribe(response => {
                    this.outbreak = response;
                });

        });
    }

    save() {
        this.outbreakDataService
            .edit(this.outbreak)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe(response => {
                this.snackbarService.showSuccess('Success');
                this.router.navigate(['/outbreaks']);
            });
    }
}

import { Component, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';



@Component({
    selector: 'app-create-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-outbreak.component.html',
    styleUrls: ['./create-outbreak.component.less']
})
export class CreateOutbreakComponent {
    outbreak = {
        name: '',
        description: '',
        disease: '',
        active: '',
        startDate: '',
        endDate: '',
        country: '',
        periodOfFollowup: '',
        frequencyOfFollowUp: '',
        displayDateFormat: '',
        noDaysAmongContacts: '',
        noDaysDaysInChains: '',
        noDaysNotSeen: '',
        noLessContacts:'',
        highExposureDuration: ''
    };

    constructor(
        private outbreakDataService: OutbreakDataService,
        private router: Router,
        private snackbarService:SnackbarService
    ) {

    }

    save(){
        this.outbreakDataService
            .create(this.outbreak)
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

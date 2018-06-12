import { Component, Input, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';

@Component({
    selector: 'app-topnav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './topnav.component.html',
    styleUrls: ['./topnav.component.less']
})
export class TopnavComponent {

    // by default, do nothing (stay on the current page)
    @Input() addNewItemRoute = '.';

    // selected Outbreak
    selectedOutbreak: OutbreakModel = new OutbreakModel();
    // list of outbreaks for Selected Outbreak dropdown
    outbreaksList$: Observable<OutbreakModel[]>;

    constructor(
        private outbreakDataService: OutbreakDataService
    ) {
        // get the outbreaks list
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList();

        // get the selected outbreak
        const selectedOutbreakCompleted$ = new Subject();
        this.outbreakDataService
            .getSelectedOutbreak()
            .takeUntil(selectedOutbreakCompleted$)
            .subscribe((outbreak: OutbreakModel|null) => {
                if (outbreak) {
                    // there is a selected outbreak
                    this.selectedOutbreak = outbreak;

                    selectedOutbreakCompleted$.next();
                    selectedOutbreakCompleted$.complete();
                }
            });
    }

    /**
     * Change the selected Outbreak across the application
     * @param {OutbreakModel} outbreak
     */
    selectOutbreak(outbreak: OutbreakModel) {
        this.selectedOutbreak = outbreak;

        // cache the selected Outbreak
        this.outbreakDataService.setSelectedOutbreak(this.selectedOutbreak);
    }

}

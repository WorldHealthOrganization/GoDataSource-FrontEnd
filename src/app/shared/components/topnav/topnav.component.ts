import { Component, Input, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/takeUntil';
import { UserModel } from '../../../core/models/user.model';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../core/models/permission.model';

@Component({
    selector: 'app-topnav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './topnav.component.html',
    styleUrls: ['./topnav.component.less']
})
export class TopnavComponent {

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel = new OutbreakModel();
    // list of outbreaks for Selected Outbreak dropdown
    outbreaksList$: Observable<OutbreakModel[]>;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get the outbreaks list
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList();

        // get the selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((outbreak: OutbreakModel) => {
                // there is a selected outbreak
                this.selectedOutbreak = outbreak;
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

    /**
     * Display the Selected Outbreak dropdown only for users that have the right access
     */
    showSelectedOutbreakDropdown() {
        return this.authUser.hasPermissions(PERMISSION.READ_OUTBREAK);
    }

}

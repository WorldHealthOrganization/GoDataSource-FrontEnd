import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { UserModel } from '../../../core/models/user.model';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../core/models/permission.model';
import { LanguageDataService } from '../../../core/services/data/language.data.service';
import { LanguageModel } from '../../../core/models/language.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-topnav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './topnav.component.html',
    styleUrls: ['./topnav.component.less']
})
export class TopnavComponent implements OnInit {

    @Input() activeOutbreakEditable: boolean = true;

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel = new OutbreakModel();
    // selected Language ID
    selectedLanguageId: string;

    // list of outbreaks for Selected Outbreak dropdown
    outbreaksList: OutbreakModel[] = [];

    // list of languages
    languagesList$: Observable<LanguageModel[]>;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
        private languageDataService: LanguageDataService,
        private i18nService: I18nService,
        private snackbarService: SnackbarService
    ) {
        // get the outbreaks list
        this.refreshOutbreaksList();

        // refresh language list
        this.refreshLanguageList();
    }

    ngOnInit() {
        // subscribe to the selected outbreak stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((outbreak: OutbreakModel) => {
                if (outbreak) {
                    // refresh the outbreaks list
                    this.refreshOutbreaksList();

                    // update the selected outbreak
                    this.selectedOutbreak = outbreak;
                }
            });
    }

    /**
     * Refresh language list
     */
    refreshLanguageList() {
        // get the list of languages
        this.languagesList$ = this.languageDataService.getLanguagesList();

        // get the selected language ID
        this.selectedLanguageId = this.i18nService.getSelectedLanguageId();
    }

    /**
     * Refresh outbreak list
     */
    refreshOutbreaksList() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // outbreak data
        this.outbreakDataService
            .getOutbreaksList()
            .map((outbreaksList) => {
                return _.map(outbreaksList, (outbreak: OutbreakModel) => {
                    // do we need to update name of the outbreak ?
                    if (outbreak.id === this.authUser.activeOutbreakId) {
                        outbreak.name = this.i18nService.instant('LNG_LAYOUT_ACTIVE_OUTBREAK_LABEL', outbreak);
                    }

                    // finished
                    return outbreak;
                });
            })
            .subscribe((outbreaksList) => {
                this.outbreaksList = outbreaksList;
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
     * Change the selected Language across the application
     * @param {LanguageModel} language
     */
    selectLanguage(language: LanguageModel) {
        this.i18nService
            .changeLanguage(language)
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_LAYOUT_ACTION_CHANGE_LANGUAGE_SUCCESS_MESSAGE');
            });
    }

    /**
     * Display the Selected Outbreak dropdown only for users that have the right access
     */
    showSelectedOutbreakDropdown() {
        return this.authUser.hasPermissions(PERMISSION.READ_OUTBREAK) &&
            this.selectedOutbreak && this.selectedOutbreak.id;
    }

}

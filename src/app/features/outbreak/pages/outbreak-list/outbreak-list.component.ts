import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserModel } from '../../../../core/models/user.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { PERMISSION } from '../../../../core/models/permission.model';
import * as _ from 'lodash';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import * as moment from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

@Component({
    selector: 'app-outbreak-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './outbreak-list.component.html',
    styleUrls: ['./outbreak-list.component.less']
})
export class OutbreakListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAKS_TITLE', '.', true)
    ];

    // import constants into template
    Constants = Constants;

    // list of existing outbreaks
    outbreaksList$: Observable<OutbreakModel[]>;
    // list of options from the Active dropdown
    activeOptionsList$: Observable<any[]>;
    // list of diseases
    diseasesList$: Observable<any[]>;
    // authenticated user
    authUser: UserModel;

    // provide constants to template
    ReferenceDataCategory = ReferenceDataCategory;

    exportOutbreaksUrl: string = 'outbreaks/export';
    outbreaksDataExporFileName: string = moment().format('YYYY-MM-DD');
    @ViewChild('buttonDownloadFile') private buttonDownloadFile: ElementRef;
    allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.CSV,
        ExportDataExtension.XLS,
        ExportDataExtension.XLSX,
        ExportDataExtension.XML,
        ExportDataExtension.JSON,
        ExportDataExtension.ODS
    ];

    anonymizeFields: LabelValuePair[] = [
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_ID', 'id' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_NAME', 'name' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_DESCRIPTION', 'description' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_DISEASE', 'disease' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_START_DATE', 'startDate' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_END_DATE', 'endDate' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_DURATION_FOLLOWUP_DAYS', 'periodOfFollowup' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_FRECQUENCY', 'frequencyOfFollowUp' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_FRECQUENCY_PER_DAY', 'frequencyOfFollowUpPerDay' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_DAYS_AMONG_KNOWN_CONTACTS', 'noDaysAmongContacts' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_DAYS_IN_KNOWN_TRANSMISSION_CHAINS', 'noDaysInChains' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_DAYS_NOT_SEEN', 'noDaysNotSeen' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_LESS_THAN_X_CONTACTS', 'noLessContacts' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_DAYS_NEW_CONTACT', 'noDaysNewContacts' ),
        new LabelValuePair( 'LNG_PAGE_MODIFY_OUTBREAK_TAB_CASE_INVESTIGATION', 'caseInvestigationTemplate' ),
        new LabelValuePair( 'LNG_PAGE_MODIFY_OUTBREAK_TAB_CONTACT_FOLLOWUP', 'contactFollowUpTemplate' ),
        new LabelValuePair( 'LNG_PAGE_CREATE_CASE_LAB_RESULT_TAB_QUESTIONNAIRE_TITLE', 'labResultsTemplate' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_CASE_ID_MASK', 'caseIdMask' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_COUNTRIES', 'countries' ),
        new LabelValuePair( 'LNG_OUTBREAK_FIELD_LABEL_DAYS_LONG_PERIODS', 'longPeriodsBetweenCaseOnset' ),
    ];

    constructor(
        private outbreakDataService: OutbreakDataService,
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private i18nService: I18nService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.activeOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);

        // add page title
        this.outbreaksDataExporFileName = this.i18nService.instant('LNG_PAGE_LIST_OUTBREAKS_TITLE') +
            ' - ' +
            this.outbreaksDataExporFileName;

        // refresh
        this.needsRefreshList(true);
    }

    /**
     * Re(load) the Outbreaks list
     */
    refreshList() {
        // retrieve the list of Outbreaks
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList(this.queryBuilder);
    }

    /**
     * Delete an outbreak instance
     * @param outbreak
     */
    delete(outbreak) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_OUTBREAK', outbreak)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.outbreakDataService
                        .deleteOutbreak(outbreak.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // reload user data to get the updated data regarding active outbreak
                            this.authDataService
                                .reloadAndPersistAuthUser()
                                .subscribe((authenticatedUser) => {
                                    this.authUser = authenticatedUser.user;
                                });
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_OUTBREAKS_ACTION_DELETE_SUCCESS_MESSAGE');
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    setActive(outbreak) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_MAKE_OUTBREAK_ACTIVE')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    const userData = {'activeOutbreakId': outbreak.id};
                    const userId = this.authUser.id;
                    this.userDataService
                        .modifyUser(userId, userData)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // reload user data to save the new active outbreak
                            this.authDataService
                                .reloadAndPersistAuthUser()
                                .subscribe((authenticatedUser) => {
                                    this.authUser = authenticatedUser.user;
                                    this.snackbarService.showSuccess('LNG_PAGE_LIST_OUTBREAKS_ACTION_SET_ACTIVE_SUCCESS_MESSAGE');
                                    this.outbreakDataService.checkActiveSelectedOutbreak();
                                    this.needsRefreshList(true);
                                });
                        });
                }
            });
    }

    /**
     * Filters the outbreaks by Active property
     * @param {string} property
     * @param value
     */
    filterByActiveOutbreak(property: string, value: any) {
        // check if value is boolean. If not, remove filter
        if (!_.isBoolean(value.value)) {
            // remove filter
            this.queryBuilder.filter.remove(property);
        } else {
            // remove filter on the property to not add more conditions on the same property.
            this.queryBuilder.filter.remove(property);
            switch (value.value) {
                case true : {
                    this.queryBuilder.filter.where({
                        id: {
                            'eq': this.authUser.activeOutbreakId
                        }
                    });
                    break;
                }
                case false : {
                    this.queryBuilder.filter.where({
                        id: {
                            'neq': this.authUser.activeOutbreakId
                        }
                    });
                    break;
                }
            }
        }
        // refresh list
        this.needsRefreshList(true);
    }

    /**
     * Check if we have write access to outbreaks
     * @returns {boolean}
     */
    hasOutbreakWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_OUTBREAK);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'checkbox',
            'name',
            'disease',
            'country',
            'startDate',
            'endDate',
            'active',
            'actions'
        ];
    }

    /**
     * Export selected records
     */
    exportSelectedOutbreaks() {
        // get list of follow-ups that we want to modify
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // construct query builder
        const qb = new RequestQueryBuilder();
        qb.filter.bySelect(
            'id',
            selectedRecords,
            true,
            null
        );

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_OUTBREAKS_EXPORT_TITLE',
            url: this.exportOutbreaksUrl,
            fileName: this.outbreaksDataExporFileName,
            buttonDownloadFile: this.buttonDownloadFile,

            // // optional
            allowedExportTypes: this.allowedExportTypes,
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            anonymizeFields: this.anonymizeFields
        });
    }
}

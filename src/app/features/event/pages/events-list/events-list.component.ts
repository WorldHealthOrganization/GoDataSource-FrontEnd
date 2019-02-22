import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { tap } from 'rxjs/operators';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { LoadingDialogModel } from '../../../../shared/components/loading-dialog/loading-dialog.component';

@Component({
    selector: 'app-events-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './events-list.component.html',
    styleUrls: ['./events-list.component.less']
})
export class EventsListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // list of existing events
    eventsList$: Observable<EventModel[]>;
    eventsListCount$: Observable<any>;
    yesNoOptionsList$: Observable<any>;

    // events outbreak
    selectedOutbreak: OutbreakModel;

    // provide constants to template
    Constants = Constants;
    EntityType = EntityType;
    UserSettings = UserSettings;

    loadingDialog: LoadingDialogModel;


    allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.CSV,
        ExportDataExtension.XLS,
        ExportDataExtension.XLSX,
        ExportDataExtension.XML,
        ExportDataExtension.JSON,
        ExportDataExtension.ODS
    ];

    anonymizeFields: LabelValuePair[] = [
        new LabelValuePair('LNG_CASE_FIELD_LABEL_ID', 'id'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_FIRST_NAME', 'firstName'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_MIDDLE_NAME', 'middleName'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_LAST_NAME', 'lastName'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_GENDER', 'gender'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_PHONE_NUMBER', 'phoneNumber'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_OCCUPATION', 'occupation'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DOB', 'dob'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_AGE', 'age'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_RISK_LEVEL', 'riskLevel'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_RISK_REASON', 'riskReason'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DOCUMENTS', 'documents'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_ADDRESSES', 'addresses'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_CLASSIFICATION', 'classification'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION', 'dateOfInfection'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_OF_ONSET', 'dateOfOnset'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE', 'isDateOfOnsetApproximate'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME', 'dateOfOutcome'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE', 'dateBecomeCase'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_RANGES', 'dateRanges'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', 'questionnaireAnswers'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_TYPE', 'type'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING', 'dateOfReporting'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', 'isDateOfReportingApproximate'),
        new LabelValuePair('LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED', 'transferRefused')
    ];

    constructor(
        private eventDataService: EventDataService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        protected listFilterDataService: ListFilterDataService,
        private route: ActivatedRoute,
        private genericDataService: GenericDataService
    ) {
        super(
            snackbarService,
            listFilterDataService,
            route.queryParams
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'checkbox',
                required: true,
                excludeFromSave: true
            }),
            new VisibleColumnModel({
                field: 'name',
                label: 'LNG_EVENT_FIELD_LABEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'date',
                label: 'LNG_EVENT_FIELD_LABEL_DATE'
            }),
            new VisibleColumnModel({
                field: 'description',
                label: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION'
            }),
            new VisibleColumnModel({
                field: 'address',
                label: 'LNG_EVENT_FIELD_LABEL_ADDRESS',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'deleted',
                label: 'LNG_EVENT_FIELD_LABEL_DELETED'
            }),
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        ];
    }

    /**
     * Re(load) the Events list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list of Events
            this.eventsList$ = this.eventDataService.getEventsList(this.selectedOutbreak.id, this.queryBuilder)
                .pipe(tap(this.checkEmptyList.bind(this)));
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (this.selectedOutbreak) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            this.eventsListCount$ = this.eventDataService.getEventsCount(this.selectedOutbreak.id, countQueryBuilder).share();
        }
    }

    /**
     * Check if we have write access to events
     * @returns {boolean}
     */
    hasEventWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_EVENT);
    }

    /**
     * Check if we have access to create a contact
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

    /**
     * Delete specific event from outbreak
     * @param {EventModel} event
     */
    deleteEvent(event: EventModel) {
        // show confirm dialog
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_EVENT', event)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete contact
                    this.eventDataService
                        .deleteEvent(this.selectedOutbreak.id, event.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_EVENTS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Restore an deleted event
     * @param eventModel
     */
    restoreEvent(eventModel: EventModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_EVENT', new EventModel(eventModel))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.eventDataService
                        .restoreEvent(this.selectedOutbreak.id, eventModel.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_SUCCESS_MESSAGE');
                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Export relationships for selected events
     */
    exportSelectedEventsRelationship() {
        // get list of follow-ups that we want to modify
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // construct query builder
        const qb = new RequestQueryBuilder();
        qb.filter.where({
            'persons.id': {
                inq: selectedRecords
            }
        });

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIPS_TITLE',
            url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
            fileName: `LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIP_FILE_NAME`,

            // // optional
            allowedExportTypes: this.allowedExportTypes,
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            anonymizeFields: this.anonymizeFields,
            exportStart: () => { this.showLoadingDialog(); },
            exportFinished: () => { this.closeLoadingDialog(); }
        });
    }

    /**
     * Display loading dialog
     */
    showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }
    /**
     * Hide loading dialog
     */
    closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }
}

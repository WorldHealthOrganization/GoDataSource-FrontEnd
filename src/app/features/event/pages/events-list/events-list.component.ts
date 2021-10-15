import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable, throwError } from 'rxjs';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { ContactModel } from '../../../../core/models/contact.model';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { AddressModel } from '../../../../core/models/address.model';
import {
    IExportFieldsGroupRequired,
    ExportFieldsGroupModelNameEnum
} from '../../../../core/models/export-fields-group.model';
import { moment } from '../../../../core/helperClasses/x-moment';

@Component({
    selector: 'app-events-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './events-list.component.html',
    styleUrls: ['./events-list.component.less']
})
export class EventsListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // constants
    EventModel = EventModel;
    RelationshipModel = RelationshipModel;
    OutbreakModel = OutbreakModel;
    UserModel = UserModel;

    // address model needed for filters
    filterAddressModel: AddressModel = new AddressModel({
        geoLocationAccurate: null
    });
    filterAddressParentLocationIds: string[] = [];

    // user list
    userList$: Observable<UserModel[]>;

    // list of export fields groups
    fieldsGroupList: LabelValuePair[];
    fieldsGroupListRequired: IExportFieldsGroupRequired;

    // list of export fields groups
    fieldsGroupListRelationships: LabelValuePair[];
    fieldsGroupListRelationshipsRequired: IExportFieldsGroupRequired;

    // list of existing events
    eventsList$: Observable<EventModel[]>;
    eventsListCount$: Observable<IBasicCount>;
    yesNoOptionsList$: Observable<any>;

    // events outbreak
    selectedOutbreak: OutbreakModel;

    // provide constants to template
    Constants = Constants;
    EntityType = EntityType;
    UserSettings = UserSettings;

    outbreakSubscriber: Subscription;

    allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.CSV,
        ExportDataExtension.XLS,
        ExportDataExtension.XLSX,
        ExportDataExtension.JSON,
        ExportDataExtension.ODS,
        ExportDataExtension.PDF
    ];

    exportEventsUrl: string;
    eventsDataExportFileName: string = moment().format('YYYY-MM-DD');

    anonymizeFields: LabelValuePair[] = [
        new LabelValuePair('LNG_EVENT_FIELD_LABEL_NAME', 'name'),
        new LabelValuePair('LNG_EVENT_FIELD_LABEL_DATE', 'date'),
        new LabelValuePair('LNG_EVENT_FIELD_LABEL_DESCRIPTION', 'description'),
        new LabelValuePair('LNG_EVENT_FIELD_LABEL_ADDRESS', 'address'),
        new LabelValuePair('LNG_EVENT_FIELD_LABEL_DELETED', 'deleted'),
    ];

    recordActions: HoverRowAction[] = [
        // View Event
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_EVENTS_ACTION_VIEW_EVENT',
            linkGenerator: (item: EventModel): string[] => {
                return ['/events', item.id, 'view'];
            },
            visible: (item: EventModel): boolean => {
                return !item.deleted &&
                    EventModel.canView(this.authUser);
            }
        }),

        // Modify Event
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_EVENTS_ACTION_MODIFY_EVENT',
            linkGenerator: (item: EventModel): string[] => {
                return ['/events', item.id, 'modify'];
            },
            visible: (item: EventModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    EventModel.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Event
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_EVENTS_ACTION_DELETE_EVENT',
                    click: (item: EventModel) => {
                        this.deleteEvent(item);
                    },
                    visible: (item: EventModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            EventModel.canDelete(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: EventModel): boolean => {
                        // visible only if at least one of the previous...
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            EventModel.canDelete(this.authUser);
                    }
                }),

                // Add Contact to Event
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_ADD_CONTACT',
                    click: (item: EventModel) => {
                        this.router.navigate(['/contacts', 'create'], {
                            queryParams: {
                                entityType: EntityType.EVENT,
                                entityId: item.id
                            }
                        });
                    },
                    visible: (item: EventModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactModel.canCreate(this.authUser) &&
                            EventModel.canCreateContact(this.authUser);
                    }
                }),

                // Bulk add contacts to event
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_BULK_ADD_CONTACTS',
                    click: (item: EventModel) => {
                        this.router.navigate(['/contacts', 'create-bulk'], {
                            queryParams: {
                                entityType: EntityType.EVENT,
                                entityId: item.id
                            }
                        });
                    },
                    visible: (item: EventModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactModel.canBulkCreate(this.authUser) &&
                            EventModel.canBulkCreateContact(this.authUser);
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: EventModel): boolean => {
                        // visible only if at least one of the previous...
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id && (
                                (
                                    ContactModel.canCreate(this.authUser) &&
                                    EventModel.canCreateContact(this.authUser)
                                ) || (
                                    ContactModel.canBulkCreate(this.authUser) &&
                                    EventModel.canBulkCreateContact(this.authUser)
                                )
                            );
                    }
                }),

                // See event contacts..
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM',
                    click: (item: EventModel) => {
                        this.router.navigate(['/relationships', EntityType.EVENT, item.id, 'contacts']);
                    },
                    visible: (item: EventModel): boolean => {
                        return !item.deleted &&
                            RelationshipModel.canList(this.authUser) &&
                            EventModel.canListRelationshipContacts(this.authUser);
                    }
                }),

                // See event exposures
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
                    click: (item: EventModel) => {
                        this.router.navigate(['/relationships', EntityType.EVENT, item.id, 'exposures']);
                    },
                    visible: (item: EventModel): boolean => {
                        return !item.deleted &&
                            RelationshipModel.canList(this.authUser) &&
                            EventModel.canListRelationshipExposures(this.authUser);
                    }
                }),

                // Restore a deleted event
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_EVENT',
                    click: (item: EventModel) => {
                        this.restoreEvent(item);
                    },
                    visible: (item: EventModel): boolean => {
                        return item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            EventModel.canRestore(this.authUser);
                    },
                    class: 'mat-menu-item-restore'
                })
            ]
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        private router: Router,
        private eventDataService: EventDataService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private genericDataService: GenericDataService,
        private i18nService: I18nService,
        private userDataService: UserDataService,
        private entityHelperService: EntityHelperService,
        private redirectService: RedirectService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // add page title
        this.eventsDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_EVENTS_TITLE') +
            ' - ' +
            this.eventsDataExportFileName;

        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        // subscribe to the Selected Outbreak
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // export cases url
                this.exportEventsUrl = null;
                if (
                    this.selectedOutbreak &&
                    this.selectedOutbreak.id
                ) {
                    this.exportEventsUrl = `/outbreaks/${this.selectedOutbreak.id}/events/export`;
                }

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

        // retrieve the list of export fields groups for model
        this.outbreakDataService.getExportFieldsGroups(ExportFieldsGroupModelNameEnum.EVENT)
            .subscribe((fieldsGroupList) => {
                this.fieldsGroupList = fieldsGroupList.toLabelValuePair(this.i18nService);
                this.fieldsGroupListRequired = fieldsGroupList.toRequiredList();
            });

        // retrieve the list of export fields groups for relationships
        this.outbreakDataService.getExportFieldsGroups(ExportFieldsGroupModelNameEnum.RELATIONSHIP)
            .subscribe((fieldsGroupList) => {
                this.fieldsGroupListRelationships = fieldsGroupList.toLabelValuePair(this.i18nService);
                this.fieldsGroupListRelationshipsRequired = fieldsGroupList.toRequiredList();
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();

        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
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
                field: 'phoneNumber',
                label: 'LNG_EVENT_FIELD_LABEL_PHONE_NUMBER',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.emailAddress',
                label: 'LNG_EVENT_FIELD_LABEL_EMAIL',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'responsibleUserId',
                label: 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
                visible: false,
                excludeFromDisplay: (): boolean => {
                    return UserModel.canList(this.authUser);
                }
            })
        ];

        // number of contacts & exposures columns should be visible only on pages where we have relationships
        // for cases without relationships we don't need these columns
        if (this.appliedListFilter !== Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS) {
            this.tableColumns.push(
                new VisibleColumnModel({
                    field: 'numberOfContacts',
                    label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS',
                    visible: false
                }),
                new VisibleColumnModel({
                    field: 'numberOfExposures',
                    label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
                    visible: false
                })
            );
        }

        // rest of columns :)
        this.tableColumns.push(
            new VisibleColumnModel({
                field: 'deleted',
                label: 'LNG_EVENT_FIELD_LABEL_DELETED'
            }),
            new VisibleColumnModel({
                field: 'createdBy',
                label: 'LNG_EVENT_FIELD_LABEL_CREATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdAt',
                label: 'LNG_EVENT_FIELD_LABEL_CREATED_AT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedBy',
                label: 'LNG_EVENT_FIELD_LABEL_UPDATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedAt',
                label: 'LNG_EVENT_FIELD_LABEL_UPDATED_AT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'location',
                label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.addressLine1',
                label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.city',
                label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.geoLocation.lat',
                label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.geoLocation.lng',
                label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.postalCode',
                label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'address.geoLocationAccurate',
                label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_GEO_LOCATION_ACCURATE',
                visible: false
            })
        );
    }

    /**
     * Re(load) the Events list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            // retrieve created user & modified user information
            this.queryBuilder.include('createdByUser', true);
            this.queryBuilder.include('updatedByUser', true);

            // retrieve responsible user information
            this.queryBuilder.include('responsibleUser', true);

            // retrieve location list
            this.queryBuilder.include('location', true);

            // retrieve the list of Events
            this.eventsList$ = this.eventDataService
                .getEventsList(this.selectedOutbreak.id, this.queryBuilder)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        finishCallback([]);
                        return throwError(err);
                    }),
                    tap(this.checkEmptyList.bind(this)),
                    tap((data: any[]) => {
                        finishCallback(data);
                    })
                );
        } else {
            finishCallback([]);
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount(applyHasMoreLimit?: boolean) {
        if (this.selectedOutbreak) {
            // set apply value
            if (applyHasMoreLimit !== undefined) {
                this.applyHasMoreLimit = applyHasMoreLimit;
            }

            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();

            // apply has more limit
            if (this.applyHasMoreLimit) {
                countQueryBuilder.flag(
                    'applyHasMoreLimit',
                    true
                );
            }

            // count
            this.eventsListCount$ = this.eventDataService
                .getEventsCount(this.selectedOutbreak.id, countQueryBuilder)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        return throwError(err);
                    }),
                    share()
                );
        }
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
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
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
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_SUCCESS_MESSAGE');
                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Export selected events
     */
    exportSelectedEvents() {
        // get list of selected ids
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
            message: 'LNG_PAGE_LIST_EVENTS_EXPORT_TITLE',
            url: this.exportEventsUrl,
            fileName: this.eventsDataExportFileName,

            // configure
            isAsyncExport: true,
            displayUseDbColumns: true,
            displayJsonReplaceUndefinedWithNull: true,
            exportProgress: (data) => { this.showExportProgress(data); },

            // optional
            allowedExportTypes: this.allowedExportTypes,
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            displayFieldsGroupList: true,
            displayUseQuestionVariable: false,
            anonymizeFields: this.anonymizeFields,
            fieldsGroupList: this.fieldsGroupList,
            fieldsGroupListRequired: this.fieldsGroupListRequired,
            exportStart: () => { this.showLoadingDialog(); },
            exportFinished: () => { this.closeLoadingDialog(); }
        });
    }

    /**
     * Export relationships for selected events
     */
    exportSelectedEventsRelationship() {
        // get list of selected ids
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // construct query builder
        const qb = new RequestQueryBuilder();
        const personsQb = qb.addChildQueryBuilder('person');

        // id
        personsQb.filter.bySelect('id', selectedRecords, true, null);

        // type
        personsQb.filter.byEquality(
            'type',
            EntityType.EVENT
        );

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIPS_TITLE',
            url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
            fileName: this.i18nService.instant('LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIP_FILE_NAME'),

            // configure
            isAsyncExport: true,
            displayUseDbColumns: true,
            displayJsonReplaceUndefinedWithNull: true,
            exportProgress: (data) => { this.showExportProgress(data); },

            // optional
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            displayFieldsGroupList: true,
            allowedExportTypes: this.allowedExportTypes,
            anonymizeFields: this.anonymizeFields,
            fieldsGroupList: this.fieldsGroupListRelationships,
            fieldsGroupListRequired: this.fieldsGroupListRelationshipsRequired,
            exportStart: () => { this.showLoadingDialog(); },
            exportFinished: () => { this.closeLoadingDialog(); }
        });
    }

    /**
     * Export Event Relationships
     */
    exportFilteredEventsRelationships() {
        // construct filter by case query builder
        const qb = new RequestQueryBuilder();
        const personsQb = qb.addChildQueryBuilder('person');

        // retrieve only relationships that have at least one persons as desired type
        qb.filter.byEquality(
            'persons.type',
            EntityType.EVENT
        );

        // merge out query builder
        personsQb.merge(this.queryBuilder);

        // remove pagination
        personsQb.paginator.clear();

        // attach condition only if not empty
        if (!personsQb.filter.isEmpty()) {
            // filter only events
            personsQb.filter.byEquality(
                'type',
                EntityType.EVENT
            );
        }

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIPS_TITLE',
            url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
            fileName: this.i18nService.instant('LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIP_FILE_NAME'),

            // configure
            isAsyncExport: true,
            displayUseDbColumns: true,
            displayJsonReplaceUndefinedWithNull: true,
            exportProgress: (data) => { this.showExportProgress(data); },

            // optional
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            displayFieldsGroupList: true,
            allowedExportTypes: this.allowedExportTypes,
            anonymizeFields: this.anonymizeFields,
            fieldsGroupList: this.fieldsGroupListRelationships,
            fieldsGroupListRequired: this.fieldsGroupListRelationshipsRequired,
            exportStart: () => { this.showLoadingDialog(); },
            exportFinished: () => { this.closeLoadingDialog(); }
        });
    }

    /**
     * Display contacts popup
     */
    displayContacts(entity: EventModel) {
        // if we do not have contacts return
        if (entity.numberOfContacts < 1) {
            return;
        }

        // display dialog
        this.entityHelperService.displayContacts(
            this.selectedOutbreak.id,
            entity
        );
    }

    /**
     * Display exposures popup
     */
    displayExposures(entity: EventModel) {
        // if we do not have any exposure return
        if (entity.numberOfExposures < 1) {
            return;
        }

        // display dialog
        this.entityHelperService.displayExposures(
            this.selectedOutbreak.id,
            entity
        );
    }

    /**
     * Navigate to Events without relationships
     */
    navigateToEventsWithoutRelationships() {
        this.redirectService.to(
            ['/events'], {
                applyListFilter: Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS
            }
        );
    }

    /**
     * Redirect to import relationship page
     */
    goToRelationshipImportPage() {
        this.router.navigate(['/import-export-data', 'relationships', 'import'], {
            queryParams: {
                from: Constants.APP_PAGE.EVENTS.value
            }
        });
    }
}

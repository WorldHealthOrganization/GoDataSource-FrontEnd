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
import { LoadingDialogModel } from '../../../../shared/components/loading-dialog/loading-dialog.component';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { ContactModel } from '../../../../core/models/contact.model';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

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

    // user list
    userList$: Observable<UserModel[]>;

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

    loadingDialog: LoadingDialogModel;

    outbreakSubscriber: Subscription;

    allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.CSV,
        ExportDataExtension.XLS,
        ExportDataExtension.XLSX,
        ExportDataExtension.XML,
        ExportDataExtension.JSON,
        ExportDataExtension.ODS,
        ExportDataExtension.PDF
    ];

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
            click: (item: EventModel) => {
                this.router.navigate(['/events', item.id, 'view']);
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
            click: (item: EventModel) => {
                this.router.navigate(['/events', item.id, 'modify']);
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
        private entityHelperService: EntityHelperService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        // subscribe to the Selected Outbreak
        this.outbreakSubscriber = this.outbreakDataService
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
                field: 'address',
                label: 'LNG_EVENT_FIELD_LABEL_ADDRESS',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'numberOfContacts',
                label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'numberOfExposures',
                label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
                visible: false
            }),
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
            })
        ];
    }

    /**
     * Re(load) the Events list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            // retrieve created user & modified user information
            this.queryBuilder.include('createdByUser', true);
            this.queryBuilder.include('updatedByUser', true);

            // since some flags can do damage to other endpoints called with the same flag, we should make sure we don't send it
            // to do this, we clone the query filter before filtering by it
            const clonedQB = _.cloneDeep(this.queryBuilder);

            // retrieve number of contacts & exposures for each record
            clonedQB.filter.flag(
                'countRelations',
                true
            );

            // retrieve the list of Events
            this.eventsList$ = this.eventDataService
                .getEventsList(this.selectedOutbreak.id, clonedQB)
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
    refreshListCount() {
        if (this.selectedOutbreak) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();
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

            // optional
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            allowedExportTypes: this.allowedExportTypes,
            anonymizeFields: this.anonymizeFields,
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

        // merge out query builder
        personsQb.merge(this.queryBuilder);

        // remove pagination
        personsQb.paginator.clear();

        // filter only events
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

            // optional
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            allowedExportTypes: this.allowedExportTypes,
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
}

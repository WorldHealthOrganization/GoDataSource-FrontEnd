import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import {
    DialogAnswer, DialogButton, DialogComponent,
    DialogConfiguration, DialogField, DialogFieldType
} from '../../../../shared/components/dialog/dialog.component';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { LoadingDialogModel } from '../../../../shared/components/loading-dialog/loading-dialog.component';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { RequestFilter } from '../../../../core/helperClasses/request-query-builder/request-filter';
import { throwError } from 'rxjs';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { MatDialogRef } from '@angular/material';
import { ViewCotEdgeDialogComponent } from '../../../../shared/components/view-cot-edge-dialog/view-cot-edge-dialog.component';
import {
    EntityModel, RelationshipForDialogModel,
    RelationshipModel
} from '../../../../core/models/entity-and-relationship.model';
import { ViewCotNodeDialogComponent } from '../../../../shared/components/view-cot-node-dialog/view-cot-node-dialog.component';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';

@Component({
    selector: 'app-events-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './events-list.component.html',
    styleUrls: ['./events-list.component.less']
})
export class EventsListComponent extends ListComponent implements OnInit, OnDestroy {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // user list
    userList$: Observable<UserModel[]>;

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
                return !item.deleted;
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
                    this.hasEventWriteAccess();
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
                            this.hasEventWriteAccess();
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
                            this.hasEventWriteAccess();
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
                            this.hasContactWriteAccess();
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
                            this.hasContactWriteAccess();
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
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            this.hasContactWriteAccess();
                    }
                }),

                // See event contacts..
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM',
                    click: (item: EventModel) => {
                        this.router.navigate(['/relationships', EntityType.EVENT, item.id, 'contacts']);
                    },
                    visible: (item: EventModel): boolean => {
                        return !item.deleted;
                    }
                }),

                // See event exposures
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
                    click: (item: EventModel) => {
                        this.router.navigate(['/relationships', EntityType.EVENT, item.id, 'exposures']);
                    },
                    visible: (item: EventModel): boolean => {
                        return !item.deleted;
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
                            this.hasEventWriteAccess();
                    },
                    class: 'mat-menu-item-restore'
                })
            ]
        })
    ];

    constructor(
        private router: Router,
        private eventDataService: EventDataService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        protected listFilterDataService: ListFilterDataService,
        private route: ActivatedRoute,
        private genericDataService: GenericDataService,
        private i18nService: I18nService,
        private userDataService: UserDataService,
        private relationshipDataService: RelationshipDataService
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

    ngOnDestroy() {
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
                field: 'numberOfContacts',
                label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'numberOfExposures',
                label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
                visible: false
            })
        ];
    }

    /**
     * Re(load) the Events list
     */
    refreshList(finishCallback: () => void) {
        if (this.selectedOutbreak) {
            // retrieve created user & modified user information
            this.queryBuilder.include('createdByUser', true);
            this.queryBuilder.include('updatedByUser', true);

            this.queryBuilder.filter.flag(
                'countRelations',
                true);

            // retrieve the list of Events
            this.eventsList$ = this.eventDataService.getEventsList(this.selectedOutbreak.id, this.queryBuilder)
                .pipe(
                    tap(this.checkEmptyList.bind(this)),
                    tap(() => {
                        finishCallback();
                    })
                );
        } else {
            finishCallback();
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
            this.eventsListCount$ = this.eventDataService.getEventsCount(this.selectedOutbreak.id, countQueryBuilder).pipe(share());
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
     * Filter by phone number
     */
    filterByPhoneNumber(value: string) {
        // remove previous condition
        this.queryBuilder.filter.remove('address.phoneNumber');

        if (!_.isEmpty(value)) {
            // add new condition
            this.queryBuilder.filter.where({
                'address.phoneNumber': {
                        regex: RequestFilter.escapeStringForRegex(value)
                            .replace(/%/g, '.*')
                            .replace(/\\\?/g, '.'),
                        $options: 'i'
                }
            });
        }

        // refresh list
        this.needsRefreshList();
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
    displayContacts(
        entity: EventModel,
        contactsNumber: number,
        entityType: EntityType,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder())
    {
        // if we do not have contacts return
        if (contactsNumber < 1) {
            return;
        }
        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();
        this.relationshipDataService
            .getEntityContacts(
                this.selectedOutbreak.id,
                entityType,
                entityId,
                queryBuilder
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);
                    // hide loading
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((relationshipsData: EntityModel[]) => {
                // hide loading
                loadingDialog.close();

                // display popup
                this.displayEntitiesAndRelationships('fromContacts', entity, relationshipsData);

            });

    }

    /**
     * Display exposures popup
     */
    displayExposures(
        entity: EventModel,
        exposureNumber: number,
        entityType: EntityType,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder())
    {
        // if we do not have any exposure return
        if (exposureNumber < 1) {
            return;
        }
        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();

        this.relationshipDataService
            .getEntityExposures(
                this.selectedOutbreak.id,
                entityType,
                entityId,
                queryBuilder
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);
                    // hide loading
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((relationshipsData: EntityModel[]) => {
                // hide loading
                loadingDialog.close();

                // display popup
                this.displayEntitiesAndRelationships('fromExposures', entity, relationshipsData);
            });
    }

    /**
     * Display dialog with entities and related relationships
     */
    displayEntitiesAndRelationships(from: string, entity: EventModel, relationshipsData: EntityModel[]) {
        // split relationships data into entities and relationships
        const entities = [];
        const relationships: RelationshipForDialogModel[] = [];

        // add models
        relationshipsData.forEach((relationshipData) => {
            entities.push(relationshipData.model);
        });
        // add relationships
        relationshipsData.forEach((relationshipData) => {
            // create object to pass to the dialog
            relationships.push({
                relatedEntity: relationshipData.model,
                relationshipData: relationshipData.relationship});
        });

        // create  list of entities and relationships
        const fieldsList: DialogField[] = [];

        if (!_.isEmpty(entities)) {
            // add section title if we have entities
            fieldsList.push(new DialogField({
                name: '_',
                fieldType: DialogFieldType.SECTION_TITLE,
                placeholder: 'LNG_PAGE_LIST_EVENTS_DIALOG_ENTITY_SECTION_TITLE'
            }));

            // add entities to the list
            entities.forEach((itemModel: CaseModel | ContactModel | EventModel) => {
                fieldsList.push(new DialogField({
                    name: '',
                    fieldType: DialogFieldType.ACTION,
                    placeholder: itemModel.name,
                    actionData: itemModel,
                    actionCallback: (item) => {
                        // show entity information
                        this.dialogService.showCustomDialog(
                            ViewCotNodeDialogComponent,
                            {
                                ...ViewCotNodeDialogComponent.DEFAULT_CONFIG,
                                ...{
                                    data: {
                                        entity: item
                                    }
                                }
                            }
                        );
                    }
                }));
            });
        }

        if (!_.isEmpty(relationships)) {
            // add section title if we have relationships
            fieldsList.push(new DialogField({
                name: '_',
                fieldType: DialogFieldType.SECTION_TITLE,
                placeholder: 'LNG_PAGE_LIST_EVENTS_DIALOG_ENTITY_RELATIONSHIPS_TITLE'
            }));

            // add relationships to the list
            relationships.forEach((relationshipModel: RelationshipForDialogModel) => {
                // construct relationship label for dialog
                let relationshipLabel: string = '';
                if (from === 'fromContacts') {
                    relationshipLabel = `${entity.name} - ${relationshipModel.relatedEntity.name}`;
                }

                if (from === 'fromExposures') {
                    relationshipLabel = ` ${relationshipModel.relatedEntity.name} - ${entity.name}`;
                }

                // add related entities into relationship people to display relationship dialog
                relationshipModel.relationshipData.people = [
                    new EntityModel(entity),
                    new EntityModel(relationshipModel.relatedEntity)
                ];

                // add relationships to the list
                fieldsList.push(new DialogField({
                    name: '',
                    fieldType: DialogFieldType.ACTION,
                    placeholder: relationshipLabel,
                    actionData: relationshipModel.relationshipData,
                    actionCallback: (item: RelationshipModel) => {
                        // show entity information
                        this.dialogService.showCustomDialog(
                            ViewCotEdgeDialogComponent,
                            {
                                ...ViewCotEdgeDialogComponent.DEFAULT_CONFIG,
                                ...{
                                    data: {
                                        relationship: item
                                    }
                                }
                            }
                        );
                    }
                }));
            });
        }

        // display dialog if filed list is not empty
        if (!_.isEmpty(fieldsList)) {
            // display dialog to choose item from list
            this.dialogService
                .showInput(new DialogConfiguration({
                    message: 'LNG_PAGE_LIST_EVENTS_GROUP_DIALOG_TITLE',
                    buttons: [
                        new DialogButton({
                            label: 'LNG_COMMON_BUTTON_CLOSE',
                            clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                                dialogHandler.close();
                            }
                        })
                    ],
                    fieldsList: fieldsList
                }))
                .subscribe();
        }
    }
}

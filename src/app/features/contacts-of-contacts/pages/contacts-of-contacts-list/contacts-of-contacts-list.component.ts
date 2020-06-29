 import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable, throwError } from 'rxjs';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import {
    CountedItemsListItem,
    DialogAnswerButton,
    HoverRowAction,
    HoverRowActionType,
    LoadingDialogModel
} from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Router } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { RequestQueryBuilder, RequestRelationBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Constants } from '../../../../core/models/constants';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { catchError, map, mergeMap, share, tap } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { AddressType } from '../../../../core/models/address.model';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { RiskLevelGroupModel } from '../../../../core/models/risk-level-group.model';
import { RiskLevelModel } from '../../../../core/models/risk-level.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
 import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
 import {IBasicCount} from '../../../../core/models/basic-count.interface';

@Component({
    selector: 'app-contacts-of-contacts-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-of-contacts-list.component.html',
    styleUrls: ['./contacts-of-contacts-list.component.less']
})
export class ContactsOfContactsListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE', '.', true)
    ];

    // constants
    Constants = Constants;
    ContactOfContactModel = ContactOfContactModel;
    OutbreakModel = OutbreakModel;

    // authenticated user
    authUser: UserModel;

    // list of existing contacts
    contactsOfContactsList$: Observable<ContactOfContactModel[]>;
    contactsOfContactsListCount$: Observable<IBasicCount>;

    // don't display pills by default
    showCountPills: boolean = false;

    outbreakSubscriber: Subscription;

    // user list
    userList$: Observable<UserModel[]>;

    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // gender list
    genderList$: Observable<any[]>;

    // contacts grouped by risk level
    countedContactsOfContactsByRiskLevel$: Observable<any[]>;

    // risk level
    riskLevelRefData$: Observable<ReferenceDataCategoryModel>;
    riskLevelsList$: Observable<any[]>;
    riskLevelsListMap: { [id: string]: ReferenceDataEntryModel };

    // provide constants to template
    EntityType = EntityType;
    ReferenceDataCategory = ReferenceDataCategory;
    UserSettings = UserSettings;

    // yes / no / all options
    yesNoOptionsList$: Observable<any[]>;

    // available side filters
    availableSideFilters: FilterModel[];
    // values for side filter
    savedFiltersType = Constants.APP_PAGE.CONTACTS.value;

    exportContactsOfContactsUrl: string;
    contactsOfContactsDataExportFileName: string = moment().format('YYYY-MM-DD');
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
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ID', 'id'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME', 'firstName'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME', 'middleName'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME', 'lastName'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER', 'gender'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER', 'phoneNumber'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION', 'occupation'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BIRTH', 'dob'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE', 'age'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENTS', 'documents'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES', 'addresses'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL', 'riskLevel'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON', 'riskReason'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_TYPE', 'type'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING', 'dateOfReporting'),
        new LabelValuePair('LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', 'isDateOfReportingApproximate'),
    ];

    loadingDialog: LoadingDialogModel;

    recordActions: HoverRowAction[] = [
        // View Contact
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_CONTACT_OF_CONTACT',
            click: (item: ContactOfContactModel) => {
                this.router.navigate(['/contacts-of-contacts', item.id, 'view']);
            },
            visible: (item: ContactOfContactModel): boolean => {
                return !item.deleted &&
                    ContactOfContactModel.canView(this.authUser);
            }
        }),

        // Modify Contact
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_MODIFY_CONTACT_OF_CONTACT',
            click: (item: ContactOfContactModel) => {
                this.router.navigate(['/contacts-of-contacts', item.id, 'modify']);
            },
            visible: (item: ContactOfContactModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    ContactOfContactModel.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Contact
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_CONTACT_OF_CONTACT',
                    click: (item: ContactOfContactModel) => {
                        this.deleteContactOfContact(item);
                    },
                    visible: (item: ContactOfContactModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactOfContactModel.canDelete(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: ContactOfContactModel): boolean => {
                        // visible only if at least one of the first two items is visible
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id;
                    }
                }),

                // See contact exposures
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
                    click: (item: ContactOfContactModel) => {
                        this.router.navigate(['/relationships', EntityType.CONTACT_OF_CONTACT, item.id, 'exposures']);
                    },
                    visible: (item: ContactOfContactModel): boolean => {
                        return !item.deleted &&
                            ContactOfContactModel.canListRelationshipExposures(this.authUser);
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: ContactOfContactModel): boolean => {
                        // visible only if at least one of the previous...
                        return !item.deleted;
                    }
                }),

                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_SEE_RECORDS_NOT_DUPLICATES',
                    click: (item: ContactOfContactModel) => {
                        this.router.navigate(['/duplicated-records/contacts-of-contacts', item.id, 'marked-not-duplicates']);
                    },
                    visible: (item: ContactOfContactModel): boolean => {
                        return !item.deleted;
                    }
                }),

                // View Contact movement map
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_MOVEMENT',
                    click: (item: ContactOfContactModel) => {
                        this.router.navigate(['/contacts-of-contacts', item.id, 'movement']);
                    },
                    visible: (item: ContactOfContactModel): boolean => {
                        return !item.deleted && ContactOfContactModel.canViewMovementMap(this.authUser);
                    }
                }),

                // View Contact chronology timeline
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_CHRONOLOGY',
                    click: (item: ContactOfContactModel) => {
                        this.router.navigate(['/contacts-of-contacts', item.id, 'chronology']);
                    },
                    visible: (item: ContactOfContactModel): boolean => {
                        return !item.deleted && ContactOfContactModel.canViewChronologyChart(this.authUser);
                    }
                }),

                // Restore a deleted contact
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_CONTACT_OF_CONTACTS',
                    click: (item: ContactOfContactModel) => {
                        this.restoreContactOfContact(item);
                    },
                    visible: (item: ContactOfContactModel): boolean => {
                        return item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactOfContactModel.canRestore(this.authUser);
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
        private contactsOfContactsDataService: ContactsOfContactsDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService,
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
        // add page title
        this.contactsOfContactsDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE') +
            ' - ' +
            this.contactsOfContactsDataExportFileName;

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
        this.riskLevelRefData$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.RISK_LEVEL).pipe(share());
        this.riskLevelsList$ = this.riskLevelRefData$
            .pipe(
                map((data: ReferenceDataCategoryModel) => {
                    return _.map(data.entries, (entry: ReferenceDataEntryModel) =>
                        new LabelValuePair(entry.value, entry.id, null, null, entry.iconUrl)
                    );
                })
            );
        this.riskLevelRefData$.subscribe((riskCategory: ReferenceDataCategoryModel) => {
            this.riskLevelsListMap = _.transform(
                riskCategory.entries,
                (result, entry: ReferenceDataEntryModel) => {
                    // groupBy won't work here since groupBy will put an array instead of one value
                    result[entry.id] = entry;
                },
                {}
            );
        });

        // yes / no
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // subscribe to the Selected Outbreak
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // export contacts url
                this.exportContactsOfContactsUrl = null;
                if (
                    this.selectedOutbreak &&
                    this.selectedOutbreak.id
                ) {
                    this.exportContactsOfContactsUrl = `outbreaks/${this.selectedOutbreak.id}/contacts-of-contacts/export`;

                    // initialize side filters
                    this.initializeSideFilters();
                }

                // get contacts grouped by risk level
                this.getContactsOfContactsGroupedByRiskLevel();

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * Component destroyed
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
                field: 'lastName',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'firstName',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'visualId',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID'
            }),
            new VisibleColumnModel({
                field: 'location',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_LOCATION'
            }),
            new VisibleColumnModel({
                field: 'age',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE'
            }),
            new VisibleColumnModel({
                field: 'gender',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER'
            }),
            new VisibleColumnModel({
                field: 'phoneNumber',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER'
            }),
            new VisibleColumnModel({
                field: 'riskLevel',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL'
            }),
            new VisibleColumnModel({
                field: 'dateOfLastContact',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT'
            }),
            new VisibleColumnModel({
                field: 'numberOfExposures',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'deleted',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DELETED'
            }),
            new VisibleColumnModel({
                field: 'createdBy',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdAt',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_AT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedBy',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedAt',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_AT',
                visible: false
            })
        ];
    }

    /**
     * Initialize Side Filters
     */
    initializeSideFilters() {
        const occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);

        // set available side filters
        this.availableSideFilters = [
            // Contact
            new FilterModel({
                fieldName: 'firstName',
                fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'lastName',
                fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'occupation',
                fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION',
                type: FilterType.MULTISELECT,
                options$: occupationsList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'age',
                fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',
                type: FilterType.RANGE_AGE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'dateOfReporting',
                fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'dob',
                fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'visualId',
                fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
                type: FilterType.TEXT
            }),
            new FilterModel({
                fieldName: 'addresses',
                fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_LOCATION',
                type: FilterType.ADDRESS,
                addressFieldIsArray: true
            }),
            new FilterModel({
                fieldName: 'addresses',
                fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER',
                type: FilterType.ADDRESS_PHONE_NUMBER,
                addressFieldIsArray: true
            }),
            new FilterModel({
                fieldName: 'dateOfLastContact',
                fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
                type: FilterType.RANGE_DATE,
                sortable: true
            })
        ];
    }

    /**
     * Re(load) the Contacts list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            // refresh list of contacts grouped by risk level
            this.getContactsOfContactsGroupedByRiskLevel();

            // retrieve created user & modified user information
            this.queryBuilder.include('createdByUser', true);
            this.queryBuilder.include('updatedByUser', true);

            // retrieve location list
            this.queryBuilder.include('locations', true);

            // retrieve number of contacts & exposures for each record
            const clonedQb = _.cloneDeep(this.queryBuilder);
            clonedQb.filter.flag(
                'countRelations',
                true
            );

            // retrieve the list of Contacts
            this.contactsOfContactsList$ = this.contactsOfContactsDataService
                .getContactsOfContactsList(this.selectedOutbreak.id, clonedQb)
                .pipe(
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
            this.contactsOfContactsListCount$ = this.contactsOfContactsDataService.getContactsOfContactsCount(this.selectedOutbreak.id, countQueryBuilder).pipe(share());
        }
    }

    /**
     * Get contacts grouped by risk level
     */
    getContactsOfContactsGroupedByRiskLevel() {
        if (this.selectedOutbreak) {
            this.countedContactsOfContactsByRiskLevel$ = this.riskLevelRefData$
                .pipe(
                    mergeMap((refRiskLevel: ReferenceDataCategoryModel) => {
                        return this.contactsOfContactsDataService
                            .getContactsOfContactsGroupedByRiskLevel(this.selectedOutbreak.id, this.queryBuilder)
                            .pipe(
                                map((data: RiskLevelGroupModel) => {
                                    return _.map(data ? data.riskLevels : [], (item: RiskLevelModel, itemId) => {
                                        const refItem: ReferenceDataEntryModel = _.find(refRiskLevel.entries, {id: itemId}) as ReferenceDataEntryModel;
                                        return new CountedItemsListItem(
                                            item.count,
                                            itemId as any,
                                            item.contactIDs,
                                            refItem ?
                                                refItem.getColorCode() :
                                                Constants.DEFAULT_COLOR_REF_DATA
                                        );
                                    });
                                })
                            );
                    })
                );
        }
    }

    /**
     * Retrieve risk color accordingly to risk level
     * @param item
     */
    getRiskColor(item: ContactOfContactModel) {
        // get risk data color
        const riskData = _.get(this.riskLevelsListMap, item.riskLevel);
        if (riskData) {
            return riskData.colorCode ? riskData.colorCode : '';
        }

        // if we don't have risk data?
        return '';
    }

    /**
     * Delete specific contact that belongs to the selected outbreak
     * @param {ContactOfContactModel} contactOfContact
     */
    deleteContactOfContact(contactOfContact: ContactOfContactModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CONTACT_OF_CONTACT', contactOfContact)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete contact
                    this.contactsOfContactsDataService
                        .deleteContactOfContact(this.selectedOutbreak.id, contactOfContact.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Restore contact of contact
     * @param contactOfContact
     */
    restoreContactOfContact(contactOfContact: ContactOfContactModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_CONTACT_OF_CONTACT', new ContactOfContactModel(contactOfContact))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.contactsOfContactsDataService
                        .restoreContactOfContact(this.selectedOutbreak.id, contactOfContact.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CONTACTS_ACTION_RESTORE_SUCCESS_MESSAGE');
                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Export selected records
     */
    exportSelectedContactsOfContacts() {
        // get list of contacts that we want to export
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
            message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_TITLE',
            url: this.exportContactsOfContactsUrl,
            fileName: this.contactsOfContactsDataExportFileName,

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
     * Export contacts dossier
     */
    exportSelectedContactsOfContactsDossier() {
        // get list of selected ids
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // display export only if we have a selected outbreak
        if (this.selectedOutbreak) {
            // remove id from list
            const anonymizeFields = _.filter(this.anonymizeFields, (value: LabelValuePair) => {
                return value.value !== 'id';
            });

            // display export dialog
            this.dialogService.showExportDialog({
                message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_DOSSIER_DIALOG_TITLE',
                url: `outbreaks/${this.selectedOutbreak.id}/contacts-of-contacts/dossier`,
                fileName: this.contactsOfContactsDataExportFileName,
                fileType: ExportDataExtension.ZIP,
                displayAnonymize: true,
                anonymizeFields: anonymizeFields,
                anonymizeFieldsKey: 'data',
                extraAPIData: {
                    contactsOfContacts: selectedRecords
                },
                isPOST: true,
                exportStart: () => { this.showLoadingDialog(); },
                exportFinished: () => { this.closeLoadingDialog(); }
            });
        }
    }

    /**
     * Export relationships for selected contacts
     */
    exportSelectedContactsOfContactsRelationship() {
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
            EntityType.CONTACT_OF_CONTACT
        );

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIPS_TITLE',
            url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
            fileName: this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME'),

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
     * Export Contact Relationships
     */
    exportFilteredContactsRelationships() {
        // construct filter by case query builder
        const qb = new RequestQueryBuilder();
        const personsQb = qb.addChildQueryBuilder('person');

        // merge query builder
        personsQb.merge(this.queryBuilder);

        // remove pagination
        personsQb.paginator.clear();

        // retrieve relationships conditions & remove them so we can check if we need to filter by contacts
        const relationships: RequestRelationBuilder = personsQb.include('relationships');
        personsQb.removeRelation('relationships');

        // filter contacts
        personsQb.filter.byEquality(
            'type',
            EntityType.CONTACT_OF_CONTACT
        );

        // relationships
        if (!relationships.queryBuilder.isEmpty()) {
            // filter by people
            const people = relationships.queryBuilder.include('people');
            if (!people.queryBuilder.isEmpty()) {
                // merge contact & case conditions
                const contactConditions = personsQb.filter.generateCondition();
                personsQb.filter.clear();
                personsQb.filter.where({
                    or: [
                        contactConditions, {
                            and: [
                                { type: EntityType.CASE },
                                people.queryBuilder.filter.generateCondition()
                            ]
                        }
                    ]
                });
            }
        }

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIPS_TITLE',
            url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
            fileName: this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME'),

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
     * Filter by locations selected in location-drop-down
     * @param locations
     */
    filterByLocation(locations) {
        // remove previous condition
        this.queryBuilder.filter.remove('addresses');
        if (!_.isEmpty(locations)) {
            // mapping all the locations to get the ids
            const locationsIds = _.map(locations, (location) => {
                return location.id;
            });

            // build query
            this.queryBuilder.filter.where({
                addresses: {
                    elemMatch: {
                        typeId: AddressType.CURRENT_ADDRESS,
                        parentLocationIdFilter: {
                            $in: locationsIds
                        }
                    }
                }
            });
        }

        // refresh list
        this.needsRefreshList();
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
     * Modify selected contact of contacts
     */
    bulkModifyContactOfContacts() {
        // get list of contacts that we want to modify
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // redirect to modify contacts page
        this.router.navigate(
            ['/contacts-of-contacts', 'modify-bulk'], {
                queryParams: {
                    contactOfContactIds: JSON.stringify(selectedRecords),
                }
            }
        );
    }

    /**
     * Display exposures popup
     */
    displayExposures(entity: ContactOfContactModel) {
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
     * Redirect to import relationship page
     */
    goToRelationshipImportPage() {
        this.router.navigate(['/import-export-data', 'relationships', 'import'], {
            queryParams: {
                from: Constants.APP_PAGE.CONTACTS_OF_CONTACTS.value
            }
        });
    }
}

import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable, throwError } from 'rxjs';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, DialogField, HoverRowAction, HoverRowActionType, LoadingDialogModel } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { RequestQueryBuilder, RequestRelationBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Constants } from '../../../../core/models/constants';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { catchError, map, share, tap } from 'rxjs/operators';
import { RequestFilter } from '../../../../core/helperClasses/request-query-builder/request-filter';
import { moment } from '../../../../core/helperClasses/x-moment';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { AddressType } from '../../../../core/models/address.model';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { CaseModel } from '../../../../core/models/case.model';

@Component({
    selector: 'app-contacts-of-contacts-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-of-contacts-list.component.html',
    styleUrls: ['./contacts-of-contacts-list.component.less']
})
export class ContactsOfContactsListComponent extends ListComponent implements OnInit, OnDestroy {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE', '.', true)
    ];

    // constants
    Constants = Constants;

    // authenticated user
    authUser: UserModel;

    // list of existing contacts
    contactsOfContactsList$: Observable<ContactModel[]>;
    contactsListCount$: Observable<any>;

    outbreakSubscriber: Subscription;

    // user list
    userList$: Observable<UserModel[]>;

    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // gender list
    genderList$: Observable<any[]>;

    // contacts grouped by risk level
    countedContactsByRiskLevel$: Observable<any[]>;

    // risk level
    riskLevelRefData$: Observable<ReferenceDataCategoryModel>;
    riskLevelsList$: Observable<any[]>;
    riskLevelsListMap: { [id: string]: ReferenceDataEntryModel };

    // final contact follow-up status
    finalFollowUpStatus$: Observable<any[]>;

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

    // print daily follow-ups status
    exportContactsDailyFollowUpListUrl: string;
    exportContactsDailyFollowUpListFileName: string;
    exportContactsDailyFollowUpListFileType: ExportDataExtension = ExportDataExtension.PDF;
    exportContactsDailyFollowUpListDialogFields: DialogField[];

    // print daily follow-ups form
    exportContactsDailyFollowUpsFormUrl: string;
    exportContactsDailyFollowUpsFormFileName: string;
    exportContactsDailyFollowUpsFormFileType: ExportDataExtension = ExportDataExtension.PDF;

    exportContactsUrl: string;
    contactsDataExportFileName: string = moment().format('YYYY-MM-DD');
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
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_ID', 'id'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_FIRST_NAME', 'firstName'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_MIDDLE_NAME', 'middleName'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_LAST_NAME', 'lastName'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_GENDER', 'gender'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER', 'phoneNumber'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_OCCUPATION', 'occupation'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH', 'dob'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_AGE', 'age'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DOCUMENTS', 'documents'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_ADDRESSES', 'addresses'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_RISK_LEVEL', 'riskLevel'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_RISK_REASON', 'riskReason'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_TYPE', 'type'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING', 'dateOfReporting'),
        new LabelValuePair('LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', 'isDateOfReportingApproximate'),
    ];

    loadingDialog: LoadingDialogModel;

    recordActions: HoverRowAction[] = [
        // View Contact
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_CONTACT',
            click: (item: ContactModel) => {
                this.router.navigate(['/contacts-of-contacts', item.id, 'view']);
            },
            visible: (item: ContactModel): boolean => {
                return !item.deleted;
            }
        }),

        // Modify Contact
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_MODIFY_CONTACT',
            click: (item: ContactModel) => {
                this.router.navigate(['/contacts-of-contacts', item.id, 'modify']);
            },
            visible: (item: ContactModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id
                    // &&
                    // this.hasContactOfContactWriteAccess();
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Contact
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_CONTACT',
                    click: (item: ContactModel) => {
                        this.deleteContact(item);
                    },
                    visible: (item: ContactModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id
                            // &&
                            // this.hasContactOfContactWriteAccess();
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: ContactModel): boolean => {
                        // visible only if at least one of the first two items is visible
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id
                            // &&
                            // this.hasContactOfContactWriteAccess();
                    }
                }),

                // // Add Follow-up to Contact
                // new HoverRowAction({
                //     menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_ADD_FOLLOW_UP',
                //     click: (item: ContactModel) => {
                //         this.router.navigate(['/contacts', item.id, 'follow-ups', 'create']);
                //     },
                //     visible: (item: ContactModel): boolean => {
                //         return !item.deleted &&
                //             this.authUser &&
                //             this.selectedOutbreak &&
                //             this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                //             this.hasContactOfContactWriteAccess()
                //             // &&
                //             // this.hasFollowUpWriteAccess();
                //     }
                // }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: ContactModel): boolean => {
                        // visible only if at least one of the first two items is visible
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id
                            // &&
                            // this.hasContactOfContactWriteAccess()
                            // &&
                            // this.hasFollowUpWriteAccess();
                    }
                }),

                // See contact exposures
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
                    click: (item: ContactModel) => {
                        this.router.navigate(['/relationships', EntityType.CONTACT, item.id, 'exposures']);
                    },
                    visible: (item: ContactModel): boolean => {
                        return !item.deleted;
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: ContactModel): boolean => {
                        // visible only if at least one of the previous...
                        return !item.deleted;
                    }
                }),

                // // See contact follow-us
                // new HoverRowAction({
                //     menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_ACTION_VIEW_FOLLOW_UPS',
                //     click: (item: ContactModel) => {
                //         this.router.navigate(['/contacts', 'contact-related-follow-ups', item.id]);
                //     },
                //     visible: (item: ContactModel): boolean => {
                //         return !item.deleted
                //             // &&
                //             // this.hasContactFollowUpReadAccess();
                //     }
                // }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: ContactModel): boolean => {
                        // visible only if at least one of the previous...
                        return !item.deleted
                            // &&
                            // this.hasContactFollowUpReadAccess();
                    }
                }),

                // View Contact movement map
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_MOVEMENT',
                    click: (item: ContactModel) => {
                        this.router.navigate(['/contacts', item.id, 'movement']);
                    },
                    visible: (item: ContactModel): boolean => {
                        return !item.deleted;
                    }
                }),

                // View Contact chronology timeline
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_CHRONOLOGY',
                    click: (item: ContactModel) => {
                        this.router.navigate(['/contacts', item.id, 'chronology']);
                    },
                    visible: (item: ContactModel): boolean => {
                        return !item.deleted;
                    }
                }),

                // Restore a deleted contact
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_CONTACT',
                    click: (item: ContactModel) => {
                        this.restoreContact(item);
                    },
                    visible: (item: ContactModel): boolean => {
                        return item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id
                            // &&
                            // this.hasContactWriteAccess();
                    },
                    class: 'mat-menu-item-restore'
                })
            ]
        })
    ];

    constructor(
        private router: Router,
        private contactsOfContactsDataService: ContactsOfContactsDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private route: ActivatedRoute,
        private dialogService: DialogService,
        protected listFilterDataService: ListFilterDataService,
        private i18nService: I18nService,
        private userDataService: UserDataService,
        private entityHelperService: EntityHelperService
    ) {
        super(
            snackbarService,
            listFilterDataService,
            route.queryParams
        );
    }

    ngOnInit() {
        // add page title
        this.contactsDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_TITLE') +
            ' - ' +
            this.contactsDataExportFileName;

        // export file names
        this.exportContactsDailyFollowUpListFileName = this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_DAILY_FOLLOW_UP_LIST_TITLE') +
            ' - ' +
            moment().format('YYYY-MM-DD');
        this.exportContactsDailyFollowUpsFormFileName = this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_DAILY_FOLLOW_UPS_FORM_TITLE') +
            ' - ' +
            moment().format('YYYY-MM-DD');

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        // dialog fields for daily follow-ups print
        this.genericDataService
            .getRangeFollowUpGroupByOptions(true)
            .subscribe((options) => {
                this.exportContactsDailyFollowUpListDialogFields = [
                    new DialogField({
                        name: 'groupBy',
                        placeholder: 'LNG_PAGE_LIST_CONTACTS_EXPORT_FOLLOW_UPS_GROUP_BY_BUTTON',
                        inputOptions: options,
                        value: Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE.value,
                        required: true
                    })
                ];
            });

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
        this.finalFollowUpStatus$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS);
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
                this.exportContactsUrl = null;
                this.exportContactsDailyFollowUpListUrl = null;
                this.exportContactsDailyFollowUpsFormUrl = null;
                if (
                    this.selectedOutbreak &&
                    this.selectedOutbreak.id
                ) {
                    this.exportContactsUrl = `/outbreaks/${this.selectedOutbreak.id}/contacts/export`;
                    this.exportContactsDailyFollowUpListUrl = `/outbreaks/${this.selectedOutbreak.id}/contacts/daily-list/export`;
                    this.exportContactsDailyFollowUpsFormUrl = `/outbreaks/${this.selectedOutbreak.id}/contacts/export-daily-follow-up-form`;

                    // initialize side filters
                    this.initializeSideFilters();
                }

                // // get contacts grouped by risk level
                // this.getContactsGroupedByRiskLevel();

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
            // new VisibleColumnModel({
            //     field: 'followUp.endDate',
            //     label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_END_DATE'
            // }),
            // new VisibleColumnModel({
            //     field: 'followUp.status',
            //     label: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS'
            // }),
            new VisibleColumnModel({
                field: 'wasCase',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CASE'
            }),
            new VisibleColumnModel({
                field: 'numberOfContacts',
                label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS',
                visible: false
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
        const dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);

        // case condition
        const caseCondition = new RequestQueryBuilder();
        caseCondition.filter.byEquality(
            'type',
            EntityType.CASE
        );

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

            // new FilterModel({
            //     fieldName: 'followUp.status',
            //     fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
            //     type: FilterType.MULTISELECT,
            //     options$: this.finalFollowUpStatus$,
            //     sortable: true
            // }),
            // new FilterModel({
            //     fieldName: 'followUp.endDate',
            //     fieldLabel: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FOLLOW_UP_END_DATE',
            //     type: FilterType.RANGE_DATE,
            //     sortable: true
            // }),
        ];

        // Relation - Follow-up
        // if (this.authUser.hasPermissions(PERMISSION.READ_FOLLOWUP)) {
        //     this.availableSideFilters = [
        //         ...this.availableSideFilters,
        //         ...[
        //             new FilterModel({
        //                 fieldName: 'date',
        //                 fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
        //                 type: FilterType.RANGE_DATE,
        //                 relationshipPath: ['followUps'],
        //                 relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        //             }),
        //             new FilterModel({
        //                 fieldName: 'index',
        //                 fieldLabel: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
        //                 type: FilterType.NUMBER,
        //                 relationshipPath: ['followUps'],
        //                 relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        //             }),
        //             new FilterModel({
        //                 fieldName: 'targeted',
        //                 fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
        //                 type: FilterType.SELECT,
        //                 options$: this.yesNoOptionsList$,
        //                 relationshipPath: ['followUps'],
        //                 relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        //             }),
        //             new FilterModel({
        //                 fieldName: 'statusId',
        //                 fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
        //                 type: FilterType.SELECT,
        //                 options$: dailyStatusTypeOptions$,
        //                 relationshipPath: ['followUps'],
        //                 relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        //             }),
        //             new FilterModel({
        //                 fieldName: 'questionnaireAnswers',
        //                 fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        //                 type: FilterType.QUESTIONNAIRE_ANSWERS,
        //                 questionnaireTemplate: this.selectedOutbreak.contactFollowUpTemplate,
        //                 relationshipPath: ['followUps'],
        //                 relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_FOLLOW_UPS'
        //             })
        //         ]
        //     ];
        // }

        // Relation - Cases
        if (CaseModel.canList(this.authUser)) {
            this.availableSideFilters = [
                ...this.availableSideFilters,
                ...[
                    new FilterModel({
                        fieldName: 'firstName',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
                        type: FilterType.TEXT,
                        relationshipPath: ['relationships', 'people'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
                        extraConditions: caseCondition
                    }),
                    new FilterModel({
                        fieldName: 'lastName',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
                        type: FilterType.TEXT,
                        relationshipPath: ['relationships', 'people'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
                        extraConditions: caseCondition
                    }),
                    new FilterModel({
                        fieldName: 'gender',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_GENDER',
                        type: FilterType.MULTISELECT,
                        options$: this.genderList$,
                        relationshipPath: ['relationships', 'people'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
                        extraConditions: caseCondition
                    }),
                    new FilterModel({
                        fieldName: 'age',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_AGE',
                        type: FilterType.RANGE_AGE,
                        relationshipPath: ['relationships', 'people'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
                        extraConditions: caseCondition
                    }),
                    new FilterModel({
                        fieldName: 'questionnaireAnswers',
                        fieldLabel: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
                        type: FilterType.QUESTIONNAIRE_ANSWERS,
                        questionnaireTemplate: this.selectedOutbreak.caseInvestigationTemplate,
                        relationshipPath: ['relationships', 'people'],
                        relationshipLabel: 'LNG_CONTACT_FIELD_RELATIONSHIP_LABEL_RELATIONSHIP_CASES',
                        extraConditions: caseCondition
                    })
                ]
            ];
        }
    }

    /**
     * Re(load) the Contacts list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            // refresh list of contacts grouped by risk level
            // this.getContactsGroupedByRiskLevel();

            // retrieve created user & modified user information
            this.queryBuilder.include('createdByUser', true);
            this.queryBuilder.include('updatedByUser', true);

            // retrieve location list
            this.queryBuilder.include('locations', true);

            // retrieve number of contacts & exposures for each record
            this.queryBuilder.filter.flag(
                'countRelations',
                true
            );

            // retrieve the list of Contacts
            this.contactsOfContactsList$ = this.contactsOfContactsDataService
                .getContactsList(this.selectedOutbreak.id, this.queryBuilder)
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
            this.contactsListCount$ = this.contactsOfContactsDataService.getContactsCount(this.selectedOutbreak.id, countQueryBuilder).pipe(share());
        }
    }

    // /**
    //  * Get contacts grouped by risk level
    //  */
    // getContactsGroupedByRiskLevel() {
    //     if (this.selectedOutbreak) {
    //         this.countedContactsByRiskLevel$ = this.riskLevelRefData$
    //             .pipe(
    //                 mergeMap((refRiskLevel: ReferenceDataCategoryModel) => {
    //                     return this.contactDataService
    //                         .getContactsGroupedByRiskLevel(this.selectedOutbreak.id, this.queryBuilder)
    //                         .pipe(
    //                             map((data: RiskLevelGroupModel) => {
    //                                 return _.map(data ? data.riskLevels : [], (item: RiskLevelModel, itemId) => {
    //                                     const refItem: ReferenceDataEntryModel = _.find(refRiskLevel.entries, {id: itemId}) as ReferenceDataEntryModel;
    //                                     return new CountedItemsListItem(
    //                                         item.count,
    //                                         itemId as any,
    //                                         item.contactIDs,
    //                                         refItem ?
    //                                             refItem.getColorCode() :
    //                                             Constants.DEFAULT_COLOR_REF_DATA
    //                                     );
    //                                 });
    //                             })
    //                         );
    //                 })
    //             );
    //     }
    // }

        // /**
    //  * Check if we have write access to follow-ups
    //  * @returns {boolean}
    //  */
    // hasFollowUpWriteAccess(): boolean {
    //     return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
    // }

    // /**
    //  * Check if we have access view a contact follow-up
    //  * @returns {boolean}
    //  */
    // hasContactFollowUpReadAccess(): boolean {
    //     return this.authUser.hasPermissions(PERMISSION.READ_FOLLOWUP);
    // }

    /**
     * Retrieve risk color accordingly to risk level
     * @param item
     */
    getRiskColor(item: ContactModel) {
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
     * @param {ContactModel} contact
     */
    deleteContact(contact: ContactModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CONTACT', contact)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete contact
                    this.contactsOfContactsDataService
                        .deleteContact(this.selectedOutbreak.id, contact.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CONTACTS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    restoreContact(contact: ContactModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_CONTACT', new ContactModel(contact))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.contactsOfContactsDataService
                        .restoreContact(this.selectedOutbreak.id, contact.id)
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
    exportSelectedContacts() {
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
            message: 'LNG_PAGE_LIST_CASES_EXPORT_TITLE',
            url: this.exportContactsUrl,
            fileName: this.contactsDataExportFileName,

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
    exportSelectedContactsDossier() {
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
                message: 'LNG_PAGE_LIST_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_DOSSIER_DIALOG_TITLE',
                url: `outbreaks/${this.selectedOutbreak.id}/contacts/dossier`,
                fileName: this.contactsDataExportFileName,
                fileType: ExportDataExtension.ZIP,
                displayAnonymize: true,
                anonymizeFields: anonymizeFields,
                anonymizeFieldsKey: 'data',
                extraAPIData: {
                    contacts: selectedRecords
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
    exportSelectedContactsRelationship() {
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
            EntityType.CONTACT
        );

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIPS_TITLE',
            url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
            fileName: this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME'),

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

        // remove follow-ups filter
        const followUps: RequestRelationBuilder = personsQb.include('followUps');
        personsQb.removeRelation('followUps');

        // check if we have anything to filter by follow-ups
        if (!followUps.queryBuilder.isEmpty()) {
            const followUpQb = qb.addChildQueryBuilder('followUp');
            followUpQb.merge(followUps.queryBuilder);
        }

        // retrieve relationships conditions & remove them so we can check if we need to filter by contacts
        const relationships: RequestRelationBuilder = personsQb.include('relationships');
        personsQb.removeRelation('relationships');

        // filter contacts
        personsQb.filter.byEquality(
            'type',
            EntityType.CONTACT
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
            message: 'LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIPS_TITLE',
            url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
            fileName: this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME'),

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
     * Filter by phone number
     */
    filterByPhoneNumber(value: string) {
        // remove previous condition
        this.queryBuilder.filter.remove('addresses');

        if (!_.isEmpty(value)) {
            // add new condition
            this.queryBuilder.filter.where({
                addresses: {
                    elemMatch: {
                        phoneNumber: {
                            $regex: RequestFilter.escapeStringForRegex(value)
                                .replace(/%/g, '.*')
                                .replace(/\\\?/g, '.'),
                            $options: 'i'
                        }
                    }
                }
            });
        }

        // refresh list
        this.needsRefreshList();
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
     * Modify selected contacts
     */
    bulkModifyContacts() {
        // get list of contacts that we want to modify
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // redirect to modify contacts page
        this.router.navigate(
            ['/contacts', 'modify-bulk'], {
                queryParams: {
                    contactIds: JSON.stringify(selectedRecords)
                }
            }
        );
    }

    // /**
    //  * Change Contact Followup status for all records matching this.queryBuilder
    //  */
    // changeContactFinalFollowUpStatus() {
    //     // to continue we need to make sure we have an outbreak selected
    //     if (
    //         !this.selectedOutbreak ||
    //         !this.selectedOutbreak.id
    //     ) {
    //         return;
    //     }
    //
    //     // construct query builder user to count & update contacts
    //     const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    //     countQueryBuilder.paginator.clear();
    //     countQueryBuilder.sort.clear();
    //     countQueryBuilder.fields('id', 'followUp');
    //
    //     // display loading while determining how many records will be deleted
    //     this.showLoadingDialog();
    //
    //     // make all requests in parallel
    //     forkJoin(
    //         // retrieve follow-up statuses
    //         this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS),
    //
    //         // count contacts
    //         this.contactDataService.getContactsList(this.selectedOutbreak.id, countQueryBuilder)
    //     ).subscribe((
    //         [statuses, records]: [LabelValuePair[], ContactModel[]]
    //     ) => {
    //         // hide loading
    //         this.closeLoadingDialog();
    //
    //         // display change status dialog
    //         this.dialogService
    //             .showInput(
    //                 new DialogConfiguration({
    //                     message: 'LNG_PAGE_LIST_CONTACTS_ACTION_CHANGE_CONTACT_FINAL_FOLLOW_UP_STATUS_DIALOG_TITLE',
    //                     translateData: {
    //                         count: records.length
    //                     },
    //                     yesLabel: 'LNG_COMMON_BUTTON_UPDATE',
    //                     fieldsList: [
    //                         new DialogField({
    //                             name: 'followUp.status',
    //                             placeholder: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS',
    //                             description: 'LNG_CONTACT_FIELD_LABEL_FOLLOW_UP_STATUS_DESCRIPTION',
    //                             required: true,
    //                             fieldType: DialogFieldType.SELECT,
    //                             inputOptionsMultiple: false,
    //                             inputOptionsClearable: false,
    //                             inputOptions: statuses
    //                         })
    //                     ]
    //                 })
    //             )
    //             .subscribe((answer: DialogAnswer) => {
    //                 if (answer.button === DialogAnswerButton.Yes) {
    //                     // update contacts
    //                     const putRecordsData = records.map((contact: ContactModel) => ({
    //                         id: contact.id,
    //                         followUp: Object.assign(
    //                             contact.followUp, {
    //                                 status: answer.inputValue.value.followUp.status
    //                             }
    //                         )
    //                     }));
    //
    //                     // display loading while determining how many records will be deleted
    //                     this.showLoadingDialog();
    //
    //                     // update statuses
    //                     this.contactDataService
    //                         .bulkModifyContacts(
    //                             this.selectedOutbreak.id,
    //                             putRecordsData
    //                         )
    //                         .pipe(
    //                             catchError((err) => {
    //                                 this.closeLoadingDialog();
    //                                 this.snackbarService.showApiError(err);
    //                                 return throwError(err);
    //                             })
    //                         )
    //                         .subscribe(() => {
    //                             // success message
    //                             this.snackbarService.showSuccess(
    //                                 'LNG_PAGE_BULK_MODIFY_CONTACTS_ACTION_MODIFY_CONTACTS_SUCCESS_MESSAGE', {
    //                                     count: records.length
    //                                 }
    //                             );
    //
    //                             // close dialog
    //                             this.closeLoadingDialog();
    //
    //                             // refresh list
    //                             this.needsRefreshList(true);
    //                         });
    //                 }
    //             });
    //     });
    // }

    /**
     * Display contacts popup
     */
    displayContacts(entity: ContactModel) {
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
    displayExposures(entity: ContactModel) {
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

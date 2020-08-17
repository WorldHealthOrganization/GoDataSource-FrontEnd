import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable, Subscription } from 'rxjs';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, DialogField, HoverRowAction, HoverRowActionType, LoadingDialogModel } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { FilterType, FilterModel } from '../../../../shared/components/side-filters/model';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Router } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import * as _ from 'lodash';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { CountedItemsListItem } from '../../../../shared/components/counted-items-list/counted-items-list.component';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { catchError, map, mergeMap, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { moment } from '../../../../core/helperClasses/x-moment';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AddressType } from '../../../../core/models/address.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ContactModel } from '../../../../core/models/contact.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
    selector: 'app-cases-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-list.component.html',
    styleUrls: ['./cases-list.component.less']
})
export class CasesListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    // list of existing cases
    casesList$: Observable<CaseModel[]>;
    casesListCount$: Observable<IBasicCount>;

    // don't display pills by default
    showCountPills: boolean = false;

    // user list
    userList$: Observable<UserModel[]>;

    caseClassifications$: Observable<any>;
    // cases grouped by classification
    countedCasesGroupedByClassification$: Observable<any>;

    caseClassificationsList$: Observable<any[]>;
    caseClassificationsListMap: { [id: string]: ReferenceDataEntryModel };
    genderList$: Observable<any[]>;
    yesNoOptionsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    outcomeList$: Observable<any[]>;
    pregnancyStatsList$: Observable<any[]>;

    // vaccines
    vaccineList$: Observable<any[]>;
    vaccineStatusList$: Observable<any[]>;

    clustersListAsLabelValuePair$: Observable<LabelValuePair[]>;
    caseRiskLevelsList$: Observable<any[]>;
    yesNoOptionsWithoutAllList$: Observable<any[]>;

    // available side filters
    availableSideFilters: FilterModel[] = [];
    // saved filters type
    savedFiltersType = Constants.APP_PAGE.CASES.value;

    // provide constants to template
    Constants = Constants;
    EntityType = EntityType;
    UserSettings = UserSettings;
    ReferenceDataCategory = ReferenceDataCategory;
    LabResultModel = LabResultModel;
    CaseModel = CaseModel;
    OutbreakModel = OutbreakModel;

    notACaseFilter: boolean | string = false;

    exportCasesUrl: string;
    casesDataExportFileName: string = moment().format('YYYY-MM-DD');
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

    // subscribers
    outbreakSubscriber: Subscription;

    loadingDialog: LoadingDialogModel;

    recordActions: HoverRowAction[] = [
        // View Case
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_CASES_ACTION_VIEW_CASE',
            click: (item: CaseModel) => {
                this.router.navigate(['/cases', item.id, 'view']);
            },
            visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                    CaseModel.canView(this.authUser);
            }
        }),

        // Modify Case
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_CASES_ACTION_MODIFY_CASE',
            click: (item: CaseModel) => {
                this.router.navigate(['/cases', item.id, 'modify']);
            },
            visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    CaseModel.canModify(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Case
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_ACTION_DELETE_CASE',
                    click: (item: CaseModel) => {
                        this.deleteCase(item);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            CaseModel.canDelete(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: CaseModel): boolean => {
                        // visible only if at least one of the first two items is visible
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            CaseModel.canDelete(this.authUser);
                    }
                }),

                // Convert Case To Contact
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_ACTION_CONVERT_TO_CONTACT',
                    click: (item: CaseModel) => {
                        this.convertCaseToContact(item);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            CaseModel.canConvertToContact(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: CaseModel): boolean => {
                        // visible only if at least one of the first two items is visible
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            CaseModel.canConvertToContact(this.authUser);
                    }
                }),

                // Add Contact to Case
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_ADD_CONTACT',
                    click: (item: CaseModel) => {
                        this.router.navigate(['/contacts', 'create'], {
                            queryParams: {
                                entityType: EntityType.CASE,
                                entityId: item.id
                            }
                        });
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactModel.canCreate(this.authUser) &&
                            CaseModel.canCreateContact(this.authUser);
                    }
                }),

                // Bulk add contacts to case
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_BULK_ADD_CONTACTS',
                    click: (item: CaseModel) => {
                        this.router.navigate(['/contacts', 'create-bulk'], {
                            queryParams: {
                                entityType: EntityType.CASE,
                                entityId: item.id
                            }
                        });
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ContactModel.canBulkCreate(this.authUser) &&
                            CaseModel.canBulkCreateContact(this.authUser);
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: CaseModel): boolean => {
                        // visible only if at least one of the previous two items is visible
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id && (
                                (
                                    ContactModel.canCreate(this.authUser) &&
                                    CaseModel.canCreateContact(this.authUser)
                                ) || (
                                    ContactModel.canBulkCreate(this.authUser) &&
                                    CaseModel.canBulkCreateContact(this.authUser)
                                )
                            );
                    }
                }),

                // See case contacts..
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM',
                    click: (item: CaseModel) => {
                        this.router.navigate(['/relationships', EntityType.CASE, item.id, 'contacts']);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            RelationshipModel.canList(this.authUser) &&
                            CaseModel.canListRelationshipContacts(this.authUser);
                    }
                }),

                // See case exposures
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO',
                    click: (item: CaseModel) => {
                        this.router.navigate(['/relationships', EntityType.CASE, item.id, 'exposures']);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            RelationshipModel.canList(this.authUser) &&
                            CaseModel.canListRelationshipExposures(this.authUser);
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: CaseModel): boolean => {
                        // visible only if at least one of the previous two items is visible
                        return !item.deleted &&
                            RelationshipModel.canList(this.authUser) && (
                                CaseModel.canListRelationshipContacts(this.authUser) ||
                                CaseModel.canListRelationshipExposures(this.authUser)
                            );
                    }
                }),

                // See records detected by the system as duplicates but they were marked as not duplicates
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_ACTION_SEE_RECORDS_NOT_DUPLICATES',
                    click: (item: CaseModel) => {
                        this.router.navigate(['/duplicated-records/cases', item.id, 'marked-not-duplicates']);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted;
                    }
                }),

                // See case lab results
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_ACTION_SEE_LAB_RESULTS',
                    click: (item: CaseModel) => {
                        this.router.navigate(['/lab-results', 'cases', item.id]);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            LabResultModel.canList(this.authUser) &&
                            CaseModel.canListLabResult(this.authUser);
                    }
                }),

                // See contacts follow-us belonging to this case
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_ACTION_VIEW_FOLLOW_UPS',
                    click: (item: CaseModel) => {
                        this.router.navigate(['/contacts', 'case-related-follow-ups', item.id]);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            FollowUpModel.canList(this.authUser);
                    }
                }),

                // See questionnaire
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_MODIFY_CASE_TAB_QUESTIONNAIRE_TITLE',
                    click: (item: CaseModel) => {
                        this.router.navigate(['/cases', item.id , 'view-questionnaire']);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            CaseModel.canView(this.authUser);
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: CaseModel): boolean => {
                        // visible only if at least one of the previous two items is visible
                        return !item.deleted && (
                            LabResultModel.canList(this.authUser) ||
                            FollowUpModel.canList(this.authUser)
                        );
                    }
                }),

                // View Case movement map
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_ACTION_VIEW_MOVEMENT',
                    click: (item: CaseModel) => {
                        this.router.navigate(['/cases', item.id, 'movement']);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            CaseModel.canViewMovementMap(this.authUser);
                    }
                }),

                // View case chronology timeline
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_ACTION_VIEW_CHRONOLOGY',
                    click: (item: CaseModel) => {
                        this.router.navigate(['/cases', item.id, 'chronology']);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            CaseModel.canViewChronologyChart(this.authUser);
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted && (
                            CaseModel.canViewMovementMap(this.authUser) ||
                            CaseModel.canViewChronologyChart(this.authUser)
                        );
                    }
                }),

                // Download case investigation form
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_ACTION_EXPORT_CASE_INVESTIGATION_FORM',
                    click: (item: CaseModel) => {
                        this.exportCaseInvestigationForm(item);
                    },
                    visible: (item: CaseModel): boolean => {
                        return !item.deleted &&
                            CaseModel.canExportInvestigationForm(this.authUser);
                    }
                }),

                // Restore a deleted case
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASES_ACTION_RESTORE_CASE',
                    click: (item: CaseModel) => {
                        this.restoreCase(item);
                    },
                    visible: (item: CaseModel): boolean => {
                        return item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            CaseModel.canRestore(this.authUser);
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
        private caseDataService: CaseDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService,
        private i18nService: I18nService,
        private genericDataService: GenericDataService,
        private clusterDataService: ClusterDataService,
        private userDataService: UserDataService,
        private relationshipDataService: RelationshipDataService,
        private entityHelperService: EntityHelperService,
        private redirectService: RedirectService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // add page title
        this.casesDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_CASES_TITLE') +
            ' - ' +
            this.casesDataExportFileName;

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
        this.caseClassifications$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.CASE_CLASSIFICATION).pipe(share());
        this.caseClassificationsList$ = this.caseClassifications$
            .pipe(
                map((data: ReferenceDataCategoryModel) => {
                    return _.map(data.entries, (entry: ReferenceDataEntryModel) =>
                        new LabelValuePair(entry.value, entry.id, null, null, entry.iconUrl)
                    );
                })
            );
        this.caseClassifications$.subscribe((caseClassificationCategory: ReferenceDataCategoryModel) => {
            this.caseClassificationsListMap = _.transform(
                caseClassificationCategory.entries,
                (result, entry: ReferenceDataEntryModel) => {
                    // groupBy won't work here since groupBy will put an array instead of one value
                    result[entry.id] = entry;
                },
                {}
            );
        });
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);
        this.pregnancyStatsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PREGNANCY_STATUS);
        this.vaccineList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.VACCINES);
        this.vaccineStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.VACCINES_STATUS);

        // init side filters
        this.caseRiskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.yesNoOptionsWithoutAllList$ = this.genericDataService.getFilterYesNoOptions(true);
        this.outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // export cases url
                this.exportCasesUrl = null;
                if (
                    this.selectedOutbreak &&
                    this.selectedOutbreak.id
                ) {
                    this.exportCasesUrl = `/outbreaks/${this.selectedOutbreak.id}/cases/export`;

                    this.clustersListAsLabelValuePair$ = this.clusterDataService.getClusterListAsLabelValue(this.selectedOutbreak.id);

                    // initialize side filters
                    this.initializeSideFilters();
                }

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
                label: 'LNG_CASE_FIELD_LABEL_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'firstName',
                label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'visualId',
                label: 'LNG_CASE_FIELD_LABEL_VISUAL_ID'
            }),
            new VisibleColumnModel({
                field: 'classification',
                label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION'
            }),
            new VisibleColumnModel({
                field: 'outcome',
                label: 'LNG_CASE_FIELD_LABEL_OUTCOME'
            }),
            new VisibleColumnModel({
                field: 'age',
                label: 'LNG_CASE_FIELD_LABEL_AGE'
            }),
            new VisibleColumnModel({
                field: 'gender',
                label: 'LNG_CASE_FIELD_LABEL_GENDER'
            }),
            new VisibleColumnModel({
                field: 'phoneNumber',
                label: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER'
            }),
            new VisibleColumnModel({
                field: 'location',
                label: 'LNG_CASE_FIELD_LABEL_ADDRESS_LOCATION'
            }),
            new VisibleColumnModel({
                field: 'dateOfOnset',
                label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET'
            }),
            new VisibleColumnModel({
                field: 'notACase',
                label: 'LNG_CASE_FIELD_LABEL_NOT_A_CASE',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'wasContact',
                label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
                visible: false
            })
        ];

        // number of contacts & exposures columns should be visible only on pages where we have relationships
        // for cases without relationships we don't need these columns
        if (this.appliedListFilter !== Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS) {
            this.tableColumns.push(
                new VisibleColumnModel({
                    field: 'numberOfContacts',
                    label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_CONTACTS'
                }),
                new VisibleColumnModel({
                    field: 'numberOfExposures',
                    label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_EXPOSURES'
                })
            );
        }

        // rest of columns :)
        this.tableColumns.push(
            new VisibleColumnModel({
                field: 'deleted',
                label: 'LNG_CASE_FIELD_LABEL_DELETED',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdBy',
                label: 'LNG_CASE_FIELD_LABEL_CREATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdAt',
                label: 'LNG_CASE_FIELD_LABEL_CREATED_AT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedBy',
                label: 'LNG_CASE_FIELD_LABEL_UPDATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedAt',
                label: 'LNG_CASE_FIELD_LABEL_UPDATED_AT',
                visible: false
            })
        );
    }

    /**
     * Initialize Side Filters
     */
    initializeSideFilters() {
        // if there is no outbreak, we can't fully initialize side filters
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        ) {
            return;
        }

        // set available side filters
        this.availableSideFilters = [
            // Case
            new FilterModel({
                fieldName: 'firstName',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'middleName',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'lastName',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'gender',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_GENDER',
                type: FilterType.MULTISELECT,
                options$: this.genderList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'age',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_AGE',
                type: FilterType.RANGE_AGE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'addresses',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
                type: FilterType.ADDRESS,
                addressFieldIsArray: true
            }),
            new FilterModel({
                fieldName: 'dob',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DOB',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'addresses',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER',
                type: FilterType.ADDRESS_PHONE_NUMBER,
                addressFieldIsArray: true
            }),
            new FilterModel({
                fieldName: 'occupation',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
                type: FilterType.MULTISELECT,
                options$: this.occupationsList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'riskLevel',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
                type: FilterType.MULTISELECT,
                options$: this.caseRiskLevelsList$
            }),
            new FilterModel({
                fieldName: 'riskReason',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'visualId',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'classification',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
                type: FilterType.MULTISELECT,
                options$: this.caseClassificationsList$
            }),
            new FilterModel({
                fieldName: 'dateOfInfection',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'dateOfOnset',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'dateOfOutcome',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'dateBecomeCase',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'safeBurial',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
                type: FilterType.SELECT,
                options$: this.yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'isDateOfOnsetApproximate',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
                type: FilterType.SELECT,
                options$: this.yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'dateOfReporting',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'isDateOfReportingApproximate',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
                type: FilterType.SELECT,
                options$: this.yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'transferRefused',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
                type: FilterType.SELECT,
                options$: this.yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'outcomeId',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_OUTCOME',
                type: FilterType.MULTISELECT,
                options$: this.outcomeList$
            }),
            new FilterModel({
                fieldName: 'wasContact',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
                type: FilterType.SELECT,
                options$: this.yesNoOptionsWithoutAllList$
            }),
            new FilterModel({
                fieldName: 'clusterId',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_CLUSTER_NAME',
                type: FilterType.MULTISELECT,
                options$: this.clustersListAsLabelValuePair$,
                relationshipPath: ['relationships'],
                relationshipLabel: 'LNG_CASE_FIELD_LABEL_CLUSTER'
            }),
            new FilterModel({
                fieldName: 'questionnaireAnswers',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
                type: FilterType.QUESTIONNAIRE_ANSWERS,
                questionnaireTemplate: this.selectedOutbreak.caseInvestigationTemplate
            }),
            new FilterModel({
                fieldName: 'pregnancyStatus',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS',
                type: FilterType.MULTISELECT,
                options$: this.pregnancyStatsList$
            }),
            new FilterModel({
                fieldName: 'vaccinesReceived.vaccine',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_VACCINE',
                type: FilterType.MULTISELECT,
                options$: this.vaccineList$
            }),
            new FilterModel({
                fieldName: 'vaccinesReceived.status',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_VACCINE_STATUS',
                type: FilterType.MULTISELECT,
                options$: this.vaccineStatusList$
            }),
            new FilterModel({
                fieldName: 'vaccinesReceived.date',
                fieldLabel: 'LNG_CASE_FIELD_LABEL_VACCINE_DATE',
                type: FilterType.RANGE_DATE
            })
        ];
    }

    /**
     * Classification conditions
     */
    private addClassificationConditions() {
        // create classification condition
        const trueCondition = {classification: {eq: Constants.CASE_CLASSIFICATION.NOT_A_CASE}};
        const falseCondition = {classification: {neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE}};

        // remove existing filter
        this.queryBuilder.filter.removeExactCondition(trueCondition);
        this.queryBuilder.filter.removeExactCondition(falseCondition);

        // filter by classification
        if (this.notACaseFilter === true) {
            // show cases that are NOT classified as Not a Case
            this.queryBuilder.filter.where(trueCondition);
        } else if (this.notACaseFilter === false) {
            // show cases classified as Not a Case
            this.queryBuilder.filter.where(falseCondition);
        }
    }

    /**
     * Re(load) the Cases list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            // classification conditions - not really necessary since refreshListCount is always called before this one
            this.addClassificationConditions();

            // retrieve created user & modified user information
            this.queryBuilder.include('createdByUser', true);
            this.queryBuilder.include('updatedByUser', true);

            // retrieve location list
            this.queryBuilder.include('locations', true);

            // since some flags can do damage to other endpoints called with the same flag, we should make sure we don't send it
            // to do this, we clone the query filter before filtering by it
            const clonedQB = _.cloneDeep(this.queryBuilder);

            // retrieve number of contacts & exposures for each record
            if (this.appliedListFilter !== Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS) {
                clonedQB.filter.flag(
                    'countRelations',
                    true
                );
            }

            // refresh badges list with applied filter
            this.getCasesGroupedByClassification();

            // retrieve the list of Cases
            this.casesList$ = this.caseDataService
                .getCasesList(this.selectedOutbreak.id, clonedQB)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        finishCallback([]);
                        return throwError(err);
                    }),
                    map((cases: CaseModel[]) => {
                        return EntityModel.determineAlertness(
                            this.selectedOutbreak.caseInvestigationTemplate,
                            cases
                        );
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
            // classification conditions
            this.addClassificationConditions();

            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();
            this.casesListCount$ = this.caseDataService
                .getCasesCount(this.selectedOutbreak.id, countQueryBuilder)
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
     * Get cases grouped by classification with needed filter
     */
    getCasesGroupedByClassification() {
        // clone queryBuilder to clear it
        const clonedQueryBuilder = _.cloneDeep(this.queryBuilder);
        clonedQueryBuilder.paginator.clear();
        clonedQueryBuilder.sort.clear();
        this.countedCasesGroupedByClassification$ = this.caseClassifications$
            .pipe(
                mergeMap((refClassificationData: ReferenceDataCategoryModel) => {
                    return this.caseDataService
                        .getCasesGroupedByClassification(this.selectedOutbreak.id, clonedQueryBuilder)
                        .pipe(
                            map((data) => {
                                return _.map(data ? data.classification : [], (item, itemId) => {
                                    const refItem: ReferenceDataEntryModel = _.find(refClassificationData.entries, {id: itemId});
                                    return new CountedItemsListItem(
                                        item.count,
                                        itemId as any,
                                        null,
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

    /**
     * Retrieve Case classification color accordingly to Case's Classification value
     * @param item
     */
    getCaseClassificationColor(item: CaseModel) {
        const classificationData = _.get(this.caseClassificationsListMap, item.classification);
        return _.get(classificationData, 'colorCode', '');
    }

    /**
     * Delete specific case from the selected outbreak
     * @param {CaseModel} caseModel
     */
    deleteCase(caseModel: CaseModel) {
        this.caseDataService
            .getExposedContactsForCase(this.selectedOutbreak.id, caseModel.id)
            .subscribe((exposedContacts: {count: number}) => {
                if (exposedContacts) {
                    const translateData = {
                        name: caseModel.name,
                        numberOfContacts: exposedContacts.count
                    };
                    this.dialogService.showConfirm(
                        exposedContacts.count > 0 ?
                            `LNG_DIALOG_CONFIRM_DELETE_CASE_WITH_EXPOSED_CONTACTS` :
                            'LNG_DIALOG_CONFIRM_DELETE_CASE', translateData)
                        .subscribe((answer: DialogAnswer) => {
                            if (answer.button === DialogAnswerButton.Yes) {
                                // delete case
                                this.caseDataService
                                    .deleteCase(this.selectedOutbreak.id, caseModel.id)
                                    .pipe(
                                        catchError((err) => {
                                            this.snackbarService.showApiError(err);
                                            return throwError(err);
                                        })
                                    )
                                    .subscribe(() => {
                                        this.snackbarService.showSuccess('LNG_PAGE_LIST_CASES_ACTION_DELETE_SUCCESS_MESSAGE');

                                        // reload data
                                        this.needsRefreshList(true);
                                    });                            }
                        });
                }
            });
    }

    /**
     * Restore a case that was deleted
     * @param {CaseModel} caseModel
     */
    restoreCase(caseModel: CaseModel) {
        // show confirm dialog to confirm the action
        this.dialogService
            .showConfirm('LNG_DIALOG_CONFIRM_RESTORE_CASE', new CaseModel(caseModel))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.caseDataService
                        .restoreCase(this.selectedOutbreak.id, caseModel.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CASES_ACTION_RESTORE_SUCCESS_MESSAGE');
                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Convert a case to contact
     * @param caseModel
     */
    convertCaseToContact(caseModel: CaseModel) {
        // show confirm dialog to confirm the action
        this.dialogService
            .showConfirm('LNG_DIALOG_CONFIRM_CONVERT_CASE_TO_CONTACT', new CaseModel(caseModel))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.caseDataService
                        .convertToContact(this.selectedOutbreak.id, caseModel.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CASES_ACTION_CONVERT_TO_CONTACT_SUCCESS_MESSAGE');
                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Filter by Classification field
     * @param values
     */
    filterByClassificationField(values) {
        // create condition
        const condition = {classification: {inq: values}};

        // remove existing filter
        this.queryBuilder.filter.removeExactCondition(condition);

        // add new filter
        this.filterBySelectField('classification', values, 'value', false);
    }

    /**
     * Filter by Not a Case classification
     * @param value
     */
    filterByNotACaseField(value: boolean | string) {
        // set filter value
        this.notACaseFilter = value;

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Export selected records
     */
    exportSelectedCases() {
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
            message: 'LNG_PAGE_LIST_CASES_EXPORT_TITLE',
            url: this.exportCasesUrl,
            fileName: this.casesDataExportFileName,

            // optional
            allowedExportTypes: this.allowedExportTypes,
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            displayUseQuestionVariable: true,
            anonymizeFields: this.anonymizeFields,
            exportStart: () => { this.showLoadingDialog(); },
            exportFinished: () => { this.closeLoadingDialog(); }
        });
    }

    /**
     * Export relationship for selected cases
     */
    exportSelectedCasesRelationships() {
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
            EntityType.CASE
        );

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIPS_TITLE',
            url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
            fileName: this.i18nService.instant('LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIP_FILE_NAME'),

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
     * Export Case Relationships
     */
    exportFilteredCasesRelationships() {
        // construct filter by case query builder
        const qb = new RequestQueryBuilder();
        const personsQb = qb.addChildQueryBuilder('person');

        // merge out query builder
        personsQb.merge(this.queryBuilder);

        // remove pagination
        personsQb.paginator.clear();

        // filter only cases
        personsQb.filter.byEquality(
            'type',
            EntityType.CASE
        );

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIPS_TITLE',
            url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
            fileName: this.i18nService.instant('LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIP_FILE_NAME'),

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
     * Export case investigation form for a Case
     */
    exportCaseInvestigationForm(caseModel: CaseModel) {
        // display export only if we have a selected outbreak
        if (this.selectedOutbreak) {
            // display export dialog
            this.dialogService.showExportDialog({
                message: 'LNG_PAGE_LIST_CASES_EXPORT_CASE_INVESTIGATION_FORM_TITLE',
                url: `outbreaks/${this.selectedOutbreak.id}/cases/${caseModel.id}/export-empty-case-investigation`,
                fileName: this.casesDataExportFileName,
                fileType: ExportDataExtension.ZIP,
                exportStart: () => { this.showLoadingDialog(); },
                exportFinished: () => { this.closeLoadingDialog(); }
            });
        }
    }

    /**
     * Export a bunch of empty case investigation forms for new Cases
     */
    exportEmptyCaseInvestigationForms() {
        // display export only if we have a selected outbreak
        if (this.selectedOutbreak) {
            // display export dialog
            this.dialogService.showExportDialog({
                message: 'LNG_PAGE_LIST_CASES_EXPORT_EMPTY_CASE_INVESTIGATION_FORMS_TITLE',
                url: `outbreaks/${this.selectedOutbreak.id}/cases/export-investigation-template`,
                fileName: this.casesDataExportFileName,
                fileType: ExportDataExtension.ZIP,
                extraDialogFields: [
                    new DialogField({
                        name: 'copies',
                        type: 'number',
                        placeholder: 'LNG_PAGE_LIST_CASES_EXPORT_EMPTY_CASE_INVESTIGATION_FORMS_FIELD_COPIES',
                        value: 5,
                        required: true
                    })
                ],
                exportStart: () => { this.showLoadingDialog(); },
                exportFinished: () => { this.closeLoadingDialog(); }
            });
        }
    }

    /**
     * Export cases dossier
     */
    exportSelectedCasesDossier() {
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
                message: 'LNG_PAGE_LIST_CASES_GROUP_ACTION_EXPORT_SELECTED_CASES_DOSSIER_DIALOG_TITLE',
                url: `outbreaks/${this.selectedOutbreak.id}/cases/dossier`,
                fileName: this.casesDataExportFileName,
                fileType: ExportDataExtension.ZIP,
                displayAnonymize: true,
                anonymizeFields: anonymizeFields,
                anonymizeFieldsKey: 'data',
                extraAPIData: {
                    cases: selectedRecords
                },
                isPOST: true,
                exportStart: () => { this.showLoadingDialog(); },
                exportFinished: () => { this.closeLoadingDialog(); }
            });
        }
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
     * Display contacts popup
     */
    displayContacts(entity: CaseModel) {
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
    displayExposures(entity: CaseModel) {
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
     * Navigate to Cases without relationships
     */
    navigateToCasesWithoutRelationships() {
        this.redirectService.to(
            ['/cases'], {
                applyListFilter: Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS
            }
        );
    }

    /**
     * Redirect to import relationship page
     */
    goToRelationshipImportPage() {
        this.router.navigate(['/import-export-data', 'relationships', 'import'], {
            queryParams: {
                from: Constants.APP_PAGE.CASES.value
            }
        });
    }
}

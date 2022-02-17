import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import * as _ from 'lodash';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogAnswer, DialogConfiguration, DialogField } from '../../../../shared/components/dialog/dialog.component';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { Router } from '@angular/router';
import { TopnavComponent } from '../../../../shared/components/topnav/topnav.component';
import { catchError, map, share, switchMap, tap } from 'rxjs/operators';
import { AnswerModel, QuestionModel } from '../../../../core/models/question.model';
import { throwError } from 'rxjs';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
    selector: 'app-outbreak-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './outbreak-list.component.html',
    styleUrls: ['./outbreak-list.component.less']
})
export class OutbreakListComponent extends ListComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAKS_TITLE', '.', true)
    ];

    // import constants into template
    Constants = Constants;
    OutbreakModel = OutbreakModel;

    // list of existing outbreaks
    outbreaksList$: Observable<OutbreakModel[]>;
    outbreaksListCount$: Observable<IBasicCount>;

    // list of options from the Active dropdown
    activeOptionsList$: Observable<any[]>;
    // list of diseases
    diseasesList$: Observable<any[]>;
    // countries list
    countriesList$: Observable<any[]>;
    // yes/no option list for deleted
    yesNoOptionsList$: Observable<any[]>;
    // authenticated user
    authUser: UserModel;

    // user list
    userList$: Observable<UserModel[]>;

    geographicalLevelsList$: Observable<any[]>;
    followUpsTeamAssignmentAlgorithm$: Observable<any[]>;

    // provide constants to template
    ReferenceDataCategory = ReferenceDataCategory;
    UserSettings = UserSettings;

    @ViewChild('topNav', { static: true }) topNav: TopnavComponent;

    recordActions: HoverRowAction[] = [
        // View Outbreak
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_VIEW_OUTBREAK',
            linkGenerator: (item: OutbreakModel): string[] => {
                return ['/outbreaks', item.id, 'view'];
            },
            visible: (item: OutbreakModel): boolean => {
                return !item.deleted &&
                    OutbreakModel.canView(this.authUser);
            }
        }),

        // Modify Outbreak
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_MODIFY_OUTBREAK',
            linkGenerator: (item: OutbreakModel): string[] => {
                return ['/outbreaks', item.id, 'modify'];
            },
            visible: (item: OutbreakModel): boolean => {
                return !item.deleted &&
                    OutbreakModel.canModify(this.authUser);
            }
        }),

        // Make Outbreak active
        new HoverRowAction({
            icon: 'link',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_SET_ACTIVE',
            click: (item: OutbreakModel) => {
                this.setActive(item);
            },
            visible: (item: OutbreakModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    item.id !== this.authUser.activeOutbreakId &&
                    OutbreakModel.canMakeOutbreakActive(this.authUser);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Outbreak
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_DELETE_OUTBREAK',
                    click: (item: OutbreakModel) => {
                        this.delete(item);
                    },
                    visible: (item: OutbreakModel): boolean => {
                        return !item.deleted &&
                            OutbreakModel.canDelete(this.authUser);
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: OutbreakModel): boolean => {
                        // visible only if at least one of the previous...
                        return !item.deleted &&
                            OutbreakModel.canDelete(this.authUser);
                    }
                }),

                // View Outbreak inconsistencies
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_VIEW_INCONSISTENCIES',
                    click: (item: OutbreakModel) => {
                        this.router.navigate(['/outbreaks', item.id, 'inconsistencies']);
                    },
                    visible: (item: OutbreakModel): boolean => {
                        return !item.deleted &&
                            OutbreakModel.canSeeInconsistencies(this.authUser);
                    }
                }),

                // View Outbreak case form
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE',
                    click: (item: OutbreakModel) => {
                        this.router.navigate(['/outbreaks', item.id, 'case-questionnaire']);
                    },
                    visible: (item: OutbreakModel): boolean => {
                        return !item.deleted &&
                            OutbreakModel.canModifyCaseQuestionnaire(this.authUser);
                    }
                }),

                // View Outbreak contact form
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CONTACT_INVESTIGATION_QUESTIONNAIRE',
                    click: (item: OutbreakModel) => {
                        this.router.navigate(['/outbreaks', item.id, 'contact-questionnaire']);
                    },
                    visible: (item: OutbreakModel): boolean => {
                        return !item.deleted &&
                            OutbreakModel.canModifyContactQuestionnaire(this.authUser);
                    }
                }),

                // View Outbreak contact follow-up form
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE',
                    click: (item: OutbreakModel) => {
                        this.router.navigate(['/outbreaks', item.id, 'contact-follow-up-questionnaire']);
                    },
                    visible: (item: OutbreakModel): boolean => {
                        return !item.deleted &&
                            OutbreakModel.canModifyContactFollowUpQuestionnaire(this.authUser);
                    }
                }),

                // View Outbreak case lab result form
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE',
                    click: (item: OutbreakModel) => {
                        this.router.navigate(['/outbreaks', item.id, 'case-lab-results-questionnaire']);
                    },
                    visible: (item: OutbreakModel): boolean => {
                        return !item.deleted &&
                            OutbreakModel.canModifyCaseLabResultQuestionnaire(this.authUser);
                    }
                }),

                // Divider
                new HoverRowAction({
                    type: HoverRowActionType.DIVIDER,
                    visible: (item: OutbreakModel): boolean => {
                        // visible only if at least one of the previous...
                        return !item.deleted && (
                            OutbreakModel.canSeeInconsistencies(this.authUser) ||
                            OutbreakModel.canModifyCaseQuestionnaire(this.authUser) ||
                            OutbreakModel.canModifyContactFollowUpQuestionnaire(this.authUser) ||
                            OutbreakModel.canModifyCaseLabResultQuestionnaire(this.authUser)
                        );
                    }
                }),

                // Clone Outbreak
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CLONE_OUTBREAK',
                    click: (item: OutbreakModel) => {
                        this.cloneOutbreak(item);
                    },
                    visible: (item: OutbreakModel): boolean => {
                        return !item.deleted &&
                            OutbreakModel.canClone(this.authUser);
                    }
                }),

                // Restore deleted Outbreak
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_RESTORE_OUTBREAK',
                    click: (item: OutbreakModel) => {
                        this.restoreOutbreak(item);
                    },
                    visible: (item: OutbreakModel): boolean => {
                        return item.deleted &&
                            OutbreakModel.canRestore(this.authUser);
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
        private outbreakDataService: OutbreakDataService,
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private i18nService: I18nService,
        private router: Router
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.followUpsTeamAssignmentAlgorithm$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM);
        this.activeOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
        this.geographicalLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LOCATION_GEOGRAPHICAL_LEVEL);
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.countriesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.COUNTRY)
            .pipe(
                map(
                    (countries) => _.map(countries, (country: LabelValuePair) => {
                        country.value = {
                            id: country.value
                        };
                        return country;
                    })
                )
            );

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // initialize pagination
        this.initPaginator();

        // refresh
        this.needsRefreshList(true);
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'name',
                label: 'LNG_OUTBREAK_FIELD_LABEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'disease',
                label: 'LNG_OUTBREAK_FIELD_LABEL_DISEASE',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'country',
                label: 'LNG_OUTBREAK_FIELD_LABEL_COUNTRIES'
            }),
            new VisibleColumnModel({
                field: 'reportingGeographicalLevelId',
                label: 'LNG_OUTBREAK_FIELD_LABEL_LOCATION_GEOGRAPHICAL_LEVEL',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'startDate',
                label: 'LNG_OUTBREAK_FIELD_LABEL_START_DATE'
            }),
            new VisibleColumnModel({
                field: 'endDate',
                label: 'LNG_OUTBREAK_FIELD_LABEL_END_DATE'
            }),
            new VisibleColumnModel({
                field: 'active',
                label: 'LNG_OUTBREAK_FIELD_LABEL_ACTIVE'
            }),
            new VisibleColumnModel({
                field: 'generateFollowUpsTeamAssignmentAlgorithm',
                label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'generateFollowUpsOverwriteExisting',
                label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'generateFollowUpsKeepTeamAssignment',
                label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'generateFollowUpsDateOfLastContact',
                label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'isContactLabResultsActive',
                label: 'LNG_OUTBREAK_FIELD_LABEL_IS_CONTACT_LAB_RESULTS_ACTIVE',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'isDateOfOnsetRequired',
                label: 'LNG_OUTBREAK_FIELD_LABEL_IS_CASE_DATE_OF_ONSET_REQUIRED',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'deleted',
                label: 'LNG_OUTBREAK_FIELD_LABEL_DELETED',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdBy',
                label: 'LNG_OUTBREAK_FIELD_LABEL_CREATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdAt',
                label: 'LNG_OUTBREAK_FIELD_LABEL_CREATED_AT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedBy',
                label: 'LNG_OUTBREAK_FIELD_LABEL_UPDATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedAt',
                label: 'LNG_OUTBREAK_FIELD_LABEL_UPDATED_AT',
                visible: false
            })
        ];
    }

    /**
     * Re(load) the Outbreaks list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // retrieve created user & modified user information
        this.queryBuilder.include('createdByUser', true);
        this.queryBuilder.include('updatedByUser', true);

        // filter out questionnaire data
        const outbreakObj: OutbreakModel = new OutbreakModel();
        const removeFields: {
            [propName: string]: boolean
        } = {
            caseInvestigationTemplate: true,
            contactFollowUpTemplate: true,
            labResultsTemplate: true
        };
        const fields: string[] = Object.getOwnPropertyNames(outbreakObj).filter((propName: string) => {
            return !removeFields[propName];
        });

        // retrieve only specific fields
        this.queryBuilder.fields(...fields);

        // retrieve the list of Outbreaks
        this.outbreaksList$ = this.outbreakDataService
            .getOutbreaksList(this.queryBuilder)
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
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        countQueryBuilder.sort.clear();

        // add includeDeletedRecords if deleted is enabled
        if (this.queryBuilder.isDeletedEnabled()) {
            countQueryBuilder.filter.includeDeletedRecordsWhereField();
        }
        this.outbreaksListCount$ = this.outbreakDataService
            .getOutbreaksCount(countQueryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }),
                share()
            );
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
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
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

    /**
     * Restore specific outbreak
     * @param {OutbreakModel} outbreakId
     */
    restoreOutbreak(outbreak: OutbreakModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_OUTBREAK', new OutbreakModel(outbreak))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete follow up
                    this.outbreakDataService
                        .restoreOutbreak(outbreak.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_OUTBREAKS_RESTORE_SUCCESS_MESSAGE');

                            // reload data
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
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // reload user data to save the new active outbreak
                            this.authDataService
                                .reloadAndPersistAuthUser()
                                .subscribe((authenticatedUser) => {
                                    this.authUser = authenticatedUser.user;
                                    this.snackbarService.showSuccess('LNG_PAGE_LIST_OUTBREAKS_ACTION_SET_ACTIVE_SUCCESS_MESSAGE');
                                    this.outbreakDataService.checkActiveSelectedOutbreak();
                                    this.needsRefreshList(true);

                                    // refresh list of top nav outbreak
                                    if (this.topNav) {
                                        this.topNav.refreshOutbreaksList();
                                    }
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
                            'eq': this.authUser.activeOutbreakId ?
                                this.authUser.activeOutbreakId :
                                -1
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
     * Clone an existing outbreak
     * @param {OutbreakModel} outbreakModel
     */
     cloneOutbreak(outbreakModel: OutbreakModel) {
        // translate questionnaire questions
        const translateQuestionnaire = (questions: QuestionModel[]) => {
            _.each(questions, (question: QuestionModel) => {
                // translate question
                question.text = this.i18nService.instant(question.text);

                // translate answers & sub questions
                _.each(question.answers, (answer: AnswerModel) => {
                    // translate answer
                    answer.label = this.i18nService.instant(answer.label);

                    // translate sub-question
                    if (!_.isEmpty(answer.additionalQuestions)) {
                        translateQuestionnaire(answer.additionalQuestions);
                    }
                });
            });
        };

        // get the outbreak to clone
        this.outbreakDataService
            .getOutbreak(outbreakModel.id)
            .subscribe((outbreak: OutbreakModel) => {
                // create the clone of the parent outbreak
                this.dialogService
                    .showInput(
                        new DialogConfiguration({
                            message: 'LNG_DIALOG_CONFIRM_CLONE_OUTBREAK',
                            yesLabel: 'LNG_COMMON_BUTTON_CLONE',
                            required: true,
                            fieldsList: [new DialogField({
                                name: 'clonedOutbreakName',
                                placeholder: 'LNG_DIALOG_FIELD_PLACEHOLDER_CLONED_OUTBREAK_NAME',
                                required: true,
                                type: 'text',
                                value: this.i18nService.instant('LNG_PAGE_LIST_OUTBREAKS_CLONE_NAME', {name: outbreak.name})
                            })],
                        }),
                        true
                    )
                    .subscribe((answer) => {
                        if (answer.button === DialogAnswerButton.Yes) {
                            // delete the id from the parent outbreak
                            delete outbreak.id;

                            // set the name for the cloned outbreak
                            outbreak.name = answer.inputValue.value.clonedOutbreakName;

                            // translate questionnaire questions - Case Form
                            if (!_.isEmpty(outbreak.caseInvestigationTemplate)) {
                                translateQuestionnaire(outbreak.caseInvestigationTemplate);
                            }

                            // translate questionnaire questions - Contact Form
                            if (!_.isEmpty(outbreak.contactInvestigationTemplate)) {
                                translateQuestionnaire(outbreak.contactInvestigationTemplate);
                            }

                            // translate questionnaire questions - Lab Results Form
                            if (!_.isEmpty(outbreak.labResultsTemplate)) {
                                translateQuestionnaire(outbreak.labResultsTemplate);
                            }

                            // translate questionnaire questions - Contact Follow-up
                            if (!_.isEmpty(outbreak.contactFollowUpTemplate)) {
                                translateQuestionnaire(outbreak.contactFollowUpTemplate);
                            }

                            // show loading
                            const loadingDialog = this.dialogService.showLoadingDialog();
                            this.outbreakDataService
                                .createOutbreak(outbreak)
                                .pipe(
                                    catchError((err) => {
                                        this.snackbarService.showApiError(err);
                                        loadingDialog.close();
                                        return throwError(err);
                                    }),
                                    switchMap((clonedOutbreak) => {
                                        // update language tokens to get the translation of submitted questions and answers
                                        return this.i18nService.loadUserLanguage()
                                            .pipe(
                                                catchError((err) => {
                                                    this.snackbarService.showApiError(err);
                                                    loadingDialog.close();
                                                    return throwError(err);
                                                }),
                                                map(() => clonedOutbreak)
                                            );
                                    })
                                )
                                .subscribe((clonedOutbreak) => {
                                    this.snackbarService.showSuccess('LNG_PAGE_LIST_OUTBREAKS_ACTION_CLONE_SUCCESS_MESSAGE');

                                    // hide dialog
                                    loadingDialog.close();

                                    // navigate to modify page of the new outbreak
                                    if (OutbreakModel.canModify(this.authUser)) {
                                        this.router.navigate([`/outbreaks/${clonedOutbreak.id}/modify`]);
                                    } else if (OutbreakModel.canView(this.authUser)) {
                                        this.router.navigate([`/outbreaks/${clonedOutbreak.id}/view`]);
                                    } else if (OutbreakModel.canList(this.authUser)) {
                                        this.router.navigate(['/outbreaks']);
                                    } else {
                                        // fallback to current page since we already know that we have access to this page
                                        // Don't redirect :)
                                    }
                                });
                        }
                    });
            });
    }
}

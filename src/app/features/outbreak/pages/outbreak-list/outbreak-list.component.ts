import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { PERMISSION } from '../../../../core/models/permission.model';
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
import { tap } from 'rxjs/operators';
import { AnswerModel, QuestionModel } from '../../../../core/models/question.model';

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
    // countries list
    countriesList$: Observable<any[]>;
    // yes/no option list for deleted
    yesNoOptionsList$: Observable<any[]>;
    // authenticated user
    authUser: UserModel;

    geographicalLevelsList$: Observable<any[]>;

    // provide constants to template
    ReferenceDataCategory = ReferenceDataCategory;
    UserSettings = UserSettings;

    @ViewChild('topNav') topNav: TopnavComponent;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private i18nService: I18nService,
        private router: Router
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.activeOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
        this.geographicalLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LOCATION_GEOGRAPHICAL_LEVEL);
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.countriesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.COUNTRY).map(
            (countries) => _.map(countries, (country: LabelValuePair) => {
                country.value = {
                    id: country.value
                };
                return country;
            })
        );

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // refresh
        this.needsRefreshList(true);
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
                field: 'deleted',
                label: 'LNG_OUTBREAK_FIELD_LABEL_DELETED',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        ];
    }

    /**
     * Re(load) the Outbreaks list
     */
    refreshList() {
        // retrieve the list of Outbreaks
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList(this.queryBuilder)
            .pipe(tap(this.checkEmptyList.bind(this)));
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
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
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
     * Clone an existing outbreak
     * @param {OutbreakModel} outbreak
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
        this.outbreakDataService.getOutbreak(outbreakModel.id)
            .subscribe((outbreak: OutbreakModel) => {
                // create the clone of the parent outbreak
                this.dialogService.showInput(
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
                    }), true)
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
                            this.outbreakDataService.createOutbreak(outbreak)
                                .catch((err) => {
                                    this.snackbarService.showError(err.message);
                                    loadingDialog.close();
                                    return ErrorObservable.create(err);
                                })
                                .switchMap((clonedOutbreak) => {
                                    // update language tokens to get the translation of submitted questions and answers
                                    return this.i18nService.loadUserLanguage()
                                        .catch((err) => {
                                            this.snackbarService.showError(err.message);
                                            loadingDialog.close();
                                            return ErrorObservable.create(err);
                                        })
                                        .map(() => clonedOutbreak);
                                })
                                .subscribe((clonedOutbreak) => {
                                    this.snackbarService.showSuccess('LNG_PAGE_LIST_OUTBREAKS_ACTION_CLONE_SUCCESS_MESSAGE');

                                    // hide dialog
                                    loadingDialog.close();

                                    // navigate to modify page of the new outbreak
                                    this.router.navigate([`/outbreaks/${clonedOutbreak.id}/modify`]);
                            });
                        }
                    });
            });
    }
}

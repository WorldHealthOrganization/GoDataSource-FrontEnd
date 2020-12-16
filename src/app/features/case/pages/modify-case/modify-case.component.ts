import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm, NgModel } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable, throwError } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Constants } from '../../../../core/models/constants';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType } from '../../../../shared/components';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { catchError } from 'rxjs/operators';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { ContactModel } from '../../../../core/models/contact.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { TimerCache } from '../../../../core/helperClasses/timer-cache';

@Component({
    selector: 'app-modify-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-case.component.html',
    styleUrls: ['./modify-case.component.less']
})
export class ModifyCaseComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    selectedOutbreak: OutbreakModel = new OutbreakModel();
    caseId: string;

    caseData: CaseModel = new CaseModel();

    genderList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;
    caseRiskLevelsList$: Observable<any[]>;
    outcomeList$: Observable<any[]>;
    pregnancyStatusList$: Observable<any[]>;

    // provide constants to template
    EntityType = EntityType;
    Constants = Constants;
    CaseModel = CaseModel;
    ContactModel = ContactModel;
    LabResultModel = LabResultModel;
    FollowUpModel = FollowUpModel;

    serverToday: Moment = moment();

    parentOnsetDates: (string | Moment)[][] = [];

    queryParams: {
        onset: boolean,
        longPeriod: boolean
    };

    visualIDTranslateData: {
        mask: string
    };

    caseIdMaskValidator: Observable<boolean | IGeneralAsyncValidatorResponse>;

    displayRefresh: boolean = false;
    @ViewChild('visualId') visualId: NgModel;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private i18nService: I18nService,
        protected dialogService: DialogService,
        private entityDataService: EntityDataService
    ) {
        super(
            route,
            dialogService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);
        this.caseRiskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);
        this.pregnancyStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PREGNANCY_STATUS);

        // show loading
        this.showLoadingDialog(false);

        // retrieve query params
        this.route.queryParams
            .subscribe((queryParams: any) => {
                this.queryParams = queryParams;

                // initialize breadcrumbs
                this.initializeBreadcrumbs();
            });

        this.route.params
            .subscribe((params: { caseId }) => {
                this.caseId = params.caseId;
                this.retrieveCaseData();
            });

        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // outbreak
                this.selectedOutbreak = selectedOutbreak;
                if (!_.isEmpty(this.selectedOutbreak.caseIdMask)) {
                    this.displayRefresh = true;
                }

                // breadcrumbs
                this.retrieveCaseData();
            });
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // case list page
        if (CaseModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
            );
        }

        // do we need to add onset breadcrumb ?
        // no need to check rights since this params should be set only if we come from that page
        if (
            this.queryParams.onset &&
            CaseModel.canListOnsetBeforePrimaryReport(this.authUser)
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_CASES_DATE_ONSET_TITLE',
                    '/relationships/date-onset'
                )
            );
        }

        // do we need to add long period between onset dates breadcrumb ?
        // no need to check rights since this params should be set only if we come from that page
        if (
            this.queryParams.longPeriod &&
            CaseModel.canListLongPeriodBetweenOnsetDatesReport(this.authUser)
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_TITLE',
                    '/relationships/long-period'
                )
            );
        }

        // current page breadcrumb
        if (this.caseData) {
            // current page title
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.viewOnly ? 'LNG_PAGE_VIEW_CASE_TITLE' : 'LNG_PAGE_MODIFY_CASE_TITLE',
                    '.',
                    true,
                    {},
                    this.caseData
                )
            );
        }
    }

    /**
     * Case data
     */
    retrieveCaseData() {
        // get case
        if (
            this.selectedOutbreak.id &&
            this.caseId
        ) {
            // construct query builder for this case that includes the parent relation as well
            const qb = new RequestQueryBuilder();

            // parent case relations
            const relations = qb.include('relationships', true);
            relations.filterParent = false;

            // keep only relationships for which the current case is the target ( child case )
            relations.queryBuilder.filter.where({
                or: [{
                    'persons.0.type': EntityType.CASE,
                    'persons.0.source': true,
                    'persons.1.type': EntityType.CASE,
                    'persons.1.target': true,
                    'persons.1.id': this.caseId
                }, {
                    'persons.0.type': EntityType.CASE,
                    'persons.0.target': true,
                    'persons.0.id': this.caseId,
                    'persons.1.type': EntityType.CASE,
                    'persons.1.source': true
                }]
            });

            // case data
            const people = relations.queryBuilder.include('people', true);
            people.filterParent = false;

            // retrieve created user & modified user information
            qb.include('createdByUser', true);
            qb.include('updatedByUser', true);

            // ID
            qb.filter.byEquality(
                'id',
                this.caseId
            );

            // show loading
            this.showLoadingDialog(false);

            // get case
            this.caseDataService
                .getCasesList(
                    this.selectedOutbreak.id,
                    qb
                )
                .subscribe((cases: CaseModel[]) => {
                    // set data only when we have everything
                    this.caseData = new CaseModel(cases[0]);

                    // determine parent onset dates
                    const uniqueDates: {} = {};
                    _.each(this.caseData.relationships, (relationship: any) => {
                        const parentPerson: any = _.find(relationship.persons, { source: true });
                        const parentCase: CaseModel = _.find(relationship.people, { id: parentPerson.id }) as CaseModel;
                        if (
                            parentCase &&
                            parentCase.dateOfOnset
                        ) {
                            uniqueDates[moment(parentCase.dateOfOnset).startOf('day').toISOString()] = true;
                        }
                    });

                    // convert unique object of dates to array
                    this.parentOnsetDates = _.map(Object.keys(uniqueDates), (date: string) => {
                        return [
                            moment(date) as Moment,
                            this.i18nService.instant(
                                'LNG_PAGE_MODIFY_CASE_INVALID_CHILD_DATE_OF_ONSET', {
                                    date: moment(date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)
                                }
                            )
                        ];
                    });

                    // set visual ID translate data
                    this.visualIDTranslateData = {
                        mask: CaseModel.generateCaseIDMask(this.selectedOutbreak.caseIdMask)
                    };

                    // set visual ID validator
                    this.caseIdMaskValidator = new Observable((observer) => {
                        // construct cache key
                        const cacheKey: string = 'MCA_' + this.selectedOutbreak.id +
                            this.visualIDTranslateData.mask +
                            this.caseData.visualId +
                            this.caseData.id;

                        // get data from cache or execute validator
                        TimerCache.run(
                            cacheKey,
                            this.caseDataService.checkCaseVisualIDValidity(
                                this.selectedOutbreak.id,
                                this.visualIDTranslateData.mask,
                                this.caseData.visualId,
                                this.caseData.id
                            )
                        ).subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                            observer.next(isValid);
                            observer.complete();
                        });
                    });

                    // initialize breadcrumbs
                    this.initializeBreadcrumbs();

                    // hide loading
                    this.hideLoadingDialog();
                });
        }
    }

    /**
     * Modify case
     */
    modifyCase(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // add age & dob information
        if (dirtyFields.ageDob) {
            dirtyFields.age = dirtyFields.ageDob.age;
            dirtyFields.dob = dirtyFields.ageDob.dob;
            delete dirtyFields.ageDob;
        }

        // show loading
        this.showLoadingDialog();

        // check for duplicates
        this.caseDataService
            .findDuplicates(this.selectedOutbreak.id, {
                ...this.caseData,
                ...dirtyFields
            })
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);

                    // hide loading
                    this.hideLoadingDialog();

                    return throwError(err);
                })
            )
            .subscribe((caseDuplicates: EntityDuplicatesModel) => {
                // items marked as not duplicates
                let itemsMarkedAsNotDuplicates: string[] = [];

                // modify Case
                const runModifyCase = (finishCallBack?: () => void) => {
                    // modify the Case
                    this.caseDataService
                        .modifyCase(this.selectedOutbreak.id, this.caseId, dirtyFields)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);

                                // hide loading
                                this.hideLoadingDialog();

                                return throwError(err);
                            })
                        )
                        .subscribe((modifiedCase: CaseModel) => {
                            // called when we finished updating case data
                            const finishedUpdatingCase = () => {
                                // update model
                                this.caseData = modifiedCase;

                                // mark form as pristine
                                form.form.markAsPristine();

                                // display message
                                if (!finishCallBack) {
                                    this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CASE_ACTION_MODIFY_CASE_SUCCESS_MESSAGE');

                                    // update breadcrumb
                                    this.retrieveCaseData();

                                    // hide loading
                                    this.hideLoadingDialog();
                                } else {
                                    // finished
                                    finishCallBack();
                                }
                            };

                            // there are no records marked as NOT duplicates ?
                            if (
                                !itemsMarkedAsNotDuplicates ||
                                itemsMarkedAsNotDuplicates.length < 1
                            ) {
                                finishedUpdatingCase();
                            } else {
                                // mark records as not duplicates
                                this.entityDataService
                                    .markPersonAsOrNotADuplicate(
                                        this.selectedOutbreak.id,
                                        EntityType.CASE,
                                        this.caseId,
                                        itemsMarkedAsNotDuplicates
                                    )
                                    .pipe(
                                        catchError((err) => {
                                            this.snackbarService.showApiError(err);

                                            // hide loading
                                            this.hideLoadingDialog();

                                            return throwError(err);
                                        })
                                    )
                                    .subscribe(() => {
                                        // finished
                                        finishedUpdatingCase();
                                    });
                            }
                        });
                };

                // do we have duplicates ?
                if (caseDuplicates.duplicates.length > 0) {
                    // construct list of items from which we can choose actions
                    const fieldsList: DialogField[] = [];
                    const fieldsListLayout: number[] = [];
                    caseDuplicates.duplicates.forEach((duplicate: EntityModel, index: number) => {
                        // case model
                        const caseData: CaseModel = duplicate.model as CaseModel;

                        // add row fields
                        fieldsListLayout.push(60, 40);
                        fieldsList.push(
                            new DialogField({
                                name: `actions[${caseData.id}].label`,
                                placeholder: (index + 1) + '. ' + EntityModel.getNameWithDOBAge(
                                    caseData,
                                    this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                    this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                ),
                                fieldType: DialogFieldType.LINK,
                                routerLink: ['/cases', caseData.id, 'view'],
                                linkTarget: '_blank'
                            }),
                            new DialogField({
                                name: `actions[${caseData.id}].action`,
                                placeholder: 'LNG_DUPLICATES_DIALOG_ACTION',
                                description: 'LNG_DUPLICATES_DIALOG_ACTION_DESCRIPTION',
                                inputOptions: [
                                    new LabelValuePair(
                                        Constants.DUPLICATE_ACTION.NO_ACTION,
                                        Constants.DUPLICATE_ACTION.NO_ACTION
                                    ),
                                    new LabelValuePair(
                                        Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE,
                                        Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE
                                    ),
                                    new LabelValuePair(
                                        Constants.DUPLICATE_ACTION.MERGE,
                                        Constants.DUPLICATE_ACTION.MERGE
                                    )
                                ],
                                inputOptionsClearable: false,
                                required: true,
                                value: Constants.DUPLICATE_ACTION.NO_ACTION
                            })
                        );
                    });

                    // display dialog
                    this.dialogService.showConfirm(new DialogConfiguration({
                        message: 'LNG_PAGE_MODIFY_CASE_DUPLICATES_DIALOG_CONFIRM_MSG',
                        yesLabel: 'LNG_COMMON_BUTTON_SAVE',
                        customInput: true,
                        fieldsListLayout: fieldsListLayout,
                        fieldsList: fieldsList
                    })).subscribe((answer) => {
                        if (answer.button === DialogAnswerButton.Yes) {
                            // determine number of items to merge / mark as not duplicates
                            const itemsToMerge: string[] = [];
                            itemsMarkedAsNotDuplicates = [];
                            const actions: {
                                [id: string]: {
                                    action: string
                                }
                            } = _.get(answer, 'inputValue.value.actions', {});
                            if (!_.isEmpty(actions)) {
                                _.each(actions, (data, id) => {
                                    switch (data.action) {
                                        case Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE:
                                            itemsMarkedAsNotDuplicates.push(id);
                                            break;
                                        case Constants.DUPLICATE_ACTION.MERGE:
                                            itemsToMerge.push(id);
                                            break;
                                    }
                                });
                            }

                            // save data first, followed by redirecting to merge
                            if (itemsToMerge.length > 0) {
                                runModifyCase(() => {
                                    // construct list of ids
                                    const mergeIds: string[] = [
                                        this.caseId,
                                        ...itemsToMerge
                                    ];

                                    // hide loading
                                    this.hideLoadingDialog();

                                    // redirect to merge
                                    this.router.navigate(
                                        ['/duplicated-records', EntityModel.getLinkForEntityType(EntityType.CASE), 'merge'], {
                                            queryParams: {
                                                ids: JSON.stringify(mergeIds)
                                            }
                                        }
                                    );
                                });
                            } else {
                                runModifyCase();
                            }
                        } else {
                            // hide loading
                            this.hideLoadingDialog();
                        }
                    });
                } else {
                    runModifyCase();
                }
            });
    }

    /**
     * Used for validating date onset
     */
    dateOnsetSameOrAfterDates(): any[] {
        return [
            ...this.parentOnsetDates,
            [this.caseData.dateOfInfection, this.i18nService.instant('LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION')]
        ];
    }

    /**
     * Generate visual ID for case
     */
    generateVisualId() {
        if (!_.isEmpty(this.selectedOutbreak.caseIdMask)) {
            this.caseData.visualId = CaseModel.generateCaseIDMask(this.selectedOutbreak.caseIdMask);
            this.visualId.control.markAsDirty();
        }
    }
}

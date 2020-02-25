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
import { Observable } from 'rxjs';
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
import { DialogAnswer, DialogAnswerButton, DialogButton, DialogComponent, DialogConfiguration, DialogField } from '../../../../shared/components';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { MatDialogRef } from '@angular/material';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { ContactModel } from '../../../../core/models/contact.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';

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
        protected dialogService: DialogService
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
                        this.caseDataService.checkCaseVisualIDValidity(
                            this.selectedOutbreak.id,
                            this.visualIDTranslateData.mask,
                            this.caseData.visualId,
                            this.caseData.id
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
                        });
                };

                // do we have duplicates ?
                if (caseDuplicates.duplicates.length > 0) {
                    // display dialog
                    const showDialog = () => {
                        this.dialogService.showConfirm(new DialogConfiguration({
                            message: 'LNG_PAGE_MODIFY_CASE_DUPLICATES_DIALOG_CONFIRM_MSG',
                            yesLabel: 'LNG_COMMON_BUTTON_MERGE',
                            customInput: true,
                            fieldsList: [new DialogField({
                                name: 'mergeWith',
                                placeholder: 'LNG_PAGE_MODIFY_CASE_DUPLICATES_DIALOG_LABEL_MERGE_WITH',
                                inputOptions: _.map(caseDuplicates.duplicates, (duplicate: EntityModel, index: number) => {
                                    // case model
                                    const caseData: CaseModel = duplicate.model as CaseModel;

                                    // map
                                    return new LabelValuePair((index + 1) + '. ' +
                                        EntityModel.getNameWithDOBAge(
                                            caseData,
                                            this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                            this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                        ),
                                        caseData.id
                                    );
                                }),
                                inputOptionsMultiple: true,
                                required: false
                            })],
                            addDefaultButtons: true,
                            buttons: [
                                new DialogButton({
                                    label: 'LNG_COMMON_BUTTON_SAVE',
                                    clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                                        dialogHandler.close(new DialogAnswer(DialogAnswerButton.Extra_1));
                                    }
                                })
                            ]
                        })).subscribe((answer) => {
                            // just update ?
                            if (answer.button === DialogAnswerButton.Yes) {
                                // make sure we have at least two ids selected ( 1 is the current case )
                                if (
                                    !answer.inputValue.value.mergeWith
                                ) {
                                    // display need to select at least one record to merge with
                                    this.snackbarService.showError('LNG_PAGE_MODIFY_CASE_DUPLICATES_DIALOG_ACTION_MERGE_AT_LEAST_ONE_ERROR_MESSAGE');

                                    // display dialog again
                                    showDialog();

                                    // finished here
                                    return;
                                }

                                // save data first, followed by redirecting to merge
                                runModifyCase(() => {
                                    // construct list of ids
                                    const mergeIds: string[] = [
                                        this.caseId,
                                        ...answer.inputValue.value.mergeWith
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
                            } else if (answer.button === DialogAnswerButton.Extra_1) {
                                runModifyCase();
                            } else {
                                // hide loading
                                this.hideLoadingDialog();
                            }
                        });
                    };

                    // display dialog
                    showDialog();
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

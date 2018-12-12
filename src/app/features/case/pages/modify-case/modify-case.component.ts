import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { Moment } from 'moment';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as moment from 'moment';
import { Constants } from '../../../../core/models/constants';
import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
    selector: 'app-modify-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-case.component.html',
    styleUrls: ['./modify-case.component.less']
})
export class ModifyCaseComponent extends ViewModifyComponent implements OnInit {
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

    // provide constants to template
    EntityType = EntityType;

    serverToday: Moment = null;

    parentOnsetDates: [Moment, string][] = [];

    queryParams: {
        onset: boolean,
        longPeriod: boolean
    };

    visualIDTranslateData: {
        mask: string
    };

    caseIdMaskValidator: Observable<boolean>;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private genericDataService: GenericDataService,
        private i18nService: I18nService,
        private dialogService: DialogService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);
        this.caseRiskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);

        // retrieve query params
        this.route.queryParams
            .subscribe((queryParams: any) => {
                this.queryParams = queryParams;
                this.buildBreadcrumbs();
            });

        this.route.params
            .subscribe((params: { caseId }) => {
                this.caseId = params.caseId;
                this.retrieveCaseData();
            });

        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // outbreak
                this.selectedOutbreak = selectedOutbreak;

                // breadcrumbs
                this.retrieveCaseData();
            });
    }

    /**
     * Breadcrumbs
     */
    buildBreadcrumbs() {
        if (this.caseData) {
            // initialize breadcrumbs
            this.breadcrumbs = [
                new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
            ];

            // do we need to add onset breadcrumb ?
            // no need to check rights since this params should be set only if we come from that page
            if (this.queryParams.onset) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        'LNG_PAGE_LIST_CASES_DATE_ONSET_TITLE',
                        '/relationships/date-onset'
                    )
                );
            }

            // do we need to add long period between onset dates breadcrumb ?
            // no need to check rights since this params should be set only if we come from that page
            if (this.queryParams.longPeriod) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_TITLE',
                        '/relationships/long-period'
                    )
                );
            }

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

            // ID
            qb.filter.byEquality(
                'id',
                this.caseId
            );

            // get case
            this.caseDataService
                .getCasesList(
                    this.selectedOutbreak.id,
                    qb
                )
                .subscribe((cases: CaseModel[]) => {
                    // add breadcrumb
                    this.breadcrumbs.push(
                        new BreadcrumbItemModel(
                            this.viewOnly ? 'LNG_PAGE_VIEW_CASE_TITLE' : 'LNG_PAGE_MODIFY_CASE_TITLE',
                            '.',
                            true,
                            {},
                            this.caseData
                        )
                    );

                    // set data only when we have everything
                    this.caseData = new CaseModel(cases[0]);

                    // determine parent onset dates
                    const uniqueDates: {} = {};
                    _.each(this.caseData.relationships, (relationship: RelationshipModel) => {
                        const parentPerson = _.find(relationship.persons, { source: true });
                        const parentCase: CaseModel = _.find(relationship.people, { id: parentPerson.id });
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
                            moment(date),
                            this.i18nService.instant(
                                'LNG_PAGE_MODIFY_CASE_INVALID_CHILD_DATE_OF_ONSET', {
                                    date: moment(date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)
                                }
                            )
                        ];
                    });

                    // set visual ID translate data
                    this.visualIDTranslateData = {
                        mask: OutbreakModel.generateCaseIDMask(this.selectedOutbreak.caseIdMask)
                    };

                    // set visual ID validator
                    this.caseIdMaskValidator = Observable.create((observer) => {
                        this.outbreakDataService.generateVisualIDCheckValidity(
                            this.selectedOutbreak.id,
                            this.caseData.visualId,
                            this.caseData.id
                        ).subscribe((isValid: boolean) => {
                            observer.next(isValid);
                            observer.complete();
                        });
                    });

                    // breadcrumbs
                    this.buildBreadcrumbs();
                });
        }
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Check if we have access to create a contact
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

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

        // modify the Case
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.caseDataService
            .modifyCase(this.selectedOutbreak.id, this.caseId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showApiError(err);
                loadingDialog.close();
                return ErrorObservable.create(err);
            })
            .subscribe((modifiedCase: CaseModel) => {
                // update model
                this.caseData = modifiedCase;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CASE_ACTION_MODIFY_CASE_SUCCESS_MESSAGE');

                // update breadcrumb
                this.retrieveCaseData();

                // hide dialog
                loadingDialog.close();
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
}

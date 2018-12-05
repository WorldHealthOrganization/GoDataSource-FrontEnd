import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { AnswerModel, QuestionModel } from '../../../../core/models/question.model';

@Component({
    selector: 'app-modify-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-outbreak.component.html',
    styleUrls: ['./modify-outbreak.component.less']
})
export class ModifyOutbreakComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];
    // authenticated user
    authUser: UserModel;
    // id of the outbreak to modify
    outbreakId: string;
    // outbreak to modify
    outbreak: OutbreakModel = new OutbreakModel();
    // list of diseases
    diseasesList$: Observable<any[]>;
    // list of countries
    countriesList$: Observable<any[]>;
    // list of geographical levels
    geographicalLevelsList$: Observable<any[]>;

    constructor(
        private outbreakDataService: OutbreakDataService,
        protected route: ActivatedRoute,
        private router: Router,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private i18nService: I18nService,
        private formHelper: FormHelperService,
        private authDataService: AuthDataService
    ) {
        super(route);

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    ngOnInit() {
        this.geographicalLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LOCATION_GEOGRAPHICAL_LEVEL);
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
        this.countriesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.COUNTRY).map(
            (countries) => _.map(countries, (country: LabelValuePair) => {
                country.value = {
                    id: country.value
                };
                return country;
            })
        );

        // get outbreak
        this.outbreak = this.route.snapshot.data.outbreak;
        this.outbreakId = this.outbreak.id;

        // update breadcrumbs
        this.createBreadcrumbs();
    }

    /**
     * Compare countries
     * @param o1
     * @param o2
     */
    compareCountryWith(o1: {id: string}, o2: {id: string}): boolean {
        return (o1 ? o1.id : undefined) === (o2 ? o2.id : undefined);
    }

    /**
     * Remove outbreak questions new flag
     * @param outbreakData
     */
    cleanQuestionnaireNewFlag(outbreakData: OutbreakModel) {
        const actualRemoveNewFlag = (question: QuestionModel) => {
            delete question.new;
            _.each(question.answers, (answer: AnswerModel) => {
                _.each(answer.additionalQuestions, (childQuestion: QuestionModel) => {
                    actualRemoveNewFlag(childQuestion);
                });
            });
        };

        _.each(outbreakData.labResultsTemplate, (question: QuestionModel) => {
            actualRemoveNewFlag(question);
        });
        _.each(outbreakData.contactFollowUpTemplate, (question: QuestionModel) => {
            actualRemoveNewFlag(question);
        });
        _.each(outbreakData.caseInvestigationTemplate, (question: QuestionModel) => {
            actualRemoveNewFlag(question);
        });
    }

    /**
     * Handles form submit
     * @param form
     */
    modifyOutbreak(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // const dirtyFields: any = this.formHelper.getFields(form);
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // remove property "new" for every question
        this.cleanQuestionnaireNewFlag(dirtyFields);

        // modify the outbreak
        this.outbreakDataService
            .modifyOutbreak(this.outbreakId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe((modifiedOutbreak: OutbreakModel) => {
                this.outbreak = new OutbreakModel(modifiedOutbreak);

                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_OUTBREAK_ACTION_MODIFY_OUTBREAK_SUCCESS_MESSAGE');
                // update language tokens to get the translation of submitted questions and answers
                this.i18nService.loadUserLanguage().subscribe();
                // update breadcrumbs
                this.createBreadcrumbs();
            });
    }

    /**
     * Check if we have write access to outbreaks
     * @returns {boolean}
     */
    hasOutbreakWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_OUTBREAK);
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [];
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAKS_TITLE', '/outbreaks'),
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_OUTBREAK_TITLE' : 'LNG_PAGE_MODIFY_OUTBREAK_LINK_MODIFY',
                '.',
                true,
                {},
                this.outbreak
            )
        );
    }
}

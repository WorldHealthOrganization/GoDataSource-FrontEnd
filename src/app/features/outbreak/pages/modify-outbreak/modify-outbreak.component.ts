import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { MatTabChangeEvent } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as _ from 'lodash';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';

@Component({
    selector: 'app-modify-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-outbreak.component.html',
    styleUrls: ['./modify-outbreak.component.less']
})
export class ModifyOutbreakComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_LAYOUT_MENU_ITEM_OUTBREAKS_LABEL', '/outbreaks')
    ];

    // id of the outbreak to modify
    outbreakId: string;
    // outbreak to modify
    outbreak: OutbreakModel = new OutbreakModel();
    // list of diseases
    diseasesList$: Observable<any[]>;
    // list of countries
    countriesList$: Observable<any[]>;

    // controls for switching between view and edit mode
    viewOnly = true;
    // index of the current tab
    currentTabIndex = 0;

    constructor(
        private outbreakDataService: OutbreakDataService,
        protected route: ActivatedRoute,
        private router: Router,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private i18nService: I18nService,
        private formHelper: FormHelperService
    ) {
        super(route);
    }

    ngOnInit() {
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
        this.countriesList$ = this.genericDataService.getCountriesList();

        this.route.params
            .subscribe((params: {outbreakId}) => {
                this.outbreakId = params.outbreakId;
                // get the outbreak to modify
                this.outbreakDataService
                    .getOutbreak(this.outbreakId)
                    .subscribe(outbreakData => {
                        this.outbreak = outbreakData;
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(
                                this.viewOnly ? 'LNG_PAGE_VIEW_OUTBREAK_TITLE' : 'LNG_PAGE_MODIFY_OUTBREAK_LINK_MODIFY',
                                '.',
                                true,
                                {},
                                this.outbreak
                            )
                        );

                        // set questions and answers to new property to false.
                        this.setNewFalse(this.outbreak.caseInvestigationTemplate);
                        this.setNewFalse(this.outbreak.contactFollowUpTemplate);
                        this.setNewFalse(this.outbreak.labResultsTemplate);
                    });
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

        // modify the outbreak
        this.outbreakDataService
            .modifyOutbreak(this.outbreakId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_OUTBREAK_ACTION_MODIFY_OUTBREAK_SUCCESS_MESSAGE');
                // update language tokens to get the translation of submitted questions and answers
                this.i18nService.loadUserLanguage().subscribe();
                // navigate to listing page
                this.router.navigate(['/outbreaks']);
            });
    }

    /**
     * Enable edit on questionnaires tabs
     */
    enableEdit() {
        this.viewOnly = false;
    }

    /**
     * Disable edit on questionnaires tabs
     */
    disableEdit() {
        this.viewOnly = true;
    }

    /**
     *  Save the current tab index
     */
    selectTab(tabChangeEvent: MatTabChangeEvent): void {
        this.currentTabIndex = tabChangeEvent.index;
    }

    /**
     * Set attribute new to false for all questions and answers in the array.
     */
    setNewFalse(questionsArray = []) {
        if (!_.isEmpty(questionsArray)) {
            _.forEach(questionsArray, function (question, key) {
                questionsArray[key].new = false;
                if (!_.isEmpty(questionsArray[key].answers)) {
                    _.forEach(questionsArray[key].answers, function (answer, keyAnswer) {
                        questionsArray[key].answers[keyAnswer].new = false;
                    });
                }
            });
        }
    }

}

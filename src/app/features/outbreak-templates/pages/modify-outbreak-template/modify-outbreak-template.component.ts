import { Component, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute, Router } from '@angular/router';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import * as _ from 'lodash';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { MatTabChangeEvent } from '@angular/material';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
    selector: 'app-modify-outbreak-template',
    templateUrl: './modify-outbreak-template.component.html',
    styleUrls: ['./modify-outbreak-template.component.less']
})
export class ModifyOutbreakTemplateComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_TEMPLATE_TITLE', '/outbreak-templates')
    ];

    // authenticated user
    authUser: UserModel;
    // id of the outbreak to modify
    outbreakTemplateId: string;
    // outbreak to modify
    outbreakTemplate: OutbreakTemplateModel = new OutbreakTemplateModel();
    // list of diseases
    diseasesList$: Observable<any[]>;
    // list of countries
    countriesList$: Observable<any[]>;

    // index of the current tab
    currentTabIndex = 0;

    constructor(
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService,
        private outbreakDataService: OutbreakDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private i18nService: I18nService,
        private router: Router,
        private authDataService: AuthDataService)
    {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        // get the lists for form
        this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
        this.countriesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.COUNTRY).map(
            (countries) => _.map(countries, (country: LabelValuePair) => {
                country.value = {
                    id: country.value
                };
                return country;
            })
        );

        this.route.params
            .subscribe((params: { outbreakTemplateId }) => {
                this.outbreakTemplateId = params.outbreakTemplateId;
                // get the outbreak to modify
                this.outbreakDataService
                    .getOutbreakTemplate(this.outbreakTemplateId)
                    .subscribe(outbreakTemplateData => {
                        this.outbreakTemplate = outbreakTemplateData;
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(
                                this.viewOnly ? 'LNG_PAGE_VIEW_OUTBREAK_TEMPLATE_TITLE' : 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_LINK_MODIFY',
                                '.',
                                true,
                                {},
                                this.outbreakTemplate
                            )
                        );
                    });
            });
    }

    /**
     * Handle form submit
     * @param form
     */
    modifyOutbreakTemplate(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // modify the outbreak template
        this.outbreakDataService
            .modifyOutbreakTemplate(this.outbreakTemplateId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_OUTBREAK_ACTION_MODIFY_OUTBREAK_SUCCESS_MESSAGE');
                // update language tokens to get the translation of submitted questions and answers
                this.i18nService.loadUserLanguage().subscribe();
                // navigate to listing page
                this.disableDirtyConfirm();
                this.router.navigate(['/outbreak-templates']);
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
     *  Save the current tab index
     */
    selectTab(tabChangeEvent: MatTabChangeEvent): void {
        this.currentTabIndex = tabChangeEvent.index;
    }
}

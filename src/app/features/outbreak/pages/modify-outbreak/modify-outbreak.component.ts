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
import { UserModel } from '../../../../core/models/user.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';

@Component({
    selector: 'app-modify-outbreak',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-outbreak.component.html',
    styleUrls: ['./modify-outbreak.component.less']
})
export class ModifyOutbreakComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAKS_TITLE', '/outbreaks')
    ];
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
        private formHelper: FormHelperService,
        private authDataService: AuthDataService
    ) {
        super(route);

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

    ngOnInit() {
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
                    });
            });
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
                this.disableDirtyConfirm();
                this.router.navigate(['/outbreaks']);
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

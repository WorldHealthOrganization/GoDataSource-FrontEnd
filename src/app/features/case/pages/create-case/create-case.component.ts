import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { Moment } from 'moment';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as _ from 'lodash';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType } from '../../../../shared/components';
import { EntityModel } from '../../../../core/models/entity.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-create-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-case.component.html',
    styleUrls: ['./create-case.component.less']
})
export class CreateCaseComponent extends ConfirmOnFormChanges implements OnInit {
    @ViewChild('personalForm') personalForm: NgForm;
    @ViewChild('infectionForm') infectionForm: NgForm;

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_CASE_TITLE', '.', true)
    ];

    caseData: CaseModel = new CaseModel();

    genderList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;
    caseRiskLevelsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    outcomeList$: Observable<any[]>;

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    serverToday: Moment = null;
    Constants = Constants;

    visualIDTranslateData: {
        mask: string
    };

    caseIdMaskValidator: Observable<boolean>;

    constructor(
        private router: Router,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private genericDataService: GenericDataService,
        private dialogService: DialogService,
        private i18nService: I18nService
    ) {
        super();
    }

    ngOnInit() {
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);
        this.caseRiskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.outcomeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OUTCOME);

        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

        // by default, enforce Case having an address
        this.caseData.addresses.push(new AddressModel());
        // pre-set the initial address as "current address"
        this.caseData.addresses[0].typeId = AddressType.CURRENT_ADDRESS;

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // set visual ID translate data
                this.visualIDTranslateData = {
                    mask: CaseModel.generateCaseIDMask(this.selectedOutbreak.caseIdMask)
                };

                // set visual id for case
                this.caseData.visualId = this.visualIDTranslateData.mask;

                // set visual ID validator
                this.caseIdMaskValidator = Observable.create((observer) => {
                    this.caseDataService.checkCaseVisualIDValidity(
                        this.selectedOutbreak.id,
                        this.caseData.visualId
                    ).subscribe((isValid: boolean) => {
                        observer.next(isValid);
                        observer.complete();
                    });
                });
            });
    }

    /**
     * Create new Case
     * @param stepForms
     */
    createNewCase(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        // remove id if empty string since loopback doesn't know how to handle this
        if (_.isEmpty(dirtyFields.id)) {
            delete dirtyFields.id;
        }

        // add age & dob information
        if (dirtyFields.ageDob) {
            dirtyFields.age = dirtyFields.ageDob.age;
            dirtyFields.dob = dirtyFields.ageDob.dob;
            delete dirtyFields.ageDob;
        }

        // validate
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // check for duplicates
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.caseDataService
                .findDuplicates(this.selectedOutbreak.id, dirtyFields)
                .catch((err) => {
                    if (_.includes(_.get(err, 'details.codes.id'), `uniqueness`)) {
                        this.snackbarService.showError('LNG_PAGE_CREATE_CASE_ERROR_UNIQUE_ID');
                    } else {
                        this.snackbarService.showApiError(err);
                    }

                    // hide dialog
                    loadingDialog.close();

                    return ErrorObservable.create(err);
                })
                .subscribe((caseDuplicates: EntityDuplicatesModel) => {
                    // add the new Case
                    const runCreateCase = () => {
                        this.caseDataService
                            .createCase(this.selectedOutbreak.id, dirtyFields)
                            .catch((err) => {
                                this.snackbarService.showApiError(err);

                                // hide dialog
                                loadingDialog.close();

                                return ErrorObservable.create(err);
                            })
                            .subscribe((newCase: CaseModel) => {
                                this.snackbarService.showSuccess('LNG_PAGE_CREATE_CASE_ACTION_CREATE_CASE_SUCCESS_MESSAGE');

                                // hide dialog
                                loadingDialog.close();

                                // navigate to listing page
                                this.disableDirtyConfirm();
                                this.router.navigate([`/cases/${newCase.id}/modify`]);
                            });
                    };

                    // do we have duplicates ?
                    if (caseDuplicates.duplicates.length > 0) {
                        // construct list of possible duplicates
                        const possibleDuplicates: DialogField[] = [];
                        _.each(caseDuplicates.duplicates, (duplicate: EntityModel, index: number) => {
                            // case model
                            const caseData: CaseModel = duplicate.model as CaseModel;

                            // add link
                            possibleDuplicates.push(new DialogField({
                                name: 'link',
                                placeholder: (index + 1 ) + '. ' + EntityModel.getNameWithDOBAge(
                                    caseData,
                                    this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                    this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                ),
                                fieldType: DialogFieldType.LINK,
                                routerLink: ['/cases', caseData.id, 'view'],
                                linkTarget: '_blank'
                            }));
                        });

                        // display dialog
                        this.dialogService.showConfirm(new DialogConfiguration({
                            message: 'LNG_PAGE_CREATE_CASE_DUPLICATES_DIALOG_CONFIRM_MSG',
                            customInput: true,
                            fieldsList: possibleDuplicates,
                        }))
                        .subscribe((answer) => {
                            if (answer.button === DialogAnswerButton.Yes) {
                                runCreateCase();
                            } else {
                                // hide dialog
                                loadingDialog.close();
                            }
                        });
                    } else {
                        runCreateCase();
                    }
                });
        }
    }
}

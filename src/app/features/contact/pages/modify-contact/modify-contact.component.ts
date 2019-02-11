import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { ContactModel } from '../../../../core/models/contact.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Moment } from 'moment';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { DialogAnswer, DialogAnswerButton, DialogButton, DialogComponent, DialogConfiguration, DialogField } from '../../../../shared/components';
import * as _ from 'lodash';
import { EntityModel } from '../../../../core/models/entity.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-modify-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact.component.html',
    styleUrls: ['./modify-contact.component.less']
})
export class ModifyContactComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    contactId: string;
    outbreakId: string;

    contactData: ContactModel = new ContactModel();

    genderList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    finalFollowUpStatus$: Observable<any[]>;

    // provide constants to template
    EntityType = EntityType;

    serverToday: Moment = null;

    visualIDTranslateData: {
        mask: string
    };

    contactIdMaskValidator: Observable<boolean>;

    constructor(
        private referenceDataDataService: ReferenceDataDataService,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private contactDataService: ContactDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router,
        private genericDataService: GenericDataService,
        private dialogService: DialogService,
        private i18nService: I18nService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.finalFollowUpStatus$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_FINAL_FOLLOW_UP_STATUS);

        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

        this.route.params
            .subscribe((params: {contactId}) => {
                this.contactId = params.contactId;

                // get current outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakId = selectedOutbreak.id;

                        // get contact
                        this.contactDataService
                            .getContact(selectedOutbreak.id, this.contactId)
                            .subscribe(contactDataReturned => {
                                this.contactData = new ContactModel(contactDataReturned);

                                // set visual ID translate data
                                this.visualIDTranslateData = {
                                    mask: ContactModel.generateContactIDMask(selectedOutbreak.contactIdMask)
                                };

                                // set visual ID validator
                                this.contactIdMaskValidator = Observable.create((observer) => {
                                    this.contactDataService.checkContactVisualIDValidity(
                                        selectedOutbreak.id,
                                        this.visualIDTranslateData.mask,
                                        this.contactData.visualId,
                                        this.contactData.id
                                    ).subscribe((isValid: boolean) => {
                                        observer.next(isValid);
                                        observer.complete();
                                    });
                                });

                                this.createBreadcrumbs();
                            });
                    });
            });
    }

    /**
     * Check if we have write access to contacts
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

    modifyContact(form: NgForm) {
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

        // check for duplicates
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.contactDataService
            .findDuplicates(this.outbreakId, {
                ...this.contactData,
                ...dirtyFields
            })
            .catch((err) => {
                this.snackbarService.showApiError(err);

                // hide dialog
                loadingDialog.close();

                return ErrorObservable.create(err);
            })
            .subscribe((contactDuplicates: EntityDuplicatesModel) => {
                // modify Contact
                const runModifyContact = (finishCallBack?: () => void) => {
                    // modify the contact
                    this.contactDataService
                        .modifyContact(this.outbreakId, this.contactId, dirtyFields)
                        .catch((err) => {
                            this.snackbarService.showApiError(err);
                            loadingDialog.close();
                            return ErrorObservable.create(err);
                        })
                        .subscribe((modifiedContact: ContactModel) => {
                            // update model
                            this.contactData = modifiedContact;

                            // mark form as pristine
                            form.form.markAsPristine();

                            // display message
                            if (!finishCallBack) {
                                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CONTACT_ACTION_MODIFY_CONTACT_SUCCESS_MESSAGE');

                                // update breadcrumb
                                this.createBreadcrumbs();

                                // hide dialog
                                loadingDialog.close();
                            } else {
                                // finished
                                finishCallBack();
                            }
                        });
                };

                // do we have duplicates ?
                if (contactDuplicates.duplicates.length > 0) {
                    // display dialog
                    const showDialog = () => {
                        this.dialogService.showConfirm(new DialogConfiguration({
                            message: 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
                            yesLabel: 'LNG_COMMON_BUTTON_MERGE',
                            customInput: true,
                            fieldsList: [new DialogField({
                                name: 'mergeWith',
                                placeholder: 'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_LABEL_MERGE_WITH',
                                inputOptions: _.map(contactDuplicates.duplicates, (duplicate: EntityModel, index: number) => {
                                    // contact model
                                    const contactData: ContactModel = duplicate.model as ContactModel;

                                    // map
                                    return new LabelValuePair((index + 1) + '. ' +
                                        EntityModel.getNameWithDOBAge(
                                            contactData,
                                            this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                            this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                        ),
                                        contactData.id
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
                                    this.snackbarService.showError('LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_ACTION_MERGE_AT_LEAST_ONE_ERROR_MESSAGE');

                                    // display dialog again
                                    showDialog();

                                    // finished here
                                    return;
                                }

                                // save data first, followed by redirecting to merge
                                runModifyContact(() => {
                                    // construct list of ids
                                    const mergeIds: string[] = [
                                        this.contactId,
                                        ...answer.inputValue.value.mergeWith
                                    ];

                                    // hide dialog
                                    loadingDialog.close();

                                    // redirect to merge
                                    this.router.navigate(
                                        ['/duplicated-records', EntityModel.getLinkForEntityType(EntityType.CONTACT), 'merge'], {
                                            queryParams: {
                                                ids: JSON.stringify(mergeIds)
                                            }
                                        }
                                    );
                                });
                            } else if (answer.button === DialogAnswerButton.Extra_1) {
                                runModifyContact();
                            } else {
                                // hide dialog
                                loadingDialog.close();
                            }
                        });
                    };

                    // display dialog
                    showDialog();
                } else {
                    runModifyContact();
                }
            });
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [];
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_CONTACT_TITLE' : 'LNG_PAGE_MODIFY_CONTACT_TITLE',
                '.',
                true,
                {},
                this.contactData
            )
        );
    }
}

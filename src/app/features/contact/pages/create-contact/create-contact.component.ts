import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Observable } from 'rxjs';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType } from '../../../../shared/components';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { RelationshipPersonModel } from '../../../../core/models/relationship-person.model';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-create-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-contact.component.html',
    styleUrls: ['./create-contact.component.less']
})
export class CreateContactComponent
    extends CreateConfirmOnChanges
    implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // selected outbreak
    selectedOutbreak: OutbreakModel = new OutbreakModel();

    contactData: ContactModel = new ContactModel();

    entityType: EntityType;
    entityId: string;

    genderList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;
    pregnancyStatusList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;

    relatedEntityData: CaseModel | EventModel;
    relationship: RelationshipModel = new RelationshipModel();

    serverToday: Moment = moment();

    visualIDTranslateData: {
        mask: string
    };

    contactIdMaskValidator: Observable<boolean>;

    // authenticated user details
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService,
        private i18nService: I18nService,
        private redirectService: RedirectService,
        private authDataService: AuthDataService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);
        this.pregnancyStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PREGNANCY_STATUS);
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);

        // by default, enforce Contact having an address
        this.contactData.addresses.push(new AddressModel());
        // pre-set the initial address as "current address"
        this.contactData.addresses[0].typeId = AddressType.CURRENT_ADDRESS;

        // retrieve query params
        this.route.queryParams
            .subscribe((params: {entityType, entityId}) => {
                this.entityType = _.get(params, 'entityType');
                this.entityId = _.get(params, 'entityId');

                // check if we have proper values ( case or event ID )
                if (
                    !this.entityType ||
                    !this.entityId
                ) {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_WARNING_CASE_OR_EVENT_REQUIRED');

                    // navigate to Cases/Events listing page
                    this.disableDirtyConfirm();
                    if (this.entityType === EntityType.EVENT) {
                        this.router.navigate(['/events']);
                    } else {
                        this.router.navigate(['/cases']);
                    }

                    return;
                }

                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .pipe(
                        catchError((err) => {
                            // show error message
                            this.snackbarService.showApiError(err);

                            // redirect to cases
                            this.disableDirtyConfirm();
                            this.router.navigate(['/cases']);
                            return throwError(err);
                        })
                    )
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.selectedOutbreak = selectedOutbreak;

                        // set visual ID translate data
                        this.visualIDTranslateData = {
                            mask: ContactModel.generateContactIDMask(selectedOutbreak.contactIdMask)
                        };

                        // set visual id for contact
                        this.contactData.visualId = this.visualIDTranslateData.mask;

                        // set visual ID validator
                        this.contactIdMaskValidator = new Observable((observer) => {
                            this.contactDataService.checkContactVisualIDValidity(
                                selectedOutbreak.id,
                                this.visualIDTranslateData.mask,
                                this.contactData.visualId
                            ).subscribe((isValid: boolean) => {
                                observer.next(isValid);
                                observer.complete();
                            });
                        });

                        // retrieve Case/Event information
                        this.entityDataService
                            .getEntity(this.entityType, selectedOutbreak.id, this.entityId)
                            .pipe(
                                catchError((err) => {
                                    // show error message
                                    this.snackbarService.showApiError(err);

                                    // navigate to Cases/Events listing page
                                    this.disableDirtyConfirm();
                                    if (this.entityType === EntityType.EVENT) {
                                        this.router.navigate(['/events']);
                                    } else {
                                        this.router.navigate(['/cases']);
                                    }

                                    return throwError(err);
                                })
                            )
                            .subscribe((relatedEntityData: CaseModel|EventModel) => {
                                // initialize Case/Event
                                this.relatedEntityData = relatedEntityData;

                                // initialize page breadcrumbs
                                this.initializeBreadcrumbs();

                                this.relationship.persons.push(
                                    new RelationshipPersonModel({
                                        id: this.entityId
                                    })
                                );
                            });
                    });
            });
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // do we have related data ?
        if (this.relatedEntityData) {
            // case or event?
            if (this.relatedEntityData.type === EntityType.CASE) {
                // case list
                if (CaseModel.canList(this.authUser)) {
                    this.breadcrumbs.push(
                        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
                    );
                }

                // case view - this oen is required, but might change later
                if (CaseModel.canView(this.authUser)) {
                    this.breadcrumbs.push(
                        new BreadcrumbItemModel(this.relatedEntityData.name, `/cases/${this.relatedEntityData.id}/view`)
                    );
                }
            } else if (this.relatedEntityData.type === EntityType.EVENT) {
                // event list
                if (EventModel.canList(this.authUser)) {
                    this.breadcrumbs.push(
                        new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '/events')
                    );
                }

                // event view - this oen is required, but might change later
                if (EventModel.canView(this.authUser)) {
                    this.breadcrumbs.push(
                        new BreadcrumbItemModel(this.relatedEntityData.name, `/events/${this.relatedEntityData.id}/view`)
                    );
                }
            } else {
                // NOT SUPPORTED :)
            }
        }

        // current page breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_CREATE_CONTACT_TITLE', '.', true)
        );
    }

    /**
     * Create Contact
     * @param {NgForm[]} stepForms
     * @param {boolean} andAnotherOne
     */
    createNewContact(stepForms: NgForm[], andAnotherOne: boolean = false) {
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        )  {
            return;
        }

        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);
        const relationship = _.get(dirtyFields, 'relationship');
        delete dirtyFields.relationship;

        // add age & dob information
        if (dirtyFields.ageDob) {
            dirtyFields.age = dirtyFields.ageDob.age;
            dirtyFields.dob = dirtyFields.ageDob.dob;
            delete dirtyFields.ageDob;
        }

        // create relationship & contact
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields) &&
            !_.isEmpty(relationship)
        ) {
            // check for duplicates
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.contactDataService
                .findDuplicates(this.selectedOutbreak.id, dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);

                        // hide dialog
                        loadingDialog.close();

                        return throwError(err);
                    })
                )
                .subscribe((contactDuplicates: EntityDuplicatesModel) => {
                    // items marked as not duplicates
                    let itemsMarkedAsNotDuplicates: string[] = [];

                    // add the new Contact
                    const runCreateContact = () => {
                        // add the new Contact
                        this.contactDataService
                            .createContact(this.selectedOutbreak.id, dirtyFields)
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);

                                    // hide dialog
                                    loadingDialog.close();

                                    return throwError(err);
                                })
                            )
                            .subscribe((contactData: ContactModel) => {
                                this.relationshipDataService
                                    .createRelationship(
                                        this.selectedOutbreak.id,
                                        EntityType.CONTACT,
                                        contactData.id,
                                        relationship
                                    )
                                    .pipe(
                                        catchError((err) => {
                                            // display error message
                                            this.snackbarService.showApiError(err);

                                            // remove contact
                                            this.contactDataService
                                                .deleteContact(this.selectedOutbreak.id, contactData.id)
                                                .subscribe();

                                            // hide dialog
                                            loadingDialog.close();

                                            // finished
                                            return throwError(err);
                                        })
                                    )
                                    .subscribe(() => {
                                        // called when we finished creating contact
                                        const finishedCreatingContact = () => {
                                            this.snackbarService.showSuccess('LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE');

                                            // hide dialog
                                            loadingDialog.close();

                                            // navigate to listing page
                                            if (andAnotherOne) {
                                                this.disableDirtyConfirm();
                                                this.redirectService.to(
                                                    [`/contacts/create`],
                                                    {
                                                        entityType: this.entityType,
                                                        entityId: this.entityId
                                                    }
                                                );
                                            } else {
                                                // navigate to proper page
                                                // method handles disableDirtyConfirm too...
                                                this.redirectToProperPageAfterCreate(
                                                    this.router,
                                                    this.redirectService,
                                                    this.authUser,
                                                    ContactModel,
                                                    'contacts',
                                                    contactData.id, {
                                                        entityType: this.entityType,
                                                        entityId: this.entityId
                                                    }
                                                );
                                            }
                                        };

                                        // there are no records marked as NOT duplicates ?
                                        if (
                                            !itemsMarkedAsNotDuplicates ||
                                            itemsMarkedAsNotDuplicates.length < 1
                                        ) {
                                            finishedCreatingContact();
                                        } else {
                                            // mark records as not duplicates
                                            this.entityDataService
                                                .markPersonAsOrNotADuplicate(
                                                    this.selectedOutbreak.id,
                                                    EntityType.CONTACT,
                                                    contactData.id,
                                                    itemsMarkedAsNotDuplicates
                                                )
                                                .pipe(
                                                    catchError((err) => {
                                                        this.snackbarService.showApiError(err);

                                                        // hide dialog
                                                        loadingDialog.close();

                                                        return throwError(err);
                                                    })
                                                )
                                                .subscribe(() => {
                                                    // finished
                                                    finishedCreatingContact();
                                                });
                                        }
                                    });
                            });
                    };

                    // do we have duplicates ?
                    if (contactDuplicates.duplicates.length > 0) {
                        // construct list of items from which we can choose actions
                        const fieldsList: DialogField[] = [];
                        const fieldsListLayout: number[] = [];
                        contactDuplicates.duplicates.forEach((duplicate: EntityModel, index: number) => {
                            // contact model
                            const contactData: ContactModel = duplicate.model as ContactModel;

                            // add row fields
                            fieldsListLayout.push(60, 40);
                            fieldsList.push(
                                new DialogField({
                                    name: `actions[${contactData.id}].label`,
                                    placeholder: (index + 1) + '. ' + EntityModel.getNameWithDOBAge(
                                        contactData,
                                        this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                                        this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                                    ),
                                    fieldType: DialogFieldType.LINK,
                                    routerLink: ['/contacts', contactData.id, 'view'],
                                    linkTarget: '_blank'
                                }),
                                new DialogField({
                                    name: `actions[${contactData.id}].action`,
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
                                        )
                                    ],
                                    inputOptionsClearable: false,
                                    required: true,
                                    value: Constants.DUPLICATE_ACTION.NO_ACTION
                                })
                            );
                        });

                        // display dialog
                        this.dialogService
                            .showConfirm(new DialogConfiguration({
                                message: 'LNG_PAGE_CREATE_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
                                customInput: true,
                                fieldsListLayout: fieldsListLayout,
                                fieldsList: fieldsList
                            }))
                            .subscribe((answer) => {
                                if (answer.button === DialogAnswerButton.Yes) {
                                    // determine number of items to mark as not duplicates
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
                                            }
                                        });
                                    }

                                    // create contact
                                    runCreateContact();
                                } else {
                                    // hide dialog
                                    loadingDialog.close();
                                }
                            });
                    } else {
                        runCreateContact();
                    }
                });
        }
    }
}

import * as _ from 'lodash';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ContactModel } from '../../../../core/models/contact.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Observable, Subscriber, throwError } from 'rxjs';
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
import {
  catchError,
  share
} from 'rxjs/operators';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { Constants } from '../../../../core/models/constants';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { TimerCache } from '../../../../core/helperClasses/timer-cache';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-create-contact',
  templateUrl: './create-contact.component.html'
})
export class CreateContactComponent
  extends CreateConfirmOnChanges
  implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  // selected outbreak
  selectedOutbreak: OutbreakModel = new OutbreakModel();

  contactData: ContactModel = new ContactModel();

  entityType: EntityType;
  entityId: string;

  genderList$: Observable<any[]>;
  occupationsList$: Observable<any[]>;
  pregnancyStatusList$: Observable<any[]>;
  riskLevelsList$: Observable<any[]>;
  teamList$: Observable<TeamModel[]>;
  userList$: Observable<UserModel[]>;

  relatedEntityData: CaseModel | EventModel;
  relationship: RelationshipModel = new RelationshipModel();

  serverToday: Moment = moment();

  visualIDTranslateData: {
    mask: string
  };

  contactIdMaskValidator: Observable<boolean>;

  // authenticated user details
  authUser: UserModel;

  // constants
  TeamModel = TeamModel;
  UserModel = UserModel;
  Constants = Constants;
  EntityType = EntityType;

  // check for case existence
  personDuplicates: (ContactModel | CaseModel)[] = [];
  checkingForCaseDuplicate: boolean = false;
  private _previousChecked: {
    firstName: string,
    lastName: string,
    middleName: string
  } = {
      firstName: '',
      lastName: '',
      middleName: ''
    };
  private _checkForDuplicate = new DebounceTimeCaller(new Subscriber<void>(() => {
    // nothing to show ?
    if (
      !this.selectedOutbreak?.id ||
            (
              this.contactData.firstName &&
                !this.contactData.lastName &&
                !this.contactData.middleName
            ) || (
        this.contactData.lastName &&
                !this.contactData.firstName &&
                !this.contactData.middleName
      ) || (
        this.contactData.middleName &&
                !this.contactData.firstName &&
                !this.contactData.lastName
      )
    ) {
      // reset
      this.personDuplicates = [];
      this.checkingForCaseDuplicate = false;
      this._previousChecked.firstName = this.contactData.firstName;
      this._previousChecked.lastName = this.contactData.lastName;
      this._previousChecked.middleName = this.contactData.middleName;

      // nothing to do
      return;
    }

    // same as before ?
    if (
      this._previousChecked.firstName === this.contactData.firstName &&
            this._previousChecked.lastName === this.contactData.lastName &&
            this._previousChecked.middleName === this.contactData.middleName
    ) {
      // nothing to do
      return;
    }

    // must check if there is a contact with the same name
    this._previousChecked.firstName = this.contactData.firstName;
    this._previousChecked.lastName = this.contactData.lastName;
    this._previousChecked.middleName = this.contactData.middleName;
    this.checkingForCaseDuplicate = true;
    forkJoin([
      this.caseDataService
        .findDuplicates(
          this.selectedOutbreak.id,
          this._previousChecked
        ),
      this.contactDataService
        .findDuplicates(
          this.selectedOutbreak.id,
          this._previousChecked
        )
    ]).subscribe((
      [foundCases, foundContacts]: [
        EntityDuplicatesModel,
        EntityDuplicatesModel
      ]
    ) => {
      // finished
      this.checkingForCaseDuplicate = false;

      // did we find anything ?
      this.personDuplicates = [
        ...(foundCases ?
          foundCases.duplicates.map((item) => item.model as CaseModel) :
          []
        ),
        ...(foundContacts ?
          foundContacts.duplicates.map((item) => item.model as ContactModel) :
          []
        )
      ];
    });
  }));

  /**
     * Constructor
     */
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private contactDataService: ContactDataService,
    private entityDataService: EntityDataService,
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private formHelper: FormHelperService,
    private relationshipDataService: RelationshipDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private dialogService: DialogService,
    private i18nService: I18nService,
    private redirectService: RedirectService,
    private authDataService: AuthDataService,
    private teamDataService: TeamDataService,
    private systemSettingsDataService: SystemSettingsDataService,
    private userDataService: UserDataService,
    private caseDataService: CaseDataService
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

    // get teams only if we're allowed to
    if (TeamModel.canList(this.authUser)) {
      this.teamList$ = this.teamDataService.getTeamsListReduced();
    }

    // get users only if we're allowed to
    if (UserModel.canList(this.authUser)) {
      this.userList$ = this.userDataService.getUsersListSorted().pipe(share());
    }

    // by default, enforce Contact having an address
    this.contactData.addresses.push(new AddressModel());
    // pre-set the initial address as "current address"
    this.contactData.addresses[0].typeId = AddressType.CURRENT_ADDRESS;

    // retrieve query params
    this.route.queryParams
      .subscribe((params: { entityType, entityId }) => {
        this.entityType = _.get(params, 'entityType');
        this.entityId = _.get(params, 'entityId');

        // check if we have proper values ( case or event ID )
        if (
          !this.entityType ||
                    !this.entityId
        ) {
          this.toastV2Service.success('LNG_PAGE_CREATE_CONTACT_WARNING_CASE_OR_EVENT_REQUIRED');

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
              this.toastV2Service.error(err);

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
              // construct cache key
              const cacheKey: string = 'CCO_' + selectedOutbreak.id +
                                this.visualIDTranslateData.mask +
                                this.contactData.visualId;

              // get data from cache or execute validator
              TimerCache.run(
                cacheKey,
                this.contactDataService.checkContactVisualIDValidity(
                  selectedOutbreak.id,
                  this.visualIDTranslateData.mask,
                  this.contactData.visualId
                )
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
                  this.toastV2Service.error(err);

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
              .subscribe((relatedEntityData: CaseModel | EventModel) => {
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
     * Component destroyed
     */
  ngOnDestroy(): void {
    if (this._checkForDuplicate) {
      this._checkForDuplicate.unsubscribe();
      this._checkForDuplicate = null;
    }
  }

  /**
     * Initialize breadcrumbs
     */
  private initializeBreadcrumbs() {
    // // reset
    // this.breadcrumbs = [];
    //
    // // do we have related data ?
    // if (this.relatedEntityData) {
    //   // case or event?
    //   if (this.relatedEntityData.type === EntityType.CASE) {
    //     // case list
    //     if (CaseModel.canList(this.authUser)) {
    //       this.breadcrumbs.push(
    //         new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
    //       );
    //     }
    //
    //     // case view - this oen is required, but might change later
    //     if (CaseModel.canView(this.authUser)) {
    //       this.breadcrumbs.push(
    //         new BreadcrumbItemModel(this.relatedEntityData.name, `/cases/${this.relatedEntityData.id}/view`)
    //       );
    //     }
    //   } else if (this.relatedEntityData.type === EntityType.EVENT) {
    //     // event list
    //     if (EventModel.canList(this.authUser)) {
    //       this.breadcrumbs.push(
    //         new BreadcrumbItemModel('LNG_PAGE_LIST_EVENTS_TITLE', '/events')
    //       );
    //     }
    //
    //     // event view - this oen is required, but might change later
    //     if (EventModel.canView(this.authUser)) {
    //       this.breadcrumbs.push(
    //         new BreadcrumbItemModel(this.relatedEntityData.name, `/events/${this.relatedEntityData.id}/view`)
    //       );
    //     }
    //   } else {
    //     // NOT SUPPORTED :)
    //   }
    // }
    //
    // // current page breadcrumb
    // this.breadcrumbs.push(
    //   new BreadcrumbItemModel('LNG_PAGE_CREATE_CONTACT_TITLE', '.', true)
    // );
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
      !this.formHelper.isFormsSetValid(stepForms) ||
            _.isEmpty(dirtyFields) ||
            _.isEmpty(relationship)
    ) {
      return;
    }

    // items marked as not duplicates
    let itemsMarkedAsNotDuplicates: string[] = [];

    // add the new Contact
    const loadingDialog = this.dialogService.showLoadingDialog();
    const runCreateContact = () => {
      // add the new Contact
      this.contactDataService
        .createContact(
          this.selectedOutbreak.id,
          dirtyFields
        )
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);

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
                this.toastV2Service.error(err);

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
                this.toastV2Service.success('LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE');

                // hide dialog
                loadingDialog.close();

                // navigate to listing page
                if (andAnotherOne) {
                  this.disableDirtyConfirm();
                  this.redirectService.to(
                    ['/contacts/create'],
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
                      this.toastV2Service.error(err);

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

    // check if we need to determine duplicates
    this.systemSettingsDataService
      .getAPIVersion()
      .subscribe((versionData: SystemSettingsVersionModel) => {
        // no duplicates - proceed to create contact ?
        if (versionData.duplicate.disableContactDuplicateCheck) {
          // no need to check for duplicates
          runCreateContact();

          // finished
          return;
        }

        // check for duplicates
        this.contactDataService
          .findDuplicates(
            this.selectedOutbreak.id,
            dirtyFields
          )
          .pipe(
            catchError((err) => {
              this.toastV2Service.error(err);

              // hide dialog
              loadingDialog.close();

              return throwError(err);
            })
          )
          .subscribe((contactDuplicates: EntityDuplicatesModel) => {
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
      });
  }

  /**
     * Check if a case exists with the same name
     */
  checkForPersonExistence(): void {
    // wait a bit before checking
    this._checkForDuplicate.call();
  }
}

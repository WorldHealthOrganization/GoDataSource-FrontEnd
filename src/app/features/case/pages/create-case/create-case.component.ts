import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Observable, Subscriber } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { EntityDuplicatesModel } from '../../../../core/models/entity-duplicates.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType } from '../../../../shared/components';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Constants } from '../../../../core/models/constants';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { throwError } from 'rxjs';
import {
  catchError,
  share
} from 'rxjs/operators';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { UserModel } from '../../../../core/models/user.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { TimerCache } from '../../../../core/helperClasses/timer-cache';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSettingsVersionModel } from '../../../../core/models/system-settings-version.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { DebounceTimeCaller } from '../../../../core/helperClasses/debounce-time-caller';
import { ContactModel } from '../../../../core/models/contact.model';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-create-case',
  templateUrl: './create-case.component.html'
})
export class CreateCaseComponent
  extends CreateConfirmOnChanges
  implements OnInit, OnDestroy {
  // breadcrumbs
  breadcrumbs: BreadcrumbItemModel[] = [];

  @ViewChild('personalForm', { static: true }) personalForm: NgForm;
  @ViewChild('infectionForm', { static: true }) infectionForm: NgForm;

  caseData: CaseModel = new CaseModel();
  // case UID (coming from query params, optionally)
  caseUID: string;

  genderList$: Observable<any[]>;
  caseClassificationsList$: Observable<any[]>;
  caseRiskLevelsList$: Observable<any[]>;
  occupationsList$: Observable<any[]>;
  outcomeList$: Observable<any[]>;
  pregnancyStatusList$: Observable<any[]>;
  userList$: Observable<UserModel[]>;

  selectedOutbreak: OutbreakModel = new OutbreakModel();

  serverToday: Moment = moment();
  Constants = Constants;

  visualIDTranslateData: {
    mask: string
  };

  caseIdMaskValidator: Observable<boolean | IGeneralAsyncValidatorResponse>;

  // authenticated user details
  authUser: UserModel;

  // constants
  UserModel = UserModel;
  EntityType = EntityType;

  // check for contact existence
  personDuplicates: (ContactModel | CaseModel)[] = [];
  checkingForContactDuplicate: boolean = false;
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
              this.caseData.firstName &&
                !this.caseData.lastName &&
                !this.caseData.middleName
            ) || (
        this.caseData.lastName &&
                !this.caseData.firstName &&
                !this.caseData.middleName
      ) || (
        this.caseData.middleName &&
                !this.caseData.firstName &&
                !this.caseData.lastName
      )
    ) {
      // reset
      this.personDuplicates = [];
      this.checkingForContactDuplicate = false;
      this._previousChecked.firstName = this.caseData.firstName;
      this._previousChecked.lastName = this.caseData.lastName;
      this._previousChecked.middleName = this.caseData.middleName;

      // nothing to do
      return;
    }

    // same as before ?
    if (
      this._previousChecked.firstName === this.caseData.firstName &&
            this._previousChecked.lastName === this.caseData.lastName &&
            this._previousChecked.middleName === this.caseData.middleName
    ) {
      // nothing to do
      return;
    }

    // must check if there is a contact with the same name
    this._previousChecked.firstName = this.caseData.firstName;
    this._previousChecked.lastName = this.caseData.lastName;
    this._previousChecked.middleName = this.caseData.middleName;
    this.checkingForContactDuplicate = true;
    forkJoin([
      this.contactDataService
        .findDuplicates(
          this.selectedOutbreak.id,
          this._previousChecked
        ),
      this.caseDataService
        .findDuplicates(
          this.selectedOutbreak.id,
          this._previousChecked
        )
    ]).subscribe((
      [foundContacts, foundCases]: [
        EntityDuplicatesModel,
        EntityDuplicatesModel
      ]
    ) => {
      // finished
      this.checkingForContactDuplicate = false;

      // did we find anything ?
      this.personDuplicates = [
        ...(foundContacts ?
          foundContacts.duplicates.map((item) => item.model as ContactModel) :
          []
        ),
        ...(foundCases ?
          foundCases.duplicates.map((item) => item.model as CaseModel) :
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
    private caseDataService: CaseDataService,
    private outbreakDataService: OutbreakDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private toastV2Service: ToastV2Service,
    private formHelper: FormHelperService,
    private dialogService: DialogService,
    private i18nService: I18nService,
    private redirectService: RedirectService,
    private authDataService: AuthDataService,
    private entityDataService: EntityDataService,
    private systemSettingsDataService: SystemSettingsDataService,
    private userDataService: UserDataService,
    private contactDataService: ContactDataService
  ) {
    super();
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

    // get users only if we're allowed to
    if (UserModel.canList(this.authUser)) {
      this.userList$ = this.userDataService.getUsersListSorted().pipe(share());
    }

    this.route.queryParams
      .subscribe((params: { uid }) => {
        if (params.uid) {
          this.caseUID = params.uid;

          // initialize breadcrumbs
          this.initializeBreadcrumbs();
        }
      });

    // initialize breadcrumbs
    this.initializeBreadcrumbs();

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
        this.caseIdMaskValidator = new Observable((observer) => {
          // construct cache key
          const cacheKey: string = 'CCA_' + this.selectedOutbreak.id +
                        this.visualIDTranslateData.mask +
                        this.caseData.visualId;

          // get data from cache or execute validator
          TimerCache.run(
            cacheKey,
            this.caseDataService.checkCaseVisualIDValidity(
              this.selectedOutbreak.id,
              this.visualIDTranslateData.mask,
              this.caseData.visualId
            )
          ).subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
            observer.next(isValid);
            observer.complete();
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
    // reset
    this.breadcrumbs = [];

    // case list page
    if (CaseModel.canList(this.authUser)) {
      this.breadcrumbs.push(
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
      );
    }

    // current page breadcrumb
    if (this.caseUID) {
      this.breadcrumbs.push(
        new BreadcrumbItemModel('LNG_PAGE_CREATE_CASE_WITH_UID_TITLE', '.', true, {}, {uid: this.caseUID})
      );
    } else {
      this.breadcrumbs.push(
        new BreadcrumbItemModel('LNG_PAGE_CREATE_CASE_TITLE', '.', true)
      );
    }
  }

  /**
     * Create new Case
     * @param stepForms
     */
  createNewCase(stepForms: NgForm[]) {
    // get forms fields
    const dirtyFields: any = this.formHelper.mergeFields(stepForms);

    // add age & dob information
    if (dirtyFields.ageDob) {
      dirtyFields.age = dirtyFields.ageDob.age;
      dirtyFields.dob = dirtyFields.ageDob.dob;
      delete dirtyFields.ageDob;
    }

    // validate
    if (
      !this.formHelper.isFormsSetValid(stepForms) ||
            _.isEmpty(dirtyFields)
    ) {
      return;
    }

    // add case UID
    if (this.caseUID) {
      dirtyFields.id = this.caseUID;
    }

    // items marked as not duplicates
    let itemsMarkedAsNotDuplicates: string[] = [];

    // add the new Case
    const loadingDialog = this.dialogService.showLoadingDialog();
    const runCreateCase = () => {
      this.caseDataService
        .createCase(
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
        .subscribe((newCase: CaseModel) => {
          // called when we finished creating case
          const finishedCreatingCase = () => {
            this.toastV2Service.success('LNG_PAGE_CREATE_CASE_ACTION_CREATE_CASE_SUCCESS_MESSAGE');

            // hide dialog
            loadingDialog.close();

            // navigate to proper page
            // method handles disableDirtyConfirm too...
            this.redirectToProperPageAfterCreate(
              this.router,
              this.redirectService,
              this.authUser,
              CaseModel,
              'cases',
              newCase.id
            );
          };

          // there are no records marked as NOT duplicates ?
          if (
            !itemsMarkedAsNotDuplicates ||
                        itemsMarkedAsNotDuplicates.length < 1
          ) {
            finishedCreatingCase();
          } else {
            // mark records as not duplicates
            this.entityDataService
              .markPersonAsOrNotADuplicate(
                this.selectedOutbreak.id,
                EntityType.CASE,
                newCase.id,
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
                finishedCreatingCase();
              });
          }
        });
    };

    // check if we need to determine duplicates
    this.systemSettingsDataService
      .getAPIVersion()
      .subscribe((versionData: SystemSettingsVersionModel) => {
        // no duplicates - proceed to create case ?
        if (versionData.duplicate.disableCaseDuplicateCheck) {
          // no need to check for duplicates
          runCreateCase();

          // finished
          return;
        }

        // check for duplicates
        this.caseDataService
          .findDuplicates(
            this.selectedOutbreak.id,
            dirtyFields
          )
          .pipe(
            catchError((err) => {
              if (_.includes(_.get(err, 'details.codes.id'), 'uniqueness')) {
                this.toastV2Service.error('LNG_PAGE_CREATE_CASE_ERROR_UNIQUE_ID');
              } else {
                this.toastV2Service.error(err);
              }

              // hide dialog
              loadingDialog.close();

              return throwError(err);
            })
          )
          .subscribe((caseDuplicates: EntityDuplicatesModel) => {
            // do we have duplicates ?
            if (caseDuplicates.duplicates.length > 0) {
              // construct list of items from which we can choose actions
              const fieldsList: DialogField[] = [];
              const fieldsListLayout: number[] = [];
              caseDuplicates.duplicates.forEach((duplicate: EntityModel, index: number) => {
                // case model
                const caseData: CaseModel = duplicate.model as CaseModel;

                // add row fields
                fieldsListLayout.push(60, 40);
                fieldsList.push(
                  new DialogField({
                    name: `actions[${caseData.id}].label`,
                    placeholder: (index + 1) + '. ' + EntityModel.getNameWithDOBAge(
                      caseData,
                      this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
                      this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
                    ),
                    fieldType: DialogFieldType.LINK,
                    routerLink: ['/cases', caseData.id, 'view'],
                    linkTarget: '_blank'
                  }),
                  new DialogField({
                    name: `actions[${caseData.id}].action`,
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
                  message: 'LNG_PAGE_CREATE_CASE_DUPLICATES_DIALOG_CONFIRM_MSG',
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

                    // create case
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
      });
  }

  /**
     * Check if a contact exists with the same name
     */
  checkForPersonExistence(): void {
    // wait a bit before checking
    this._checkForDuplicate.call();
  }
}

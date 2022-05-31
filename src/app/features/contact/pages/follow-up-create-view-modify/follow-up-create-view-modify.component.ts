import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TranslateService } from '@ngx-translate/core';
import {
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab,
  ICreateViewModifyV2TabTable
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { Constants } from '../../../../core/models/constants';
import { moment } from '../../../../core/helperClasses/x-moment';
import { EntityType } from '../../../../core/models/entity-type';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel } from '../../../../core/models/user.model';
import { V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { takeUntil } from 'rxjs/operators';

/**
 * Component
 */
@Component({
  selector: 'app-follow-up-create-view-modify',
  templateUrl: './follow-up-create-view-modify.component.html'
})
export class FollowUpCreateViewModifyComponent extends CreateViewModifyComponent<FollowUpModel> implements OnDestroy {
  // entity
  private _entityData: ContactModel | CaseModel;

  /**
   * Constructor
   */
  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected translateService: TranslateService,
    protected toastV2Service: ToastV2Service,
    protected dialogV2Service: DialogV2Service,
    protected followUpsDataService: FollowUpsDataService,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    // parent
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService
    );

    // retrieve data
    this._entityData = activatedRoute.snapshot.data.entityData;
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): FollowUpModel {
    return new FollowUpModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: FollowUpModel): Observable<FollowUpModel> {
    return this.followUpsDataService
      .getFollowUp(
        this.selectedOutbreak.id,
        record ?
          record.id :
          this.activatedRoute.snapshot.params.followUpId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_FOLLOW_UP_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_FOLLOW_UP_TITLE';
      this.pageTitleData = {
        dateFormatted: moment(this.itemData.date).format('YYYY-MM-DD')
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_FOLLOW_UP_TITLE';
      this.pageTitleData = {
        dateFormatted: moment(this.itemData.date).format('YYYY-MM-DD')
      };
    }
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs() {
    // reset breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }
    ];

    // display proper breadcrumbs
    if (this._entityData?.type === EntityType.CONTACT) {
      // parent list page
      if (ContactModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
          action: {
            link: ['/contacts']
          }
        });
      }

      // view page
      if (ContactModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this._entityData.name,
          action: {
            link: ['/contacts', this._entityData.id, 'view']
          }
        });
      }

      // list page
      if (FollowUpModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_FOLLOW_UPS_TITLE',
          action: {
            link: ['/contacts', 'contact-related-follow-ups', this._entityData.id]
          }
        });
      }
    } else if (this._entityData?.type === EntityType.CASE) {
      // parent list page
      if (CaseModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CASES_TITLE',
          action: {
            link: ['/cases']
          }
        });
      }

      // view page
      if (CaseModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this._entityData.name,
          action: {
            link: ['/cases', this._entityData.id, 'view']
          }
        });
      }

      // list page
      if (FollowUpModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_FOLLOW_UPS_TITLE',
          action: {
            link: ['/contacts', 'case-follow-ups', this._entityData.id]
          }
        });
      }
    } else {
      // list page
      if (FollowUpModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_FOLLOW_UPS_TITLE',
          action: {
            link: ['/contacts', 'follow-ups']
          }
        });
      }
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_FOLLOW_UP_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_FOLLOW_UP_TITLE', {
            dateFormatted: moment(this.itemData.date).format('YYYY-MM-DD')
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_FOLLOW_UP_TITLE', {
            dateFormatted: moment(this.itemData.date).format('YYYY-MM-DD')
          }
        ),
        action: null
      });
    }
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsPersonal(),

        // Questionnaires
        this.initializeTabsQuestionnaire()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_FOLLOW_UP_ACTION_CREATE_FOLLOW_UP_BUTTON'),
          message: () => this.translateService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL', {
              name: moment(this.itemData.date).format('YYYY-MM-DD')
            }
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (data: FollowUpModel) => {
        // redirect to view
        this.router.navigate([
          '/contacts',
          `${this._entityData.id}`,
          'follow-ups',
          data.id,
          'view'
        ]);
      }
    };
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: this.isCreate ?
        'LNG_PAGE_CREATE_FOLLOW_UP_TAB_DETAILS_TITLE' :
        'LNG_PAGE_MODIFY_FOLLOW_UP_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_COMMON_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'date',
              placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
              description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_DATE_DESCRIPTION',
              value: {
                get: () => this.itemData.date,
                set: (value) => {
                  this.itemData.date = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'targeted',
              placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
              description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED_DESCRIPTION',
              value: {
                get: () => this.itemData.targeted,
                set: (value) => {
                  this.itemData.targeted = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'statusId',
              placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
              description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.statusId,
                set: (value) => {
                  this.itemData.statusId = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'responsibleUserId',
              placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
              value: {
                get: () => this.itemData.responsibleUserId,
                set: (value) => {
                  this.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canList(this.authUser),
                html: this.translateService.instant('LNG_PAGE_MODIFY_FOLLOW_UP_CANT_SET_RESPONSIBLE_ID_TITLE')
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'teamId',
              placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
              description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<UserModel>).options,
              value: {
                get: () => this.itemData.teamId,
                set: (value) => {
                  this.itemData.teamId = value;
                }
              }
            }
          ]
        },

        // Address
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_MODIFY_FOLLOW_UP_TAB_DETAILS_LABEL_ADDRESS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.ADDRESS,
            typeOptions: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            name: 'address',
            value: {
              get: () => this.isCreate ?
                this._entityData.mainAddress :
                this.itemData.address
            }
          }]
        }
      ]
    };
  }

  /**
   * Initialize tabs - Questionnaire
   */
  private initializeTabsQuestionnaire(): ICreateViewModifyV2TabTable {
    let errors: string = '';
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      label: 'LNG_PAGE_MODIFY_FOLLOW_UP_TAB_QUESTIONNAIRE_TITLE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_FILL_QUESTIONNAIRE,
        name: 'questionnaireAnswers',
        questionnaire: this.selectedOutbreak.contactFollowUpTemplate,
        value: {
          get: () => this.itemData.questionnaireAnswers,
          set: (value) => {
            this.itemData.questionnaireAnswers = value;
          }
        },
        updateErrors: (errorsHTML) => {
          errors = errorsHTML;
        }
      },
      invalidHTMLSuffix: () => {
        return errors;
      },
      visible: () => this.selectedOutbreak.contactFollowUpTemplate?.length > 0
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/contacts', `${this._entityData.id}`, 'follow-ups', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/contacts', `${this._entityData.id}`, 'follow-ups', this.itemData?.id, 'modify']
        },
        visible: () => FollowUpModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/contacts', 'follow-ups']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/contacts', 'follow-ups']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/contacts', 'follow-ups']
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_FOLLOW_UP_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  'LNG_PAGE_MODIFY_FOLLOW_UP_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user,
                  this.isCreate ?
                    undefined :
                    [
                      {
                        type: V2SideDialogConfigInputType.DIVIDER,
                        placeholder: 'LNG_FOLLOW_UP_FIELD_LABEL_FILL_LOCATION'
                      }, {
                        type: V2SideDialogConfigInputType.KEY_VALUE,
                        name: 'lat',
                        placeholder: 'LNG_FILL_LOCATION_FIELD_LABEL_GEO_LOCATION_LAT',
                        value: this.itemData.fillLocation?.geoLocation?.lat ?
                          this.itemData.fillLocation.geoLocation.lat.toString() :
                          '—'
                      }, {
                        type: V2SideDialogConfigInputType.KEY_VALUE,
                        name: 'lng',
                        placeholder: 'LNG_FILL_LOCATION_FIELD_LABEL_GEO_LOCATION_LNG',
                        value: this.itemData.fillLocation?.geoLocation?.lng ?
                          this.itemData.fillLocation.geoLocation.lng.toString() :
                          '—'
                      }
                    ]
                );
              }
            },
            visible: () => !this.isCreate
          }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      _type,
      _data,
      _finished,
      _loading,
      _forms
    ) => {
      // #TODO
      // // items marked as not duplicates
      // let itemsMarkedAsNotDuplicates: string[];
      //
      // // create / update
      // const runCreateOrUpdate = (overwriteFinished: (item: ContactModel) => void) => {
      //   // on create we have relationship data too
      //   let relationship;
      //   if (type === CreateViewModifyV2ActionType.CREATE) {
      //     // cleanup
      //     relationship = data.relationship;
      //     delete data.relationship;
      //
      //     // add related entity
      //     relationship.persons = [{
      //       id: this._entityId
      //     }];
      //   }
      //
      //   // create / update
      //   (type === CreateViewModifyV2ActionType.CREATE ?
      //       this.contactDataService
      //         .createContact(
      //           this.selectedOutbreak.id,
      //           data
      //         ) :
      //       this.contactDataService
      //         .modifyContact(
      //           this.selectedOutbreak.id,
      //           this.itemData.id,
      //           data
      //         )
      //   ).pipe(
      //     // create relationship if create
      //     switchMap((contact: ContactModel) => {
      //       // nothing to do ?
      //       if (type !== CreateViewModifyV2ActionType.CREATE) {
      //         return of(contact);
      //       }
      //
      //       // create relationship
      //       return this.relationshipDataService
      //         .createRelationship(
      //           this.selectedOutbreak.id,
      //           EntityType.CONTACT,
      //           contact.id,
      //           relationship
      //         )
      //         .pipe(map(() => contact));
      //     }),
      //
      //     // handle error
      //     catchError((err) => {
      //       // show error
      //       finished(err, undefined);
      //
      //       // finished
      //       return throwError(err);
      //     }),
      //
      //     // should be the last pipe
      //     takeUntil(this.destroyed$)
      //   ).subscribe((item: ContactModel) => {
      //     // finished
      //     const finishedProcessingData = () => {
      //       // success creating / updating
      //       this.toastV2Service.success(
      //         type === CreateViewModifyV2ActionType.CREATE ?
      //           'LNG_PAGE_CREATE_CONTACT_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE' :
      //           'LNG_PAGE_MODIFY_CONTACT_ACTION_MODIFY_CONTACT_SUCCESS_MESSAGE'
      //       );
      //
      //       // finished with success
      //       if (!overwriteFinished) {
      //         finished(undefined, item);
      //       } else {
      //         // mark pristine
      //         forms.markFormsAsPristine();
      //
      //         // hide loading
      //         loading.hide();
      //
      //         // call overwrite
      //         overwriteFinished(item);
      //       }
      //     };
      //
      //     // there are no records marked as NOT duplicates ?
      //     if (
      //       !itemsMarkedAsNotDuplicates ||
      //       itemsMarkedAsNotDuplicates.length < 1
      //     ) {
      //       finishedProcessingData();
      //     } else {
      //       // mark records as not duplicates
      //       this.entityDataService
      //         .markPersonAsOrNotADuplicate(
      //           this.selectedOutbreak.id,
      //           EntityType.CONTACT,
      //           item.id,
      //           itemsMarkedAsNotDuplicates
      //         )
      //         .pipe(
      //           // handle error
      //           catchError((err) => {
      //             // show error
      //             finished(err, undefined);
      //
      //             // send error further
      //             return throwError(err);
      //           }),
      //
      //           // should be the last pipe
      //           takeUntil(this.destroyed$)
      //         )
      //         .subscribe(() => {
      //           // finished
      //           finishedProcessingData();
      //         });
      //     }
      //   });
      // };
      //
      // // check if we need to determine duplicates
      // this.systemSettingsDataService
      //   .getAPIVersion()
      //   .pipe(
      //     // handle error
      //     catchError((err) => {
      //       // show error
      //       finished(err, undefined);
      //
      //       // send down
      //       return throwError(err);
      //     }),
      //
      //     // should be the last pipe
      //     takeUntil(this.destroyed$)
      //   )
      //   .subscribe((versionData) => {
      //     // no duplicates - proceed to create ?
      //     if (
      //       (
      //         type === CreateViewModifyV2ActionType.CREATE &&
      //         versionData.duplicate.disableContactDuplicateCheck
      //       ) || (
      //         type === CreateViewModifyV2ActionType.UPDATE && (
      //           versionData.duplicate.disableContactDuplicateCheck || (
      //             versionData.duplicate.executeCheckOnlyOnDuplicateDataChange &&
      //             !EntityModel.duplicateDataHasChanged(data)
      //           )
      //         )
      //       )
      //     ) {
      //       // no need to check for duplicates
      //       return runCreateOrUpdate(undefined);
      //     }
      //
      //     // check for duplicates
      //     this.contactDataService
      //       .findDuplicates(
      //         this.selectedOutbreak.id,
      //         this.isCreate ?
      //           data : {
      //             ...this.itemData,
      //             ...data
      //           }
      //       )
      //       .pipe(
      //         catchError((err) => {
      //           // specific error
      //           if (_.includes(_.get(err, 'details.codes.id'), 'uniqueness')) {
      //             finished('LNG_PAGE_CREATE_CASE_ERROR_UNIQUE_ID', undefined);
      //           } else {
      //             finished(err, undefined);
      //           }
      //
      //           // send down
      //           return throwError(err);
      //         }),
      //
      //         // should be the last pipe
      //         takeUntil(this.destroyed$)
      //       )
      //       .subscribe((response) => {
      //         // no duplicates ?
      //         if (response.duplicates.length < 1) {
      //           // create
      //           return runCreateOrUpdate(undefined);
      //         }
      //
      //         // hide loading since this will be handled further by the side dialog
      //         loading.hide();
      //
      //         // hide notification
      //         // - hide alert
      //         this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_CASE_CONTACT);
      //
      //         // construct list of actions
      //         const itemsToManage: IV2SideDialogConfigInputLinkWithAction[] = response.duplicates.map((item, index) => {
      //           return {
      //             type: V2SideDialogConfigInputType.LINK_WITH_ACTION,
      //             name: `actionsLink[${item.model.id}]`,
      //             placeholder: (index + 1) + '. ' + EntityModel.getNameWithDOBAge(
      //               item.model as ContactModel,
      //               this.translateService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
      //               this.translateService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
      //             ),
      //             link: () => ['/contacts', item.model.id, 'view'],
      //             actions: {
      //               type: V2SideDialogConfigInputType.TOGGLE,
      //               name: `actionsAction[${item.model.id}]`,
      //               value: Constants.DUPLICATE_ACTION.NO_ACTION,
      //               data: item.model.id,
      //               options: [
      //                 {
      //                   label: Constants.DUPLICATE_ACTION.NO_ACTION,
      //                   value: Constants.DUPLICATE_ACTION.NO_ACTION
      //                 },
      //                 {
      //                   label: Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE,
      //                   value: Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE
      //                 },
      //                 {
      //                   label: Constants.DUPLICATE_ACTION.MERGE,
      //                   value: Constants.DUPLICATE_ACTION.MERGE
      //                 }
      //               ]
      //             }
      //           };
      //         });
      //
      //         // construct & display duplicates dialog
      //         this.dialogV2Service
      //           .showSideDialog({
      //             title: {
      //               get: () => 'LNG_COMMON_LABEL_HAS_DUPLICATES_TITLE'
      //             },
      //             hideInputFilter: true,
      //             dontCloseOnBackdrop: true,
      //             width: '55rem',
      //             inputs: [
      //               // Title
      //               {
      //                 type: V2SideDialogConfigInputType.DIVIDER,
      //                 placeholder: this.isCreate ?
      //                   'LNG_PAGE_CREATE_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG' :
      //                   'LNG_PAGE_MODIFY_CONTACT_DUPLICATES_DIALOG_CONFIRM_MSG',
      //                 placeholderMultipleLines: true
      //               },
      //
      //               // Actions
      //               ...itemsToManage
      //             ],
      //             bottomButtons: [{
      //               type: IV2SideDialogConfigButtonType.OTHER,
      //               label: 'LNG_COMMON_BUTTON_SAVE',
      //               color: 'primary'
      //             }, {
      //               type: IV2SideDialogConfigButtonType.CANCEL,
      //               label: 'LNG_COMMON_BUTTON_CANCEL',
      //               color: 'text'
      //             }]
      //           })
      //           .subscribe((dialogResponse) => {
      //             // cancelled ?
      //             if (dialogResponse.button.type === IV2SideDialogConfigButtonType.CANCEL) {
      //               // show back duplicates alert
      //               this.showDuplicatesAlert();
      //
      //               // finished
      //               return;
      //             }
      //
      //             // determine number of items to merge / mark as not duplicates
      //             const itemsToMerge: string[] = [];
      //             itemsMarkedAsNotDuplicates = [];
      //
      //             // go through items to manage
      //             dialogResponse.data.inputs.forEach((item) => {
      //               // not important ?
      //               if (item.type !== V2SideDialogConfigInputType.LINK_WITH_ACTION) {
      //                 return;
      //               }
      //
      //               // take action
      //               switch (item.actions.value) {
      //                 case Constants.DUPLICATE_ACTION.NOT_A_DUPLICATE:
      //                   itemsMarkedAsNotDuplicates.push(item.actions.data);
      //                   break;
      //                 case Constants.DUPLICATE_ACTION.MERGE:
      //                   itemsToMerge.push(item.actions.data);
      //                   break;
      //               }
      //             });
      //
      //             // hide dialog
      //             dialogResponse.handler.hide();
      //
      //             // show back loading
      //             loading.show();
      //
      //             // save data first, followed by redirecting to merge
      //             if (itemsToMerge.length > 0) {
      //               runCreateOrUpdate((item) => {
      //                 // construct list of ids
      //                 const mergeIds: string[] = [
      //                   item.id,
      //                   ...itemsToMerge
      //                 ];
      //
      //                 // redirect to merge
      //                 this.router.navigate(
      //                   ['/duplicated-records', EntityModel.getLinkForEntityType(EntityType.CONTACT), 'merge'], {
      //                     queryParams: {
      //                       ids: JSON.stringify(mergeIds)
      //                     }
      //                   }
      //                 );
      //               });
      //             } else {
      //               runCreateOrUpdate(undefined);
      //             }
      //           });
      //       });
      //   });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      get: (item: FollowUpModel) => moment(item.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT),
      link: (item: FollowUpModel) => ['/contacts', `${this._entityData.id}`, 'follow-ups', item.id, 'view']
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'date'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    // #TODO
    // this.expandListAdvancedFilters = FollowUpModel.generateAdvancedFilters({
    //   authUser: this.authUser,
    //   contactInvestigationTemplate: () => this.selectedOutbreak.contactInvestigationTemplate,
    //   contactFollowUpTemplate: () => this.selectedOutbreak.contactFollowUpTemplate,
    //   caseInvestigationTemplate: () => this.selectedOutbreak.caseInvestigationTemplate,
    //   options: {
    //     occupation: (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     followUpStatus: (this.activatedRoute.snapshot.data.followUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     pregnancyStatus: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     vaccine: (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     vaccineStatus: (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
    //     team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
    //     user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
    //     dailyFollowUpStatus: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
    //     gender: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
    //   }
    // });
  }

  /**
   * Refresh expand list
   */
  refreshExpandList(data): void {
    // append / remove search
    // if (data.searchBy) {
    //   NOTHING TO SEARCH BY
    // }

    // retrieve data
    this.expandListRecords$ = this.followUpsDataService
      .getFollowUpsList(
        this.selectedOutbreak.id,
        data.queryBuilder
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}

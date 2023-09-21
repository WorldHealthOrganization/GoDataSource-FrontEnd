import { OutbreakModel } from '../../../models/outbreak.model';
import { PersonAndRelatedHelperService } from '../person-and-related-helper.service';
import { FollowUpModel } from '../../../models/follow-up.model';
import { ContactOfContactModel } from '../../../models/contact-of-contact.model';
import { ContactModel } from '../../../models/contact.model';
import { CaseModel } from '../../../models/case.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { Constants } from '../../../models/constants';
import { UserModel } from '../../../models/user.model';
import { IAnswerData, QuestionModel } from '../../../models/question.model';
import { IResolverV2ResponseModel } from '../../resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../models/reference-data.model';
import { IV2ColumnAction, IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { TeamModel } from '../../../models/team.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { EntityType } from '../../../models/entity-type';
import * as moment from 'moment';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { FollowUpsDataService } from '../../data/follow-ups.data.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputSingleDropdown, IV2SideDialogConfigInputToggle, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { AddressModel } from '../../../models/address.model';
import { V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { V2AdvancedFilter, V2AdvancedFilterComparatorOptions, V2AdvancedFilterComparatorType, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { IV2ColumnToVisibleMandatoryConf, V2AdvancedFilterToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../helperClasses/request-query-builder';
import { LocationModel } from '../../../models/location.model';
import { IBasicCount } from '../../../models/basic-count.interface';

export class FollowUpHelperModel {
  // data
  public readonly visibleMandatoryKey: string = 'follow-ups';

  /**
   * Constructor
   */
  constructor(
    private parent: PersonAndRelatedHelperService,
    public followUpsDataService: FollowUpsDataService
  ) {}

  /**
   * Generate tab - Personal
   */
  generateTabsPersonal(
    useToFilterOutbreak: OutbreakModel,
    data: {
      isCreate: boolean,
      isModify: boolean,
      itemData: FollowUpModel,
      entityData: ContactOfContactModel | ContactModel | CaseModel,
      options: {
        dailyFollowUpStatus: ILabelValuePairModel[],
        user: ILabelValuePairModel[],
        team: ILabelValuePairModel[],
        addressType: ILabelValuePairModel[]
      }
    }
  ): ICreateViewModifyV2Tab {
    // create tab
    const tab: ICreateViewModifyV2Tab = this.parent.createViewModify.tabFilter(
      {
        type: CreateViewModifyV2TabInputType.TAB,
        name: 'details',
        label: data.isCreate ?
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
                  get: () => data.itemData.date,
                  set: (value) => {
                    data.itemData.date = value;
                  }
                },
                validators: {
                  required: () => true
                },
                disabled: () => data.isModify,
                visibleMandatoryConf: {
                  visible: true,
                  required: true
                }
              }, {
                type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
                name: 'targeted',
                placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
                description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED_DESCRIPTION',
                value: {
                  get: () => data.itemData.targeted,
                  set: (value) => {
                    data.itemData.targeted = value;
                  }
                }
              }, {
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'statusId',
                placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
                description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID_DESCRIPTION',
                options: data.options.dailyFollowUpStatus,
                value: {
                  get: () => data.itemData.statusId,
                  set: (value) => {
                    data.itemData.statusId = value;
                  }
                },
                validators: {
                  required: () => true
                },
                disabled: () => data.isModify && Constants.isDateInTheFuture(data.itemData.date)
              }, {
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'responsibleUserId',
                placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
                description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
                options: data.options.user,
                value: {
                  get: () => data.itemData.responsibleUserId,
                  set: (value) => {
                    data.itemData.responsibleUserId = value;
                  }
                },
                replace: {
                  condition: () => !UserModel.canListForFilters(this.parent.authUser),
                  html: this.parent.i18nService.instant('LNG_PAGE_MODIFY_FOLLOW_UP_CANT_SET_RESPONSIBLE_ID_TITLE')
                }
              }, {
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'teamId',
                placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
                description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM_DESCRIPTION',
                options: data.options.team,
                value: {
                  get: () => data.itemData.teamId,
                  set: (value) => {
                    data.itemData.teamId = value;
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
              typeOptions: data.options.addressType,
              name: 'address',
              value: {
                get: () => data.isCreate ?
                  data.entityData.mainAddress :
                  data.itemData.address
              }
            }]
          }
        ]
      },
      this.visibleMandatoryKey,
      useToFilterOutbreak
    );

    // finished
    return tab;
  }

  /**
   * Determine alertness
   */
  determineAlertness(
    template: QuestionModel[],
    entities: FollowUpModel[]
  ): FollowUpModel[] {
    // map alert question answers to object for easy find
    const alertQuestionAnswers: {
      [question_variable: string]: {
        [answer_value: string]: true
      }
    } = QuestionModel.determineAlertAnswers(template);

    // map alert value to follow-ups
    entities.forEach((followUpData: FollowUpModel) => {
      // check if we need to mark follow-up as alerted because of questionnaire answers
      followUpData.alerted = false;
      if (followUpData.questionnaireAnswers) {
        const props: string[] = Object.keys(followUpData.questionnaireAnswers);
        for (let propIndex: number = 0; propIndex < props.length; propIndex++) {
          // get answer data
          const questionVariable: string = props[propIndex];
          const answers: IAnswerData[] = followUpData.questionnaireAnswers[questionVariable];

          // retrieve answer value
          // only the newest one is of interest, the old ones shouldn't trigger an alert
          // the first item should be the newest
          const answerKey = answers?.length > 0 ?
            answers[0].value :
            undefined;

          // there is no point in checking the value if there isn't one
          if (
            !answerKey &&
            typeof answerKey !== 'number'
          ) {
            continue;
          }

          // at least one alerted ?
          if (Array.isArray(answerKey)) {
            // go through all answers
            for (let answerKeyIndex: number = 0; answerKeyIndex < answerKey.length; answerKeyIndex++) {
              if (
                alertQuestionAnswers[questionVariable] &&
                alertQuestionAnswers[questionVariable][answerKey[answerKeyIndex]]
              ) {
                // alerted
                followUpData.alerted = true;

                // stop
                break;
              }
            }

            // stop ?
            if (followUpData.alerted) {
              // stop
              break;
            }
          } else if (
            alertQuestionAnswers[questionVariable] &&
            alertQuestionAnswers[questionVariable][answerKey]
          ) {
            // alerted
            followUpData.alerted = true;

            // stop
            break;
          }
        }
      }
    });

    // finished
    return entities;
  }

  /**
   * Retrieve statuses forms
   */
  getStatusForms(
    info: {
      // required
      item: FollowUpModel,
      dailyFollowUpStatus: IResolverV2ResponseModel<ReferenceDataEntryModel>
    }
  ): V2ColumnStatusForm[] {
    // construct list of forms that we need to display
    const forms: V2ColumnStatusForm[] = [];

    // status
    if (
      info.item.statusId &&
      info.dailyFollowUpStatus.map[info.item.statusId]
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.CIRCLE,
        color: info.dailyFollowUpStatus.map[info.item.statusId].getColorCode(),
        tooltip: this.parent.i18nService.instant(info.item.statusId)
      });
    } else {
      forms.push({
        type: IV2ColumnStatusFormType.EMPTY
      });
    }

    // alerted
    if (info.item.alerted) {
      forms.push({
        type: IV2ColumnStatusFormType.STAR,
        color: 'var(--gd-danger)',
        tooltip: this.parent.i18nService.instant('LNG_COMMON_LABEL_STATUSES_ALERTED')
      });
    } else {
      forms.push({
        type: IV2ColumnStatusFormType.EMPTY
      });
    }

    // finished
    return forms;
  }

  /**
   * Retrieve table columns
   */
  retrieveTableColumnActions(definitions: {
    entityData: ContactOfContactModel | ContactModel | CaseModel,
    selectedOutbreak: () => OutbreakModel,
    selectedOutbreakIsActive: () => boolean,
    team: IResolverV2ResponseModel<TeamModel>,
    refreshList: () => void
  }): IV2ColumnAction {
    return {
      format: {
        type: V2ColumnFormat.ACTIONS
      },
      actions: [
        // View Follow-up
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_VIEW_FOLLOW_UP',
          action: {
            link: (item: FollowUpModel): string[] => {
              return [
                '/contacts',
                item.personId,
                'follow-ups',
                item.id,
                definitions.entityData.type === EntityType.CONTACT ?
                  'view' :
                  definitions.entityData.type === EntityType.CASE ?
                    'case-history' :
                    'contactOfContact-history'
              ];
            }
          },
          visible: (item: FollowUpModel): boolean => {
            return !item.deleted &&
              FollowUpModel.canView(this.parent.authUser);
          }
        },

        // Modify Follow-up
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_MODIFY_FOLLOW_UP',
          action: {
            link: (item: FollowUpModel): string[] => {
              return ['/contacts', item.personId, 'follow-ups', item.id, 'modify'];
            }
          },
          visible: (item: FollowUpModel): boolean => {
            return !item.deleted &&
              definitions.entityData.type === EntityType.CONTACT &&
              definitions.selectedOutbreakIsActive() &&
              FollowUpModel.canModify(this.parent.authUser);
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete Follow-up
            {
              label: {
                get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_FOLLOW_UP'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: FollowUpModel): void => {
                  // determine what we need to delete
                  this.parent.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_DELETE',
                        data: () => ({
                          name: item.date ?
                            moment(item.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                            ''
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_FOLLOW_UP',
                        data: () => ({
                          name: item.date ?
                            moment(item.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                            ''
                        })
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.parent.dialogV2Service.showLoadingDialog();

                    // delete follow up
                    this.followUpsDataService
                      .deleteFollowUp(
                        definitions.selectedOutbreak().id,
                        item.personId,
                        item.id
                      )
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.parent.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.parent.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        definitions.refreshList();
                      });
                  });
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                  definitions.entityData.type === EntityType.CONTACT &&
                  definitions.selectedOutbreakIsActive() &&
                  FollowUpModel.canDelete(this.parent.authUser);
              }
            },

            // Restore a deleted Follow-up
            {
              label: {
                get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_FOLLOW_UP'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: FollowUpModel) => {
                  // show confirm dialog to confirm the action
                  this.parent.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_RESTORE',
                        data: () => ({
                          name: item.date ?
                            moment(item.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                            ''
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_RESTORE_FOLLOW_UP',
                        data: () => ({
                          name: item.date ?
                            moment(item.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                            ''
                        })
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.parent.dialogV2Service.showLoadingDialog();

                    // delete follow up
                    this.followUpsDataService
                      .restoreFollowUp(
                        definitions.selectedOutbreak().id,
                        item.personId,
                        item.id
                      )
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.parent.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.parent.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        definitions.refreshList();
                      });
                  });
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return item.deleted &&
                  definitions.entityData.type === EntityType.CONTACT &&
                  definitions.selectedOutbreakIsActive() &&
                  FollowUpModel.canRestore(this.parent.authUser);
              }
            },

            // Divider
            {
              visible: (item: FollowUpModel): boolean => {
                // visible only if at least one of the previous...
                return !item.deleted &&
                  definitions.entityData.type === EntityType.CONTACT &&
                  definitions.selectedOutbreakIsActive() &&
                  FollowUpModel.canModify(this.parent.authUser) &&
                  !Constants.isDateInTheFuture(item.date);
              }
            },

            // Change targeted
            {
              label: {
                get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TARGETED_FORM_BUTTON'
              },
              action: {
                click: (item: FollowUpModel) => {
                  this.parent.dialogV2Service
                    .showSideDialog({
                      // title
                      title: {
                        get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TARGETED_DIALOG_TITLE'
                      },

                      // hide search bar
                      hideInputFilter: true,

                      // inputs
                      inputs: [
                        {
                          type: V2SideDialogConfigInputType.TOGGLE,
                          value: item.targeted ?
                            Constants.FILTER_YES_NO_OPTIONS.YES.value :
                            Constants.FILTER_YES_NO_OPTIONS.NO.value,
                          name: 'targeted',
                          options: [
                            {
                              label: Constants.FILTER_YES_NO_OPTIONS.YES.label,
                              value: Constants.FILTER_YES_NO_OPTIONS.YES.value
                            },
                            {
                              label: Constants.FILTER_YES_NO_OPTIONS.NO.label,
                              value: Constants.FILTER_YES_NO_OPTIONS.NO.value
                            }
                          ]
                        }
                      ],

                      // buttons
                      bottomButtons: [
                        {
                          label: 'LNG_COMMON_BUTTON_UPDATE',
                          type: IV2SideDialogConfigButtonType.OTHER,
                          color: 'primary',
                          key: 'save',
                          disabled: (_data, handler): boolean => {
                            return !handler.form ||
                              handler.form.invalid ||
                              item.targeted === ((handler.data.map.targeted as IV2SideDialogConfigInputToggle).value) as boolean;
                          }
                        }, {
                          type: IV2SideDialogConfigButtonType.CANCEL,
                          label: 'LNG_COMMON_BUTTON_CANCEL',
                          color: 'text'
                        }
                      ]
                    })
                    .subscribe((response) => {
                      // cancelled ?
                      if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                        return;
                      }

                      // change entity targeted
                      this.followUpsDataService
                        .modifyFollowUp(
                          definitions.selectedOutbreak().id,
                          item.personId,
                          item.id,
                          {
                            targeted: (response.handler.data.map.targeted as IV2SideDialogConfigInputToggle).value
                          }
                        )
                        .pipe(
                          catchError((err) => {
                            this.parent.toastV2Service.error(err);
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // update our record too
                          item.targeted = ((response.handler.data.map.targeted as IV2SideDialogConfigInputToggle).value) as boolean;

                          // success message
                          this.parent.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TARGETED_SUCCESS_MESSAGE');

                          // close popup
                          response.handler.hide();

                          // reload data
                          definitions.refreshList();
                        });
                    });
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                  definitions.entityData.type === EntityType.CONTACT &&
                  definitions.selectedOutbreakIsActive() &&
                  FollowUpModel.canModify(this.parent.authUser);
              }
            },

            // Change team
            {
              label: {
                get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TEAM_FORM_BUTTON'
              },
              action: {
                click: (item: FollowUpModel) => {
                  this.parent.dialogV2Service
                    .showSideDialog({
                      // title
                      title: {
                        get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TEAM_DIALOG_TITLE'
                      },

                      // hide search bar
                      hideInputFilter: true,

                      // inputs
                      inputs: [
                        {
                          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
                          name: 'teamId',
                          placeholder: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
                          options: definitions.team.options,
                          value: item.teamId
                        }
                      ],

                      // buttons
                      bottomButtons: [
                        {
                          label: 'LNG_COMMON_BUTTON_UPDATE',
                          type: IV2SideDialogConfigButtonType.OTHER,
                          color: 'primary',
                          key: 'save',
                          disabled: (_data, handler): boolean => {
                            return !handler.form ||
                              handler.form.invalid ||
                              item.teamId === (handler.data.map.teamId as IV2SideDialogConfigInputSingleDropdown).value;
                          }
                        }, {
                          type: IV2SideDialogConfigButtonType.CANCEL,
                          label: 'LNG_COMMON_BUTTON_CANCEL',
                          color: 'text'
                        }
                      ]
                    })
                    .subscribe((response) => {
                      // cancelled ?
                      if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                        return;
                      }

                      // change entity targeted
                      this.followUpsDataService
                        .modifyFollowUp(
                          definitions.selectedOutbreak().id,
                          item.personId,
                          item.id,
                          {
                            teamId: (response.handler.data.map.teamId as IV2SideDialogConfigInputSingleDropdown).value
                          }
                        )
                        .pipe(
                          catchError((err) => {
                            this.parent.toastV2Service.error(err);
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success message
                          this.parent.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TEAM_SUCCESS_MESSAGE');

                          // close popup
                          response.handler.hide();

                          // reload data
                          definitions.refreshList();
                        });
                    });
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                  definitions.entityData.type === EntityType.CONTACT &&
                  definitions.selectedOutbreakIsActive() &&
                  FollowUpModel.canModify(this.parent.authUser);
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Retrieve table columns
   */
  retrieveTableColumns(
    selectedOutbreak: OutbreakModel,
    definitions: {
      team: IResolverV2ResponseModel<TeamModel>,
      user: IResolverV2ResponseModel<UserModel>,
      dailyFollowUpStatus: IResolverV2ResponseModel<ReferenceDataEntryModel>,
      options: {
        yesNoAll: ILabelValuePairModel[]
      }
    }
  ): IV2ColumnToVisibleMandatoryConf[] {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: ''
    });

    // default table columns
    const tableColumns: IV2ColumnToVisibleMandatoryConf[] = [
      {
        field: 'date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'date'
        ),
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'teamId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'teamId'
        ),
        notVisible: true,
        format: {
          type: (item: FollowUpModel) => {
            return item.teamId && definitions.team.map[item.teamId] ?
              definitions.team.map[item.teamId].name :
              '';
          }
        },
        link: (item: FollowUpModel) => {
          return item.teamId &&
          TeamModel.canView(this.parent.authUser) &&
          definitions.team.map[item.teamId] ?
            `/teams/${ item.teamId }/view` :
            undefined;
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.team.options
        }
      },
      {
        field: 'statusId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'statusId'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.dailyFollowUpStatus.options
        }
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        visibleMandatoryIf: () => true,
        format: {
          type: V2ColumnFormat.STATUS
        },
        notResizable: true,
        pinned: true,
        legends: [
          // status
          {
            title: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
            items: definitions.dailyFollowUpStatus.list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.CIRCLE,
                  color: item.getColorCode()
                },
                label: item.id,
                order: item.order
              };
            })
          },

          // alerted
          {
            title: 'LNG_COMMON_LABEL_STATUSES_ALERTED',
            items: [{
              form: {
                type: IV2ColumnStatusFormType.STAR,
                color: 'var(--gd-danger)'
              },
              label: ' ',
              order: undefined
            }]
          }
        ],
        forms: (_column, data: FollowUpModel): V2ColumnStatusForm[] => this.getStatusForms({
          item: data,
          dailyFollowUpStatus: definitions.dailyFollowUpStatus
        })
      },
      {
        field: 'targeted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'targeted'
        ),
        sortable: true,
        format: {
          type: (item: FollowUpModel) => {
            return item && item.id && item.targeted ?
              this.parent.i18nService.instant('LNG_COMMON_LABEL_YES') :
              this.parent.i18nService.instant('LNG_COMMON_LABEL_NO');
          }
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        }
      },
      {
        field: 'index',
        label: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
        visibleMandatoryIf: () => true,
        sortable: true,
        filter: {
          type: V2FilterType.NUMBER_RANGE,
          min: 0
        }
      },
      {
        field: 'location',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_AREA',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.locationId'
        ),
        format: {
          type: 'address.location.name'
        },
        filter: {
          type: V2FilterType.ADDRESS_MULTIPLE_LOCATION,
          address: filterAddressModel,
          field: 'address',
          fieldIsArray: false
        },
        link: (data) => {
          return data.address?.location?.name ?
            `/locations/${ data.address.location.id }/view` :
            undefined;
        }
      },
      {
        field: 'phoneNumber',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_PHONE_NUMBER',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.phoneNumber'
        ),
        sortable: true,
        format: {
          type: 'address.phoneNumber'
        },
        filter: {
          type: V2FilterType.ADDRESS_PHONE_NUMBER,
          address: filterAddressModel,
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.emailAddress',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_EMAIL',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.emailAddress'
        ),
        notVisible: true,
        sortable: true,
        format: {
          type: 'address.emailAddress'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'emailAddress',
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.addressLine1'
        ),
        notVisible: true,
        format: {
          type: 'address.addressLine1'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'addressLine1',
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.city',
        label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.city'
        ),
        notVisible: true,
        sortable: true,
        format: {
          type: 'address.city'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'city',
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.geoLocation.lat',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.geoLocation'
        ),
        notVisible: true,
        format: {
          type: 'address.geoLocation.lat'
        }
      },
      {
        field: 'address.geoLocation.lng',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.geoLocation'
        ),
        notVisible: true,
        format: {
          type: 'address.geoLocation.lng'
        }
      },
      {
        field: 'address.postalCode',
        label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.postalCode'
        ),
        notVisible: true,
        sortable: true,
        format: {
          type: 'address.postalCode'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'postalCode',
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.geoLocationAccurate',
        label: 'LNG_ADDRESS_FIELD_LABEL_MANUAL_COORDINATES',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.geoLocationAccurate'
        ),
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          field: 'address.geoLocationAccurate'
        },
        filter: {
          type: V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION,
          address: filterAddressModel,
          field: 'address',
          fieldIsArray: false,
          options: definitions.options.yesNoAll,
          defaultValue: ''
        }
      },
      {
        field: 'responsibleUserId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'responsibleUserId'
        ),
        notVisible: true,
        format: {
          type: (item) => item.responsibleUserId && definitions.user.map[item.responsibleUserId] ?
            definitions.user.map[item.responsibleUserId].name :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.user.options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canListForFilters(this.parent.authUser);
        },
        link: (data) => {
          return data.responsibleUserId ?
            `/users/${ data.responsibleUserId }/view` :
            undefined;
        }
      },
      {
        field: 'deleted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED',
        visibleMandatoryIf: () => true,
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.DELETED,
          value: false,
          defaultValue: false
        }
      },
      {
        field: 'deletedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED_AT',
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'createdBy',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_BY',
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: (item) => item.createdBy && definitions.user.map[item.createdBy] ?
            definitions.user.map[item.createdBy].name :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.user.options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.parent.authUser);
        },
        link: (data) => {
          return data.createdBy ?
            `/users/${ data.createdBy }/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AT',
        visibleMandatoryIf: () => true,
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'updatedBy',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_BY',
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: (item) => item.updatedBy && definitions.user.map[item.updatedBy] ?
            definitions.user.map[item.updatedBy].name :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.user.options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.parent.authUser);
        },
        link: (data) => {
          return data.updatedBy ?
            `/users/${ data.updatedBy }/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_AT',
        visibleMandatoryIf: () => true,
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      }
    ];

    // finished
    return this.parent.list.filterVisibleMandatoryTableColumns(tableColumns);
  }

  /**
   * Advanced filters
   */
  generateAdvancedFiltersPerson(
    selectedOutbreak: OutbreakModel,
    data: {
      contactFollowUpTemplate: () => QuestionModel[],
      options: {
        team: ILabelValuePairModel[],
        yesNoAll: ILabelValuePairModel[],
        yesNo: ILabelValuePairModel[],
        dailyFollowUpStatus: ILabelValuePairModel[],
        user: ILabelValuePairModel[],
        addressType: ILabelValuePairModel[]
      }
    }
  ): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilterToVisibleMandatoryConf[] = [
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'address',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.typeId'
        ),
        isArray: false
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.emailAddress',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_EMAIL',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.emailAddress'
        ),
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'address.geoLocationAccurate',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.geoLocationAccurate'
        ),
        options: data.options.yesNo,
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'address.typeId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_TYPE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.typeId'
        ),
        options: data.options.addressType,
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'address.date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_DATE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.date'
        ),
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.city',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_CITY',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.city'
        ),
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.postalCode',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_POSTAL_CODE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.postalCode'
        ),
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'address',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_PHONE_NUMBER',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.phoneNumber'
        ),
        isArray: false,
        sortable: 'address.phoneNumber'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'date'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'teamId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'teamId'
        ),
        options: data.options.team,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'targeted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'targeted'
        ),
        options: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'statusId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'statusId'
        ),
        options: data.options.dailyFollowUpStatus,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.NUMBER,
        field: 'weekNumber',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_WEEK_NUMBER',
        visibleMandatoryIf: () => true,
        allowedComparators: [
          _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.NUMBER], { value: V2AdvancedFilterComparatorType.IS })
        ],
        flagIt: true
      },
      {
        type: V2AdvancedFilterType.DATE,
        field: 'timeLastSeen',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TIME_FILTER',
        visibleMandatoryIf: () => true,
        allowedComparators: [
          _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.DATE], { value: V2AdvancedFilterComparatorType.DATE })
        ],
        flagIt: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'index',
        label: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        visibleMandatoryIf: () => data.contactFollowUpTemplate && data.contactFollowUpTemplate()?.length > 0,
        template: data.contactFollowUpTemplate
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED',
        visibleMandatoryIf: () => true,
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(this.parent.authUser)) {
      advancedFilters.push(
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'responsibleUserId',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.visibleMandatoryKey,
            'responsibleUserId'
          ),
          options: data.options.user,
          sortable: true
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'createdBy',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_BY',
          visibleMandatoryIf: () => true,
          options: data.options.user,
          sortable: true
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'updatedBy',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_BY',
          visibleMandatoryIf: () => true,
          options: data.options.user,
          sortable: true
        }
      );
    }

    // finished
    return this.parent.list.filterVisibleMandatoryAdvancedFilters(advancedFilters);
  }

  /**
   * Advanced filters
   */
  generateAdvancedFiltersAggregate(
    selectedOutbreak: OutbreakModel,
    data: {
      options: {
        team: ILabelValuePairModel[],
        yesNoAll: ILabelValuePairModel[],
        yesNo: ILabelValuePairModel[],
        dailyFollowUpStatus: ILabelValuePairModel[],
        user: ILabelValuePairModel[],
        addressType: ILabelValuePairModel[],
        gender: ILabelValuePairModel[],
        risk: ILabelValuePairModel[],
        occupation: ILabelValuePairModel[],
        classification: ILabelValuePairModel[],
        outcome: ILabelValuePairModel[]
      }
    }
  ): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilterToVisibleMandatoryConf[] = [
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'address',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.typeId'
        ),
        isArray: false
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'date'
        )
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'index',
        label: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
        visibleMandatoryIf: () => true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'teamId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'teamId'
        ),
        options: data.options.team
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'targeted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'targeted'
        ),
        options: data.options.yesNo
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'statusId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'statusId'
        ),
        options: data.options.dailyFollowUpStatus
      },
      {
        type: V2AdvancedFilterType.NUMBER,
        field: 'weekNumber',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_WEEK_NUMBER',
        visibleMandatoryIf: () => true,
        allowedComparators: [
          _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.NUMBER], { value: V2AdvancedFilterComparatorType.IS })
        ],
        flagIt: true
      },
      {
        type: V2AdvancedFilterType.DATE,
        field: 'timeLastSeen',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TIME_FILTER',
        visibleMandatoryIf: () => true,
        allowedComparators: [
          _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.DATE], { value: V2AdvancedFilterComparatorType.DATE })
        ],
        flagIt: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        visibleMandatoryIf: () => selectedOutbreak?.contactFollowUpTemplate?.length > 0,
        template: (): QuestionModel[] => selectedOutbreak.contactFollowUpTemplate
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.emailAddress',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_EMAIL',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.emailAddress'
        ),
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'address.geoLocationAccurate',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.geoLocationAccurate'
        ),
        options: data.options.yesNo,
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'address.typeId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_TYPE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.typeId'
        ),
        options: data.options.addressType,
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'address.date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_DATE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.date'
        ),
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.city',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_CITY',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.city'
        ),
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.postalCode',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_POSTAL_CODE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.postalCode'
        ),
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'address',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_PHONE_NUMBER',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address.phoneNumber'
        ),
        isArray: false,
        sortable: 'address.phoneNumber'
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED',
        visibleMandatoryIf: () => true,
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(this.parent.authUser)) {
      advancedFilters.push(
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'responsibleUserId',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.visibleMandatoryKey,
            'responsibleUserId'
          ),
          options: data.options.user,
          sortable: true
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'createdBy',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_BY',
          visibleMandatoryIf: () => true,
          options: data.options.user,
          sortable: true
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'updatedBy',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_BY',
          visibleMandatoryIf: () => true,
          options: data.options.user,
          sortable: true
        }
      );
    }

    // Follow-up person
    advancedFilters.push(
      {
        // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
        type: V2AdvancedFilterType.TEXT,
        field: 'contact.firstName',
        label: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'firstName'
        ),
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT',
        sortable: 'contact.firstName'
      },
      {
        // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
        type: V2AdvancedFilterType.TEXT,
        field: 'contact.lastName',
        label: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'lastName'
        ),
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT',
        sortable: 'contact.lastName'
      },
      {
        // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
        type: V2AdvancedFilterType.ADDRESS,
        field: 'contact.addresses',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'addresses.typeId'
        ),
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT',
        isArray: false,
        allowedComparators: [
          _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.ADDRESS], { value: V2AdvancedFilterComparatorType.CONTAINS }),
          _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.ADDRESS], { value: V2AdvancedFilterComparatorType.LOCATION })
        ]
      },
      {
        // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'contact.gender',
        label: 'LNG_CONTACT_FIELD_LABEL_GENDER',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'gender'
        ),
        options: data.options.gender,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
      },
      {
        // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'contact.riskLevel',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_RISK_LEVEL',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'riskLevel'
        ),
        options: data.options.risk,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
      },
      {
        // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'contact.age',
        label: 'LNG_CONTACT_FIELD_LABEL_AGE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'ageDob'
        ),
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
      },
      {
        // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'contact.dob',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'ageDob'
        ),
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
      },
      {
        // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
        type: V2AdvancedFilterType.TEXT,
        field: 'contact.visualId',
        label: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'visualId'
        ),
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT',
        sortable: 'contact.visualId'
      },
      {
        // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
        type: V2AdvancedFilterType.TEXT,
        field: 'contact.addresses.phoneNumber',
        label: 'LNG_CONTACT_FIELD_LABEL_PHONE_NUMBER',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'addresses.phoneNumber'
        ),
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
      },
      {
        // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'contact.occupation',
        label: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'occupation'
        ),
        options: data.options.occupation,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
      }
    );

    // Contacts exposed to cases that match the criteria bellow
    if (CaseModel.canList(this.parent.authUser)) {
      advancedFilters.push(
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'firstName',
          label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'firstName'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'middleName',
          label: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'middleName'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'lastName',
          label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'lastName'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'gender',
          label: 'LNG_CASE_FIELD_LABEL_GENDER',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'gender'
          ),
          options: data.options.gender,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'addresses.phoneNumber',
          label: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'addresses.phoneNumber'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'riskLevel',
          label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'riskLevel'
          ),
          options: data.options.risk,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'riskReason',
          label: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'riskReason'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'classification',
          label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'classification'
          ),
          options: data.options.classification,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'occupation',
          label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'occupation'
          ),
          options: data.options.occupation,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.RANGE_AGE,
          field: 'age',
          label: 'LNG_CASE_FIELD_LABEL_AGE',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'ageDob'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dob',
          label: 'LNG_CASE_FIELD_LABEL_DOB',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'ageDob'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.TEXT,
          field: 'visualId',
          label: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'visualId'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateOfInfection',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'dateOfInfection'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateOfOnset',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'dateOfOnset'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateOfOutcome',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'dateOfOutcome'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateBecomeCase',
          label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'dateBecomeCase'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'safeBurial',
          label: 'LNG_CASE_FIELD_LABEL_SAFETY_BURIAL',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'safeBurial'
          ),
          options: data.options.yesNo,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'isDateOfOnsetApproximate',
          label: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'isDateOfOnsetApproximate'
          ),
          options: data.options.yesNo,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.RANGE_DATE,
          field: 'dateOfReporting',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'dateOfReporting'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'isDateOfReportingApproximate',
          label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'isDateOfReportingApproximate'
          ),
          options: data.options.yesNo,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'transferRefused',
          label: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'transferRefused'
          ),
          options: data.options.yesNo,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'outcomeId',
          label: 'LNG_CASE_FIELD_LABEL_OUTCOME',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'outcomeId'
          ),
          options: data.options.outcome,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.SELECT,
          field: 'wasContact',
          label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
          visibleMandatoryIf: () => true,
          options: data.options.yesNo,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        },
        {
          type: V2AdvancedFilterType.ADDRESS,
          field: 'addresses',
          label: 'LNG_CASE_FIELD_LABEL_ADDRESSES',
          visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
            selectedOutbreak,
            this.parent.case.visibleMandatoryKey,
            'addresses.typeId'
          ),
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case',
          isArray: false
        },
        {
          type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
          field: 'questionnaireAnswers',
          label: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
          visibleMandatoryIf: () => selectedOutbreak.caseInvestigationTemplate?.length > 0,
          template: (): QuestionModel[] => selectedOutbreak.caseInvestigationTemplate,
          relationshipLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_CASE',
          childQueryBuilderKey: 'case'
        }
      );
    }

    // finished
    return this.parent.list.filterVisibleMandatoryAdvancedFilters(advancedFilters);
  }

  /**
   * Retrieve data
   */
  retrieveRecords(
    outbreak: OutbreakModel,
    queryBuilder: RequestQueryBuilder
  ): Observable<FollowUpModel[]> {
    return this.followUpsDataService
      .getFollowUpsList(
        outbreak.id,
        queryBuilder
      )
      .pipe(
        switchMap((data) => {
          // determine locations that we need to retrieve
          const locationsIdsMap: {
            [locationId: string]: true
          } = {};
          data.forEach((item) => {
            // nothing to add ?
            if (!item.address?.locationId) {
              return;
            }

            // add location to list
            locationsIdsMap[item.address.locationId] = true;
          });

          // determine ids
          const locationIds: string[] = Object.keys(locationsIdsMap);

          // nothing to retrieve ?
          if (locationIds.length < 1) {
            return of(data);
          }

          // construct location query builder
          const qb = new RequestQueryBuilder();
          qb.filter.bySelect(
            'id',
            locationIds,
            false,
            null
          );

          // retrieve locations
          return this.parent.locationDataService
            .getLocationsList(qb)
            .pipe(
              map((locations) => {
                // map locations
                const locationsMap: {
                  [locationId: string]: LocationModel
                } = {};
                locations.forEach((location) => {
                  locationsMap[location.id] = location;
                });

                // set locations
                data.forEach((item) => {
                  item.address.location = item.address.locationId && locationsMap[item.address.locationId] ?
                    locationsMap[item.address.locationId] :
                    item.address.location;
                });

                // finished
                return data;
              })
            );
        })
      )
      .pipe(
        map((followUps: FollowUpModel[]) => {
          return this.determineAlertness(
            outbreak.contactFollowUpTemplate,
            followUps
          );
        })
      );
  }

  /**
   * Retrieve data count
   */
  retrieveRecordsCount(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder
  ): Observable<IBasicCount> {
    return this.followUpsDataService
      .getFollowUpsCount(
        outbreakId,
        queryBuilder
      )
      .pipe(
        catchError((err) => {
          this.parent.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [
      'id',
      'date',
      'teamId',
      'statusId',
      'targeted',
      'index',
      'address',
      'responsibleUser',
      'responsibleUserId',
      'deleted',
      'deletedAt',
      'createdBy',
      'createdByUser',
      'createdAt',
      'updatedBy',
      'updatedByUser',
      'updatedAt',
      'personId',
      'questionnaireAnswers'
    ];
  }

  /**
   * Retrieve follow-up person
   */
  getPerson(
    outbreakId: string,
    qb: RequestQueryBuilder
  ): Observable<ContactModel[] | CaseModel[] | ContactOfContactModel[]> {
    // #TODO - The required refactoring is for the following requests not to be called unnecessarily: contactDataService.getContactsList(), caseDataService.getCasesList() and contactsOfContactsDataService.getContactsOfContactsList()
    return this.parent.contact.contactDataService.getContactsList(
      outbreakId,
      qb
    ).pipe(
      switchMap((data) => {
        // found ?
        if (data?.length > 0) {
          return of(data);
        }

        // check cases
        return this.parent.case.caseDataService.getCasesList(
          outbreakId,
          qb
        );
      }),
      switchMap((data) => {
        // found ?
        if (data?.length > 0) {
          return of(data);
        }

        // check contacts of contacts
        return this.parent.contactOfContact.contactsOfContactsDataService.getContactsOfContactsList(
          outbreakId,
          qb
        );
      })
    );
  }
}

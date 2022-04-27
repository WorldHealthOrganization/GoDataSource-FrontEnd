import { Component, OnDestroy } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserModel } from '../../../../core/models/user.model';
import * as _ from 'lodash';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { AnswerModel, QuestionModel } from '../../../../core/models/question.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IExtendedColDef } from '../../../../shared/components-v2/app-list-table-v2/models/extended-column.model';
import { IV2BreadcrumbAction } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputText, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

@Component({
  selector: 'app-outbreak-list',
  templateUrl: './outbreak-list.component.html'
})
export class OutbreakListComponent extends ListComponent implements OnDestroy {
  // list of existing outbreaks
  outbreaksList$: Observable<OutbreakModel[]>;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private outbreakDataService: OutbreakDataService,
    private userDataService: UserDataService,
    private authDataService: AuthDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service
  ) {
    super(listHelperService);
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Component initialized
   */
  initialized(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns()
  {
    // validate clone outbreak name
    let cloneOutbreakName: string;
    const asyncValidateCloneOutbreakName: Observable<boolean | IGeneralAsyncValidatorResponse> = new Observable((observer) => {
      this.outbreakDataService.checkOutbreakNameUniquenessValidity(cloneOutbreakName)
        .subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
          observer.next(isValid);
          observer.complete();
        });
    });

    // default table columns
    this.tableColumns = [
      {
        field: 'name',
        label: 'LNG_OUTBREAK_FIELD_LABEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'disease',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DISEASE',
        sortable: true,
        notVisible: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'countries.id',
        label: 'LNG_OUTBREAK_FIELD_LABEL_COUNTRIES',
        format: {
          type: (outbreak: OutbreakModel) => {
            return outbreak.countries ?
              outbreak.countries.map((entry) => this.i18nService.instant((this.activatedRoute.snapshot.data.country as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[entry.id].value)).join(' / ') :
              '';
          }
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.country as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'reportingGeographicalLevelId',
        label: 'LNG_OUTBREAK_FIELD_LABEL_LOCATION_GEOGRAPHICAL_LEVEL',
        notVisible: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.geographicalLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'startDate',
        label: 'LNG_OUTBREAK_FIELD_LABEL_START_DATE',
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'endDate',
        label: 'LNG_OUTBREAK_FIELD_LABEL_END_DATE',
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'active',
        label: 'LNG_OUTBREAK_FIELD_LABEL_ACTIVE',
        sortable: true,
        format: {
          type: (column: OutbreakModel) => {
            return column &&
              column.id &&
              this.selectedOutbreak.id &&
              column.id === this.authUser.activeOutbreakId ?
              this.i18nService.instant('LNG_COMMON_LABEL_YES') :
              this.i18nService.instant('LNG_COMMON_LABEL_NO');
          }
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: '',
          search: (column: IExtendedColDef) => {
            // remove filter
            this.queryBuilder.filter.remove('id');

            // check if value is boolean. If not, remove filter
            if (_.isBoolean(column.columnDefinition.filter.value)) {
              // remove filter on the property to not add more conditions on the same property.
              switch (column.columnDefinition.filter.value) {
                case true : {
                  this.queryBuilder.filter.where({
                    id: {
                      eq: this.authUser.activeOutbreakId ?
                        this.authUser.activeOutbreakId :
                        -1
                    }
                  });
                  break;
                }
                case false : {
                  this.queryBuilder.filter.where({
                    id: {
                      neq: this.authUser.activeOutbreakId
                    }
                  });
                  break;
                }
              }
            }

            // refresh list
            this.needsRefreshList(true);
          }
        }
      },
      {
        field: 'generateFollowUpsTeamAssignmentAlgorithm',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
        notVisible: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.followUpGenerationTeamAssignmentAlgorithm as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'generateFollowUpsOverwriteExisting',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN
        }
      },
      {
        field: 'generateFollowUpsKeepTeamAssignment',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN
        }
      },
      {
        field: 'isContactLabResultsActive',
        label: 'LNG_OUTBREAK_FIELD_LABEL_IS_CONTACT_LAB_RESULTS_ACTIVE',
        sortable: true,
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN
        }
      },
      {
        field: 'isDateOfOnsetRequired',
        label: 'LNG_OUTBREAK_FIELD_LABEL_IS_CASE_DATE_OF_ONSET_REQUIRED',
        sortable: true,
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN
        }
      },
      {
        field: 'generateFollowUpsDateOfLastContact',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT',
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN
        }
      },
      {
        field: 'deleted',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DELETED',
        sortable: true,
        notVisible: true,
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
        field: 'createdBy',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !OutbreakModel.canView(this.authUser);
        },
        link: (data) => {
          return data.createdBy ?
            `/users/${data.createdBy}/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CREATED_AT',
        sortable: true,
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'updatedBy',
        label: 'LNG_OUTBREAK_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !OutbreakModel.canView(this.authUser);
        },
        link: (data) => {
          return data.updatedBy ?
            `/users/${data.updatedBy}/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_OUTBREAK_FIELD_LABEL_UPDATED_AT',
        sortable: true,
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },

      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClass: 'gd-cell-no-focus',
        format: {
          type: V2ColumnFormat.ACTIONS
        },
        actions: [
          // View Outbreak
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_VIEW_OUTBREAK',
            action: {
              link: (item: OutbreakModel): string[] => {
                return ['/outbreaks', item.id, 'view'];
              }
            },
            visible: (item: OutbreakModel): boolean => {
              return !item.deleted && OutbreakModel.canView(this.authUser);
            }
          },

          // Modify Outbreak
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_MODIFY_OUTBREAK',
            action: {
              link: (item: OutbreakModel): string[] => {
                return ['/outbreaks', item.id, 'modify'];
              }
            },
            visible: (item: OutbreakModel): boolean => {
              return (
                !item.deleted &&
                OutbreakModel.canModify(this.authUser)
              );
            }
          },

          // Make Outbreak active
          {
            type: V2ActionType.ICON,
            icon: 'check',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_SET_ACTIVE',
            action: {
              click: (item: OutbreakModel): void => {
                // show confirm dialog
                this.dialogV2Service.showConfirmDialog({
                  config: {
                    title: {
                      get: () => 'LNG_COMMON_LABEL_ACTIVE',
                      data: () => ({
                        name: item.name
                      })
                    },
                    message: {
                      get: () => 'LNG_DIALOG_CONFIRM_MAKE_OUTBREAK_ACTIVE',
                      data: () => ({
                        name: item.name
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
                  const loading = this.dialogV2Service.showLoadingDialog();

                  // modify outbreak
                  this.userDataService
                    .modifyUser(
                      this.authUser.id,
                      {
                        activeOutbreakId: item.id
                      }
                    )
                    .pipe(
                      catchError((err) => {
                        this.toastV2Service.error(err);
                        return throwError(err);
                      })
                    )
                    .subscribe(() => {
                      // reload user data to save the new active outbreak
                      this.authDataService
                        .reloadAndPersistAuthUser()
                        .subscribe((authenticatedUser) => {
                          this.authUser = authenticatedUser.user;
                          this.outbreakDataService.checkActiveSelectedOutbreak();

                          // refresh list of top nav outbreaks
                          TopnavComponent.REFRESH_OUTBREAK_LIST();

                          // success
                          this.toastV2Service.success('LNG_PAGE_LIST_OUTBREAKS_ACTION_SET_ACTIVE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                });
              }
            },
            cssClasses: (item: OutbreakModel): string => {
              return this.authUser &&
                item.id === this.authUser.activeOutbreakId ?
                'gd-list-table-actions-action-icon-active' :
                '';
            },
            disable: (item: OutbreakModel): boolean => {
              return this.authUser &&
                item.id === this.authUser.activeOutbreakId;
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete Outbreak
              {
                label: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_DELETE_OUTBREAK',
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: OutbreakModel): void => {
                    // show confirm dialog
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_DELETE',
                          data: () => ({
                            name: item.name
                          })
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_DELETE_OUTBREAK',
                          data: () => ({
                            name: item.name
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
                      const loading = this.dialogV2Service.showLoadingDialog();

                      // delete outbreak
                      this.outbreakDataService
                        .deleteOutbreak(item.id)
                        .pipe(
                          catchError((err) => {
                            // show error
                            this.toastV2Service.error(err);

                            // hide loading
                            loading.close();

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {

                          // reload user data to get the updated data regarding active outbreak
                          this.authDataService
                            .reloadAndPersistAuthUser()
                            .subscribe((authenticatedUser) => {
                              this.authUser = authenticatedUser.user;

                              // success
                              this.toastV2Service.success('LNG_PAGE_LIST_OUTBREAKS_ACTION_DELETE_SUCCESS_MESSAGE');

                              // hide loading
                              loading.close();

                              // reload data
                              this.needsRefreshList(true);
                            });
                        });
                    });
                  }
                },
                visible: (item: OutbreakModel): boolean => {
                  return !item.deleted &&
                  OutbreakModel.canDelete(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: OutbreakModel): boolean => {
                  // visible only if at least one of the first two items is visible
                  return !item.deleted &&
                    OutbreakModel.canDelete(this.authUser)
                  ;
                }
              },

              // View Outbreak inconsistencies
              {
                label: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_VIEW_INCONSISTENCIES',
                action: {
                  link: (item: OutbreakModel): string[] => {
                    return ['/outbreaks', item.id, 'inconsistencies'];
                  }
                },
                visible: (item: OutbreakModel): boolean => {
                  return !item.deleted &&
                    OutbreakModel.canSeeInconsistencies(this.authUser);
                }
              },

              // View Outbreak case form
              {
                label: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE',
                action: {
                  link: (item: OutbreakModel): string[] => {
                    return ['/outbreaks', item.id, 'case-questionnaire'];
                  }
                },
                visible: (item: OutbreakModel): boolean => {
                  return !item.deleted &&
                    OutbreakModel.canModifyCaseQuestionnaire(this.authUser);
                }
              },

              // View Outbreak contact form
              {
                label: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CONTACT_INVESTIGATION_QUESTIONNAIRE',
                action: {
                  link: (item: OutbreakModel): string[] => {
                    return ['/outbreaks', item.id, 'contact-questionnaire'];
                  }
                },
                visible: (item: OutbreakModel): boolean => {
                  return !item.deleted &&
                    OutbreakModel.canModifyContactQuestionnaire(this.authUser);
                }
              },

              // View Outbreak contact follow-up form
              {
                label: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE',
                action: {
                  link: (item: OutbreakModel): string[] => {
                    return ['/outbreaks', item.id, 'contact-follow-up-questionnaire'];
                  }
                },
                visible: (item: OutbreakModel): boolean => {
                  return !item.deleted &&
                    OutbreakModel.canModifyContactFollowUpQuestionnaire(this.authUser);
                }
              },

              // View Outbreak case lab result form
              {
                label: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE',
                action: {
                  link: (item: OutbreakModel): string[] => {
                    return ['/outbreaks', item.id, 'case-lab-results-questionnaire'];
                  }
                },
                visible: (item: OutbreakModel): boolean => {
                  return !item.deleted &&
                    OutbreakModel.canModifyCaseLabResultQuestionnaire(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: OutbreakModel): boolean => {
                  // visible only if at least one of the first two items is visible
                  return !item.deleted &&
                  (
                    OutbreakModel.canSeeInconsistencies(this.authUser) ||
                    OutbreakModel.canModifyCaseQuestionnaire(this.authUser) ||
                    OutbreakModel.canModifyContactFollowUpQuestionnaire(this.authUser) ||
                    OutbreakModel.canModifyCaseLabResultQuestionnaire(this.authUser)
                  );
                }
              },

              // Clone Outbreak
              {
                label: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CLONE_OUTBREAK',
                action: {
                  click: (item: OutbreakModel): void => {
                    // determine what we need to clone
                    this.dialogV2Service
                      .showSideDialog({
                        title: {
                          get: () => 'LNG_COMMON_BUTTON_CLONE',
                          data: () => ({
                            name: item.name
                          })
                        },
                        hideInputFilter: true,
                        inputs: [{
                          type: V2SideDialogConfigInputType.TEXT,
                          name: 'cloneData',
                          data: item,
                          placeholder: 'LNG_DIALOG_FIELD_PLACEHOLDER_CLONED_OUTBREAK_NAME',
                          value: this.i18nService.instant('LNG_PAGE_LIST_OUTBREAKS_CLONE_NAME', { name: item.name }),
                          validators: {
                            required: () => true,
                            async: (_data, _handler, input: IV2SideDialogConfigInputText) => {
                              cloneOutbreakName = input.value;
                              return asyncValidateCloneOutbreakName;
                            }
                          }
                        }],
                        bottomButtons: [{
                          type: IV2SideDialogConfigButtonType.OTHER,
                          label: 'LNG_COMMON_BUTTON_CLONE',
                          color: 'primary',
                          key: 'apply',
                          disabled: (_data, handler): boolean => {
                            return !handler.form ||
                              handler.form.invalid ||
                              handler.form.pending;
                          }
                        }, {
                          type: IV2SideDialogConfigButtonType.CANCEL,
                          label: 'LNG_COMMON_BUTTON_CANCEL',
                          color: 'text'
                        }],
                        initialized: (handler) => {
                          // display loading
                          handler.loading.show();

                          // get the outbreak to clone
                          this.outbreakDataService
                            .getOutbreak(handler.data.map.cloneData.data.id)
                            .subscribe((outbreak: OutbreakModel) => {
                              handler.data.map.cloneData.data = outbreak;

                              // hide loading
                              handler.loading.hide();
                            });
                        }
                      })
                      .subscribe((response) => {
                        // canceled ?
                        if ( response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                          // finished
                          return;
                        }

                        // show loading
                        const loading =
                          this.dialogV2Service.showLoadingDialog();

                        // translate questionnaire questions
                        const translateQuestionnaire = (questions: QuestionModel[]) => {
                          _.each(questions, (question: QuestionModel) => {
                            // translate question
                            question.text = this.i18nService.instant(question.text);

                            // translate answers & sub questions
                            _.each(question.answers, (answer: AnswerModel) => {
                              // translate answer
                              answer.label = this.i18nService.instant(answer.label);

                              // translate sub-question
                              if (!_.isEmpty(answer.additionalQuestions)) {
                                translateQuestionnaire(answer.additionalQuestions);
                              }
                            });
                          });
                        };

                        const outbreakToClone = response.handler.data.map.cloneData.data;

                        // delete the id from the parent outbreak
                        delete outbreakToClone.id;

                        // set the name for the cloned outbreak
                        outbreakToClone.name = (response.handler.data.inputs[0] as any).value;

                        // translate questionnaire questions - Case Form
                        if (!_.isEmpty(outbreakToClone.caseInvestigationTemplate)) {
                          translateQuestionnaire(outbreakToClone.caseInvestigationTemplate);
                        }

                        // translate questionnaire questions - Contact Form
                        if (!_.isEmpty(outbreakToClone.contactInvestigationTemplate)) {
                          translateQuestionnaire(outbreakToClone.contactInvestigationTemplate);
                        }

                        // translate questionnaire questions - Lab Results Form
                        if (!_.isEmpty(outbreakToClone.labResultsTemplate)) {
                          translateQuestionnaire(outbreakToClone.labResultsTemplate);
                        }

                        // translate questionnaire questions - Contact Follow-up
                        if (!_.isEmpty(outbreakToClone.contactFollowUpTemplate)) {
                          translateQuestionnaire(outbreakToClone.contactFollowUpTemplate);
                        }

                        this.outbreakDataService
                          .createOutbreak(outbreakToClone)
                          .pipe(
                            catchError((err) => {
                              this.toastV2Service.error(err);
                              // hide loading
                              loading.close();
                              return throwError(err);
                            }),
                            switchMap((clonedOutbreak) => {
                              // update language tokens to get the translation of submitted questions and answers
                              return this.i18nService.loadUserLanguage()
                                .pipe(
                                  catchError((err) => {
                                    this.toastV2Service.error(err);
                                    // hide loading
                                    loading.close();
                                    return throwError(err);
                                  }),
                                  map(() => clonedOutbreak)
                                );
                            })
                          )
                          .subscribe((clonedOutbreak) => {

                            this.toastV2Service.success(
                              'LNG_PAGE_LIST_OUTBREAKS_ACTION_CLONE_SUCCESS_MESSAGE'
                            );

                            // hide loading
                            loading.close();

                            // reload data
                            this.needsRefreshList(true);

                            // navigate to modify page of the new outbreak
                            if (OutbreakModel.canModify(this.authUser)) {
                              this.router.navigate([`/outbreaks/${clonedOutbreak.id}/modify`]);
                            } else if (OutbreakModel.canView(this.authUser)) {
                              this.router.navigate([`/outbreaks/${clonedOutbreak.id}/view`]);
                            } else if (OutbreakModel.canList(this.authUser)) {
                              this.router.navigate(['/outbreaks']);
                            } else {
                              // fallback to current page since we already know that we have access to this page
                              // Don't redirect :)
                            }
                          });
                      });
                  }
                },
                visible: (item: OutbreakModel): boolean => {
                  return !item.deleted &&
                    OutbreakModel.canClone(this.authUser);
                }
              },

              // Restore deleted Outbreak
              {
                label: 'LNG_PAGE_LIST_OUTBREAKS_ACTION_RESTORE_OUTBREAK',
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: OutbreakModel) => {
                    // show confirm dialog to confirm the action
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_RESTORE',
                          data: () => item as any
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_RESTORE_OUTBREAK',
                          data: () => item as any
                        }
                      }
                    }).subscribe((response) => {
                      // canceled ?
                      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                        // finished
                        return;
                      }

                      // show loading
                      const loading = this.dialogV2Service.showLoadingDialog();

                      // restore
                      this.outbreakDataService
                        .restoreOutbreak(item.id)
                        .pipe(
                          catchError((err) => {
                            // show error
                            this.toastV2Service.error(err);

                            // hide loading
                            loading.close();

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success
                          this.toastV2Service.success('LNG_PAGE_LIST_OUTBREAKS_RESTORE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (item: OutbreakModel): boolean => {
                  return item.deleted &&
                  OutbreakModel.canRestore(this.authUser);
                }
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    // Outbreak
    this.advancedFilters = OutbreakModel.generateAdvancedFilters({
      options: {
        disease: (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        country: (this.activatedRoute.snapshot.data.country as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        geographicalLevel: (this.activatedRoute.snapshot.data.geographicalLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        followUpGenerationTeamAssignmentAlgorithm: (this.activatedRoute.snapshot.data.followUpGenerationTeamAssignmentAlgorithm as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
      }
    });
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/outbreaks', 'create']
      },
      visible: (): boolean => {
        return OutbreakModel.canCreate(this.authUser);
      }
    };
  }

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    // determine if outbreaks page should be linkable
    const outbreakAction: IV2BreadcrumbAction = null;

    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/version']
        }
      }, {
        label: 'LNG_PAGE_LIST_OUTBREAKS_TITLE',
        action: outbreakAction
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'name',
      'disease',
      'countries',
      'reportingGeographicalLevelId',
      'startDate',
      'endDate',
      'active',
      'generateFollowUpsTeamAssignmentAlgorithm',
      'generateFollowUpsOverwriteExisting',
      'generateFollowUpsKeepTeamAssignment',
      'isContactLabResultsActive',
      'isDateOfOnsetRequired',
      'generateFollowUpsDateOfLastContact',
      'deleted',
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
   * Re(load) the Outbreaks list, based on the applied filter, sort criterias
   */
  refreshList() {
    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

    // retrieve the list of Outbreaks
    this.outbreaksList$ = this.outbreakDataService
      .getOutbreaksList(this.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // add includeDeletedRecords if deleted is enabled
    if (this.queryBuilder.isDeletedEnabled()) {
      countQueryBuilder.filter.includeDeletedRecordsWhereField();
    }

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag('applyHasMoreLimit', true);
    }

    // count
    this.outbreakDataService
      .getOutbreaksCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }
}

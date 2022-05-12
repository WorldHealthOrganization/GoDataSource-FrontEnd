import { Component, OnDestroy } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Params, Router } from '@angular/router';
import * as _ from 'lodash';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { V2FilterType, V2FilterTextType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2SideDialogConfigInputType, IV2SideDialogConfigButtonType, IV2SideDialogConfigInputText } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

@Component({
  selector: 'app-outbreak-templates-list',
  templateUrl: './outbreak-templates-list.component.html'
})
export class OutbreakTemplatesListComponent
  extends ListComponent
  implements OnDestroy {
  // list of existing outbreak templates
  outbreakTemplatesList$: Observable<OutbreakTemplateModel[]>;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService,
    private outbreakTemplateDataService: OutbreakTemplateDataService,
    private i18nService: I18nService,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service
  ) {
    super(listHelperService);
  }

  /**
   * Release resources
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
   * Initialize Table Columns
   */
  protected initializeTableColumns() {
    // validate clone outbreak template name
    let cloneTemplateName: string;
    const asyncValidateCloneOutbreakTemplateName: Observable<boolean | IGeneralAsyncValidatorResponse> = new Observable((observer) => {
      this.outbreakTemplateDataService.checkOutbreakTemplateNameUniquenessValidity(cloneTemplateName)
        .subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
          observer.next(isValid);
          observer.complete();
        });
    });

    // default table columns
    this.tableColumns = [
      {
        field: 'name',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'description',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DESCRIPTION',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'disease',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DISEASE',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'generateFollowUpsTeamAssignmentAlgorithm',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
        notVisible: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.followUpGenerationTeamAssignmentAlgorithm as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'generateFollowUpsOverwriteExisting',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        }
      },
      {
        field: 'generateFollowUpsKeepTeamAssignment',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        }
      },
      {
        field: 'generateFollowUpsDateOfLastContact',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
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
          // View Outbreak template
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_VIEW_OUTBREAK_TEMPLATE',
            action: {
              link: (item: OutbreakTemplateModel): string[] => {
                return ['/outbreak-templates', item.id, 'view'];
              }
            },
            visible: (): boolean => {
              return OutbreakTemplateModel.canView(this.authUser);
            }
          },

          // Modify Outbreak template
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_MODIFY_OUTBREAK_TEMPLATE',
            action: {
              link: (item: OutbreakTemplateModel): string[] => {
                return ['/outbreak-templates', item.id, 'modify'];
              }
            },
            visible: (): boolean => {
              return (
                OutbreakTemplateModel.canModify(this.authUser)
              );
            }
          },

          // Create outbreak from outbreak template
          {
            type: V2ActionType.ICON,
            icon: 'add',
            iconTooltip: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_GENERATE_OUTBREAK',
            action: {
              link: (): string[] => {
                return ['/outbreaks', 'create'];
              },
              linkQueryParams: (item: OutbreakTemplateModel): Params => {
                return {
                  outbreakTemplateId: item.id
                };
              }
            },
            visible: (): boolean => {
              return (
                OutbreakTemplateModel.canGenerateOutbreak(this.authUser)
              );
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete Outbreak template
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_DELETE_OUTBREAK_TEMPLATE'
                },
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: OutbreakTemplateModel): void => {
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
                          get: () => 'LNG_DIALOG_CONFIRM_DELETE_OUTBREAK_TEMPLATE',
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
                      this.outbreakTemplateDataService
                        .deleteOutbreakTemplate(item.id)
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
                              this.toastV2Service.success('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_DELETE_SUCCESS_MESSAGE');

                              // hide loading
                              loading.close();

                              // reload data
                              this.needsRefreshList(true);
                            });
                        });
                    });
                  }
                },
                visible: (): boolean => {
                  return OutbreakTemplateModel.canDelete(this.authUser);
                }
              },

              // Divider
              {
                visible: (): boolean => {
                  // visible only if at least one of the first two items is visible
                  return OutbreakTemplateModel.canDelete(this.authUser);
                }
              },

              // View Outbreak template case form
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE'
                },
                action: {
                  link: (item: OutbreakTemplateModel): string[] => {
                    return ['/outbreak-templates', item.id, 'case-questionnaire'];
                  }
                },
                visible: (): boolean => {
                  return OutbreakTemplateModel.canModifyCaseQuestionnaire(this.authUser);
                }
              },

              // View Outbreak template contact form
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CONTACT_INVESTIGATION_QUESTIONNAIRE'
                },
                action: {
                  link: (item: OutbreakTemplateModel): string[] => {
                    return ['/outbreak-templates', item.id, 'contact-questionnaire'];
                  }
                },
                visible: (): boolean => {
                  return OutbreakTemplateModel.canModifyContactQuestionnaire(this.authUser);
                }
              },

              // View Outbreak template contact follow-up form
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_OUTBREAKS_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE'
                },
                action: {
                  link: (item: OutbreakTemplateModel): string[] => {
                    return ['/outbreak-templates', item.id, 'contact-follow-up-questionnaire'];
                  }
                },
                visible: (): boolean => {
                  return OutbreakTemplateModel.canModifyContactFollowUpQuestionnaire(this.authUser);
                }
              },

              // View Outbreak template case lab result form
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE'
                },
                action: {
                  link: (item: OutbreakTemplateModel): string[] => {
                    return ['/outbreak-templates', item.id, 'case-lab-results-questionnaire'];
                  }
                },
                visible: (): boolean => {
                  return OutbreakTemplateModel.canModifyCaseLabResultQuestionnaire(this.authUser);
                }
              },

              // Divider
              {
                visible: (): boolean => {
                  // visible only if at least one of the first two items is visible
                  return OutbreakTemplateModel.canClone(this.authUser);
                }
              },

              // Clone Template Outbreak
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTIONS_CLONE_OUTBREAK_TEMPLATE'
                },
                action: {
                  click: (item: OutbreakTemplateModel): void => {
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
                          placeholder: 'LNG_DIALOG_FIELD_PLACEHOLDER_CLONED_OUTBREAK_TEMPLATE_NAME',
                          value: this.i18nService.instant('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_CLONE_NAME', { name: item.name }),
                          validators: {
                            required: () => true,
                            async: (_data, _handler, input: IV2SideDialogConfigInputText) => {
                              cloneTemplateName = input.value;
                              return asyncValidateCloneOutbreakTemplateName;
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

                          // get the outbreak template to clone
                          this.outbreakTemplateDataService
                            .getOutbreakTemplate(handler.data.map.cloneData.data.id)
                            .subscribe((outbreak: OutbreakTemplateModel) => {
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
                        const loading = this.dialogV2Service.showLoadingDialog();

                        // get the outbreak template to clone
                        const outbreakTemplateToClone = response.handler.data.map.cloneData.data;

                        // set the name for the cloned outbreak template
                        outbreakTemplateToClone.name = (response.handler.data.inputs[0] as any).value;


                        // create outbreak template clone
                        this.outbreakTemplateDataService
                          .createOutbreakTemplate(outbreakTemplateToClone, outbreakTemplateToClone.id)
                          .pipe(
                            catchError((err) => {
                              this.toastV2Service.error(err);
                              // hide loading
                              loading.close();
                              return throwError(err);
                            }),
                            switchMap((clonedOutbreakTemplate) => {
                              // update language tokens to get the translation of submitted questions and answers
                              return this.i18nService.loadUserLanguage()
                                .pipe(
                                  catchError((err) => {
                                    this.toastV2Service.error(err);
                                    loading.close();
                                    return throwError(err);
                                  }),
                                  map(() => clonedOutbreakTemplate)
                                );
                            })
                          )
                          .subscribe((clonedOutbreakTemplate) => {

                            this.toastV2Service.success(
                              'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CLONE_SUCCESS_MESSAGE'
                            );

                            // hide loading
                            loading.close();

                            // reload data
                            this.needsRefreshList(true);

                            // navigate to modify page of the new outbreak
                            if (OutbreakTemplateModel.canModify(this.authUser)) {
                              this.router.navigate([`/outbreak-templates/${clonedOutbreakTemplate.id}/modify`]);
                            } else if (OutbreakTemplateModel.canView(this.authUser)) {
                              this.router.navigate([`/outbreak-templates/${clonedOutbreakTemplate.id}/view`]);
                            } else if (OutbreakTemplateModel.canList(this.authUser)) {
                              this.router.navigate(['/outbreak-templates']);
                            } else {
                              // fallback to current page since we already know that we have access to this page
                              // Don't redirect :)
                            }
                          });
                      });
                  }
                },
                visible: (): boolean => {
                  return OutbreakTemplateModel.canClone(this.authUser);
                }
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    // Outbreak template
    this.advancedFilters = OutbreakTemplateModel.generateAdvancedFilters({
      options: {
        disease: (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
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
        link: (): string[] => ['/outbreak-templates', 'create']
      },
      visible: (): boolean => {
        return OutbreakTemplateModel.canCreate(this.authUser);
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
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }, {
        label: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_TITLE',
        action: null
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
      'description',
      'disease',
      'generateFollowUpsTeamAssignmentAlgorithm',
      'generateFollowUpsOverwriteExisting',
      'generateFollowUpsKeepTeamAssignment',
      'generateFollowUpsDateOfLastContact'
    ];
  }

  /**
   * Re(load) the Outbreak Templates list
   */
  refreshList() {
    // retrieve the list of outbreak templates
    this.outbreakTemplatesList$ = this.outbreakTemplateDataService
      .getOutbreakTemplatesList(this.queryBuilder)
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

    this.outbreakTemplateDataService
      .getOutbreakTemplatesCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      ).subscribe((response) => {
        this.pageCount = response;
      });
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserSettings } from '../../../../core/models/user.model';
import { Observable } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import { DialogAnswer, DialogAnswerButton, DialogConfiguration, DialogField } from '../../../../shared/components/dialog/dialog.component';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { OutbreakTemplateDataService } from '../../../../core/services/data/outbreak-template.data.service';
import { catchError, map, share, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-outbreak-templates-list',
  templateUrl: './outbreak-templates-list.component.html'
})
export class OutbreakTemplatesListComponent
  extends ListComponent
  implements OnInit, OnDestroy {

  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_TITLE', '.', true)
  // ];

  // constants
  OutbreakTemplateModel = OutbreakTemplateModel;

  outbreakTemplatesList$: Observable<OutbreakTemplateModel[]>;
  outbreakTemplatesListCount$: Observable<IBasicCount>;

  diseasesList$: Observable<any[]>;
  followUpsTeamAssignmentAlgorithm$: Observable<any[]>;
  yesNoOptionsList$: Observable<any[]>;

  // constants
  UserSettings = UserSettings;
  ReferenceDataCategory = ReferenceDataCategory;

  recordActions: HoverRowAction[] = [
    // View Outbreak template
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_VIEW_OUTBREAK_TEMPLATE',
      linkGenerator: (item: OutbreakTemplateModel): string[] => {
        return ['/outbreak-templates', item.id, 'view'];
      },
      visible: (): boolean => {
        return OutbreakTemplateModel.canView(this.authUser);
      }
    }),

    // Modify Outbreak template
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_MODIFY_OUTBREAK_TEMPLATE',
      linkGenerator: (item: OutbreakTemplateModel): string[] => {
        return ['/outbreak-templates', item.id, 'modify'];
      },
      visible: (): boolean => {
        return OutbreakTemplateModel.canModify(this.authUser);
      }
    }),

    // Create outbreak from outbreak template
    new HoverRowAction({
      icon: 'add',
      iconTooltip: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_GENERATE_OUTBREAK',
      click: (item: OutbreakTemplateModel) => {
        this.router.navigate(['/outbreaks', 'create'], {
          queryParams: {
            outbreakTemplateId: item.id
          }
        });
      },
      visible: (): boolean => {
        return OutbreakTemplateModel.canGenerateOutbreak(this.authUser);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Outbreak template
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_DELETE_OUTBREAK_TEMPLATE',
          click: (item: OutbreakTemplateModel) => {
            this.deleteOutbreakTemplate(item);
          },
          visible: (): boolean => {
            return OutbreakTemplateModel.canDelete(this.authUser);
          },
          class: 'mat-menu-item-delete'
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (): boolean => {
            // visible only if at least one of the previous...
            return OutbreakTemplateModel.canDelete(this.authUser);
          }
        }),

        // View Outbreak template case form
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CASE_INVESTIGATION_QUESTIONNAIRE',
          click: (item: OutbreakTemplateModel) => {
            this.router.navigate(['/outbreak-templates', item.id, 'case-questionnaire']);
          },
          visible: (): boolean => {
            return OutbreakTemplateModel.canModifyCaseQuestionnaire(this.authUser);
          }
        }),

        // View Outbreak template contact form
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CONTACT_INVESTIGATION_QUESTIONNAIRE',
          click: (item: OutbreakTemplateModel) => {
            this.router.navigate(['/outbreak-templates', item.id, 'contact-questionnaire']);
          },
          visible: (): boolean => {
            return OutbreakTemplateModel.canModifyContactQuestionnaire(this.authUser);
          }
        }),

        // View Outbreak template contact follow-up form
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CONTACT_FOLLOW_UP_QUESTIONNAIRE',
          click: (item: OutbreakTemplateModel) => {
            this.router.navigate(['/outbreak-templates', item.id, 'contact-follow-up-questionnaire']);
          },
          visible: (): boolean => {
            return OutbreakTemplateModel.canModifyContactFollowUpQuestionnaire(this.authUser);
          }
        }),

        // View Outbreak template case lab result form
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_CASE_LAB_RESULTS_QUESTIONNAIRE',
          click: (item: OutbreakTemplateModel) => {
            this.router.navigate(['/outbreak-templates', item.id, 'case-lab-results-questionnaire']);
          },
          visible: (): boolean => {
            return OutbreakTemplateModel.canModifyCaseLabResultQuestionnaire(this.authUser);
          }
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (): boolean => {
            return OutbreakTemplateModel.canClone(this.authUser);
          }
        }),

        // Clone Template Outbreak
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTIONS_CLONE_OUTBREAK_TEMPLATE',
          click: (item: OutbreakTemplateModel) => {
            this.cloneOutbreakTemplate(item);
          },
          visible: (): boolean => {
            return OutbreakTemplateModel.canClone(this.authUser);
          }
        })
      ]
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private toastV2Service: ToastV2Service,
    private authDataService: AuthDataService,
    private referenceDataDataService: ReferenceDataDataService,
    private dialogService: DialogService,
    private outbreakTemplateDataService: OutbreakTemplateDataService,
    private i18nService: I18nService,
    private genericDataService: GenericDataService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialization
     */
  ngOnInit() {
    // get the lists for forms
    this.diseasesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.DISEASE);
    this.followUpsTeamAssignmentAlgorithm$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM);
    this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

    // attach default projection
    this.clearedQueryBuilder();

    // initialize Side Table Columns
    this.initializeTableColumns();

    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
     * Initialize Side Table Columns
     */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'name',
    //     label: 'LNG_OUTBREAK_FIELD_LABEL_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'description',
    //     label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DESCRIPTION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'disease',
    //     label: 'LNG_OUTBREAK_FIELD_LABEL_DISEASE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'generateFollowUpsTeamAssignmentAlgorithm',
    //     label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'generateFollowUpsOverwriteExisting',
    //     label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'generateFollowUpsKeepTeamAssignment',
    //     label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'generateFollowUpsDateOfLastContact',
    //     label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT',
    //     visible: false
    //   }),
    // ];
  }

  /**
     * Attach default projection
     */
  clearedQueryBuilder(): void {
    this.queryBuilder.fields(
      'id',
      'name',
      'description',
      'disease',
      'generateFollowUpsTeamAssignmentAlgorithm',
      'generateFollowUpsOverwriteExisting',
      'generateFollowUpsKeepTeamAssignment',
      'generateFollowUpsDateOfLastContact'
    );
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Outbreak Templates list
   */
  refreshList() {
    // retrieve the list of Events
    this.outbreakTemplatesList$ = this.outbreakTemplateDataService
      .getOutbreakTemplatesList(this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount() {
    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    this.outbreakTemplatesListCount$ = this.outbreakTemplateDataService
      .getOutbreakTemplatesCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
     * Delete an outbreak template
     * @param {OutbreakTemplateModel} outbreakTemplate
     */
  deleteOutbreakTemplate(outbreakTemplate: OutbreakTemplateModel) {
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_OUTBREAK_TEMPLATE', outbreakTemplate)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.outbreakTemplateDataService
            .deleteOutbreakTemplate(outbreakTemplate.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              // reload user data to get the updated data regarding active outbreak
              this.authDataService
                .reloadAndPersistAuthUser()
                .subscribe((authenticatedUser) => {
                  this.authUser = authenticatedUser.user;
                });
              this.toastV2Service.success('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_ACTION_DELETE_SUCCESS_MESSAGE');
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Clone existing outbreak template
     * @param outbreakTemplateModel
     */
  cloneOutbreakTemplate(outbreakTemplateModel: OutbreakTemplateModel) {
    // get the outbreak template to clone
    this.outbreakTemplateDataService
      .getOutbreakTemplate(outbreakTemplateModel.id)
      .subscribe((outbreakTemplate: OutbreakTemplateModel) => {
        // create the clone of the parent outbreak template
        this.dialogService
          .showInput(
            new DialogConfiguration({
              message: 'LNG_DIALOG_CONFIRM_CLONE_OUTBREAK_TEMPLATE',
              yesLabel: 'LNG_COMMON_BUTTON_CLONE',
              required: true,
              fieldsList: [new DialogField({
                name: 'clonedOutbreakTemplateName',
                placeholder: 'LNG_DIALOG_FIELD_PLACEHOLDER_CLONED_OUTBREAK_TEMPLATE_NAME',
                required: true,
                type: 'text',
                value: this.i18nService.instant('LNG_PAGE_LIST_OUTBREAK_TEMPLATES_CLONE_NAME', {name: outbreakTemplate.name})
              })],
            }),
            true
          )
          .subscribe((answer) => {
            if (answer.button === DialogAnswerButton.Yes) {
              // set the name for the cloned outbreak template
              outbreakTemplate.name = answer.inputValue.value.clonedOutbreakTemplateName;

              // show loading
              const loadingDialog = this.dialogService.showLoadingDialog();
              this.outbreakTemplateDataService
                .createOutbreakTemplate(outbreakTemplate, outbreakTemplate.id)
                .pipe(
                  catchError((err) => {
                    this.toastV2Service.error(err);
                    loadingDialog.close();
                    return throwError(err);
                  }),
                  switchMap((clonedOutbreakTemplate) => {
                    // update language tokens to get the translation of submitted questions and answers
                    return this.i18nService.loadUserLanguage()
                      .pipe(
                        catchError((err) => {
                          this.toastV2Service.error(err);
                          loadingDialog.close();
                          return throwError(err);
                        }),
                        map(() => clonedOutbreakTemplate)
                      );
                  })
                )
                .subscribe((clonedOutbreakTemplate) => {
                  this.toastV2Service.success('LNG_PAGE_LIST_OUTBREAKS_ACTION_CLONE_SUCCESS_MESSAGE');

                  // hide dialog
                  loadingDialog.close();

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
            }
          });
      });
  }
}

import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, of, throwError } from 'rxjs';
import {
  CreateViewModifyV2ActionType,
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
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import {
  UserModel, UserSettings
} from '../../../../core/models/user.model';
import {
  V2SideDialogConfigInputType,
  IV2SideDialogConfigInputToggleCheckbox
} from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { TeamModel } from '../../../../core/models/team.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import { V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { AppListTableV2Component } from '../../../../shared/components-v2/app-list-table-v2/app-list-table-v2.component';
import { DomSanitizer } from '@angular/platform-browser';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';

/**
 * Component
 */
@Component({
  selector: 'app-follow-up-create-view-modify',
  templateUrl: './follow-up-create-view-modify.component.html'
})
export class FollowUpCreateViewModifyComponent extends CreateViewModifyComponent<FollowUpModel> implements OnDestroy {
  // constants
  public static readonly ORIGIN_FOLLOWUP_DASHBOARD: string = 'followup_dashboard';
  private static readonly TAB_NAMES_QUESTIONNAIRE: string = 'questionnaire';

  // entity
  private _entityData: ContactModel | CaseModel | ContactOfContactModel;

  // history ?
  isHistory: boolean;

  // origin link
  origin: string;

  // hide/show question numbers
  hideQuestionNumbers: boolean = false;

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    protected router: Router,
    protected domSanitizer: DomSanitizer,
    private personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {
    // parent
    super(
      authDataService,
      activatedRoute,
      renderer2,
      personAndRelatedHelperService.redirectService,
      personAndRelatedHelperService.toastV2Service,
      outbreakAndOutbreakTemplateHelperService
    );

    // retrieve data
    this._entityData = activatedRoute.snapshot.data.entityData;
    this.isHistory = !!activatedRoute.snapshot.data.isHistory;
    this.origin = activatedRoute.snapshot.queryParams.origin;

    // display history follow-ups ?
    if (
      this._entityData?.type === EntityType.CASE ||
      this._entityData?.type === EntityType.CONTACT_OF_CONTACT
    ) {
      this.personAndRelatedHelperService.toastV2Service.notice(
        this.isHistory ?
          'LNG_PAGE_MODIFY_FOLLOW_UP_REGISTERED_AS_CONTACT_MESSAGE' :
          'LNG_PAGE_MODIFY_FOLLOW_UP_FIELD_LABEL_FOLLOW_UP_WITH_INFO',
        {
          personName: this._entityData.name,
          personType: this.personAndRelatedHelperService.i18nService.instant(this._entityData.type).toLowerCase()
        },
        AppMessages.APP_MESSAGE_HISTORY_FOLLOW_UPS
      );
    }

    // do we have tabs options already saved ?
    const generalSettings: {
      [key: string]: any
    } = this.authDataService
      .getAuthenticatedUser()
      .getSettings(UserSettings.FOLLOW_UP_GENERAL);
    const hideQuestionNumbers: {
      [key: string]: any
    } = generalSettings && generalSettings[CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS] ?
      generalSettings[CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS][CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS_HIDE_QUESTION_NUMBERS] :
      undefined;

    // use the saved options
    this.hideQuestionNumbers = hideQuestionNumbers ? hideQuestionNumbers[FollowUpCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE] : false;
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // remove global notifications
    this.personAndRelatedHelperService.toastV2Service.hide(AppMessages.APP_MESSAGE_HISTORY_FOLLOW_UPS);
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
    return this.personAndRelatedHelperService.followUp.followUpsDataService
      .getFollowUp(
        this.selectedOutbreak.id,
        record ?
          record.id :
          this.activatedRoute.snapshot.params.followUpId
      )
      .pipe(switchMap((followUp) => {
        // nothing to do ?
        if (
          !this._entityData?.id ||
          this._entityData.id === followUp.personId
        ) {
          return of(followUp);
        }

        // construct query builder to include deleted records
        const qb = new RequestQueryBuilder();

        // retrieve our record
        qb.filter.where({
          id: followUp.personId
        });

        // include deleted
        qb.includeDeleted();

        // we can't have more than 1 with same id :)
        qb.limit(1);

        // retrieve person
        return this.personAndRelatedHelperService.followUp.getPerson(
          this.selectedOutbreak.id,
          qb
        ).pipe(map((data) => {
          // set entity data
          this._entityData = data?.length > 0 ?
            data[0] :
            null;

          // finished
          return followUp;
        }));
      }));
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
    // determine origin link and label
    let originLabel: string = 'LNG_LAYOUT_MENU_ITEM_CONTACTS_FOLLOW_UPS_LABEL';
    let originLink: string = '/contacts/follow-ups';
    if (this.origin === FollowUpCreateViewModifyComponent.ORIGIN_FOLLOWUP_DASHBOARD) {
      originLabel = 'LNG_LAYOUT_MENU_ITEM_CONTACTS_RANGE_FOLLOW_UPS_LABEL';
      originLink = '/contacts/range-follow-ups';
    }

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

      // origin
      if (FollowUpModel.canListDashboard(this.authUser)) {
        this.breadcrumbs.push({
          label: originLabel,
          action: {
            link: [originLink]
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

      // origin
      if (FollowUpModel.canListDashboard(this.authUser)) {
        this.breadcrumbs.push({
          label: originLabel,
          action: {
            link: [originLink]
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
    } else if (this._entityData?.type === EntityType.CONTACT_OF_CONTACT) {
      // parent list page
      if (ContactOfContactModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
          action: {
            link: ['/contacts-of-contacts']
          }
        });
      }

      // origin
      if (FollowUpModel.canListDashboard(this.authUser)) {
        this.breadcrumbs.push({
          label: originLabel,
          action: {
            link: [originLink]
          }
        });
      }

      // view page
      if (ContactOfContactModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this._entityData.name,
          action: {
            link: ['/contacts-of-contacts', this._entityData.id, 'view']
          }
        });
      }

      // list page
      if (FollowUpModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_FOLLOW_UPS_TITLE',
          action: {
            link: ['/contacts', 'contact-of-contact-follow-ups', this._entityData.id]
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
        label: this.personAndRelatedHelperService.i18nService.instant(
          'LNG_PAGE_MODIFY_FOLLOW_UP_TITLE', {
            dateFormatted: moment(this.itemData.date).format('YYYY-MM-DD')
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.personAndRelatedHelperService.i18nService.instant(
          'LNG_PAGE_VIEW_FOLLOW_UP_TITLE', {
            dateFormatted: moment(this.itemData.date).format('YYYY-MM-DD')
          }
        ),
        action: null
      });
    }
  }

  /**
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {}

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    // tab custom configuration
    this.tabConfiguration = {
      inputs: [
        {
          type: V2SideDialogConfigInputType.DIVIDER,
          placeholder: 'LNG_COMMON_LABEL_TAB_OPTIONS'
        },
        {
          type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
          name: FollowUpCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE,
          placeholder: this.isCreate ?
            'LNG_PAGE_CREATE_FOLLOW_UP_TAB_OPTION_SHOW_QUESTION_NUMBERS' :
            'LNG_PAGE_MODIFY_FOLLOW_UP_TAB_OPTION_SHOW_QUESTION_NUMBERS',
          value: !this.hideQuestionNumbers
        }
      ],
      apply: (data, finish) => {
        // save settings
        const hideQuestionNumbers: boolean = !(data.map[FollowUpCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE] as IV2SideDialogConfigInputToggleCheckbox).value;
        this.updateGeneralSettings(
          `${UserSettings.FOLLOW_UP_GENERAL}.${CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS}.${CreateViewModifyComponent.GENERAL_SETTINGS_TAB_OPTIONS_HIDE_QUESTION_NUMBERS}`, {
            [FollowUpCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE]: hideQuestionNumbers
          }, () => {
            // update ui
            this.hideQuestionNumbers = hideQuestionNumbers;
            this.tabsV2Component.detectChanges();

            // finish
            finish();
          });
      }
    };

    // tabs
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
          buttonLabel: this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_CREATE_FOLLOW_UP_ACTION_CREATE_FOLLOW_UP_BUTTON'),
          message: () => this.personAndRelatedHelperService.i18nService.instant(
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
      redirectAfterCreateUpdate: (
        data: FollowUpModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/contacts',
            `${this._entityData.id}`,
            'follow-ups',
            data.id,
            'view'
          ], {
            queryParams: extraQueryParams
          }
        );
      }
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsPersonal(): ICreateViewModifyV2Tab {
    return this.personAndRelatedHelperService.followUp.generateTabsPersonal(this.selectedOutbreak, {
      isCreate: this.isCreate,
      isModify: this.isModify,
      itemData: this.itemData,
      entityData: this._entityData,
      options: {
        dailyFollowUpStatus: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<UserModel>).options,
        addressType: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }
    });
  }

  /**
   * Initialize tabs - Questionnaire
   */
  private initializeTabsQuestionnaire(): ICreateViewModifyV2TabTable {
    let errors: string = '';
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: FollowUpCreateViewModifyComponent.TAB_NAMES_QUESTIONNAIRE,
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
        hideQuestionNumbers: () => {
          return this.hideQuestionNumbers;
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
      modify: this.isHistory ? undefined : {
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
                this.personAndRelatedHelperService.dialogV2Service.showRecordDetailsDialog(
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
            }
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
      type,
      data,
      finished,
      _loading,
      _forms
    ) => {
      // finished
      (type === CreateViewModifyV2ActionType.CREATE ?
        this.personAndRelatedHelperService.followUp.followUpsDataService.createFollowUp(
          this.selectedOutbreak.id,
          this._entityData.id,
          data
        ) :
        this.personAndRelatedHelperService.followUp.followUpsDataService
          .modifyFollowUp(
            this.selectedOutbreak.id,
            this._entityData.id,
            this.itemData.id,
            data
          )
      ).pipe(
        // handle error
        catchError((err) => {
          // show error
          finished(err, undefined);

          // finished
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      ).subscribe((item: FollowUpModel) => {
        // success creating / updating event
        this.personAndRelatedHelperService.toastV2Service.success(
          type === CreateViewModifyV2ActionType.CREATE ?
            'LNG_PAGE_CREATE_FOLLOW_UP_ACTION_CREATE_FOLLOW_UP_SUCCESS_MESSAGE' :
            'LNG_PAGE_MODIFY_FOLLOW_UP_ACTION_MODIFY_FOLLOW_UP_SUCCESS_MESSAGE'
        );

        // finished with success
        finished(undefined, item);
      });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.STATUS_AND_DETAILS,
      link: (item: FollowUpModel) => ['/contacts', `${this._entityData.id}`, 'follow-ups', item.id, 'view'],
      statusVisible: this.expandListColumnRenderer?.statusVisible === undefined ?
        true :
        this.expandListColumnRenderer.statusVisible,
      maxNoOfStatusForms: 2,
      get: {
        status: (item: FollowUpModel) => {
          // must initialize - optimization to not recreate the list everytime there is an event since data won't change ?
          if (!item.uiStatusForms) {
            // determine forms
            const forms: V2ColumnStatusForm[] = this.personAndRelatedHelperService.followUp.getStatusForms({
              item,
              dailyFollowUpStatus: this.activatedRoute.snapshot.data.dailyFollowUpStatus
            });

            // create html
            let html: string = '';
            forms.forEach((form, formIndex) => {
              html += AppListTableV2Component.renderStatusForm(
                form,
                formIndex < forms.length - 1
              );
            });

            // convert to safe html
            item.uiStatusForms = this.domSanitizer.bypassSecurityTrustHtml(html);
          }

          // finished
          return item.uiStatusForms;
        },
        text: (item: FollowUpModel) => item.date ?
          moment(item.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
          '-',
        details: undefined
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'date',
      'statusId',
      'questionnaireAnswers'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = this.personAndRelatedHelperService.followUp.generateAdvancedFiltersPerson(this.selectedOutbreak, {
      contactFollowUpTemplate: () => this.selectedOutbreak.contactFollowUpTemplate,
      options: {
        team: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
        yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        dailyFollowUpStatus: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        addressType: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }
    });
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
    this.expandListRecords$ = this.personAndRelatedHelperService.followUp.followUpsDataService
      .getFollowUpsList(
        this.selectedOutbreak.id,
        data.queryBuilder
      )
      .pipe(
        // determine alertness
        map((followUps: FollowUpModel[]) => {
          return this.personAndRelatedHelperService.followUp.determineAlertness(
            this.selectedOutbreak.contactFollowUpTemplate,
            followUps
          );
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}

import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { Observable, throwError } from 'rxjs';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TeamModel } from '../../../../core/models/team.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { CaseModel } from '../../../../core/models/case.model';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';
import { LocalizationHelper } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-contact-follow-ups-bulk-modify',
  templateUrl: './contact-follow-ups-bulk-modify.component.html'
})
export class ContactFollowUpsBulkModifyComponent extends CreateViewModifyComponent<FollowUpModel> implements OnDestroy {
  // data
  selectedFollowUps: FollowUpModel[] = [];
  futureFollowUps: boolean = false;
  selectedContacts: (ContactOfContactModel | ContactModel | CaseModel)[] = [];
  followUpDates: string[] = [];

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    private router: Router,
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
    return null;
  }

  /**
  * Retrieve item
  */
  protected retrieveItem(): Observable<FollowUpModel> {
    return new Observable<FollowUpModel>((subscriber) => {
      // retrieve follow-ups information
      const qb: RequestQueryBuilder = new RequestQueryBuilder();

      // bring specific follow-ups
      qb.filter.bySelect(
        'id',
        JSON.parse(this.activatedRoute.snapshot.queryParams.followUpsIds),
        true,
        null
      );

      // retrieve follow-ups and contact details
      this.personAndRelatedHelperService.followUp.followUpsDataService
        .getFollowUpsList(
          this.selectedOutbreak.id,
          qb
        )
        .pipe(
          catchError((err) => {
            // hide loading
            subscriber.error(err);

            // send error down the road
            return throwError(err);
          })
        )
        .subscribe((followUps: FollowUpModel[]) => {
          // follow-up data
          this.selectedFollowUps = followUps;

          // check if we have future follow-ups
          // & determine selected contacts
          // & determine selected follow-up dates
          this.followUpDates = [];
          this.selectedContacts = [];
          for (const followUp of this.selectedFollowUps) {
            // add contact to list
            if (
              followUp.person &&
              followUp.person.id &&
              !this.selectedContacts.find((item) => item.id === followUp.person.id)
            ) {
              this.selectedContacts.push(followUp.person);
            }

            // add follow-up date
            if (followUp.date) {
              const date: string = LocalizationHelper.displayDate(followUp.date);
              if (!this.followUpDates.find((item) => item === date)) {
                this.followUpDates.push(date);
              }
            }

            // has future follow-ups ?
            if (
              followUp.date &&
              LocalizationHelper.toMoment(followUp.date).startOf('day').isAfter(LocalizationHelper.today())
            ) {
              this.futureFollowUps = true;
            }
          }

          // sort dates
          this.followUpDates.sort(
            (item1, item2) => LocalizationHelper.toMoment(item1).diff(LocalizationHelper.toMoment(item2))
          );

          // finished - no item to edit
          subscriber.next(null);
          subscriber.complete();
        });
    });
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
    if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_TITLE';
      this.pageTitleData = undefined;
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

    // contacts list page
    if (ContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    }

    // follow-ups list page
    if (FollowUpModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_FOLLOW_UPS_TITLE',
        action: {
          link: ['/contacts/follow-ups']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_TITLE',
      action: null
    });
  }

  /**
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {}

  /**
  * Initialize tabs
  */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Details
        this.initializeDetailTab()
      ],

      // create details
      create: null,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: () => {
        // update - redirect to view
        this.router.navigate([
          this.activatedRoute.snapshot.queryParams?.entityId ?
            `/contacts/contact-related-follow-ups/${this.activatedRoute.snapshot.queryParams.entityId}` :
            '/contacts/follow-ups'
        ]);
      }
    };
  }

  /**
   * Details tabs
   */
  private initializeDetailTab(): ICreateViewModifyV2Tab {
    // modify ?
    return this.personAndRelatedHelperService.createViewModify.tabFilter({
      // Details
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: 'LNG_COMMON_LABEL_DETAILS',
      sections: [
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: null,
          visibleMandatoryConf: {
            dontFilter: true
          },
          inputs: [
            // warnings
            {
              type: CreateViewModifyV2TabInputType.LABEL,
              value: {
                get: () => 'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_MODIFY_DATA_INFO_LABEL'
              }
            },
            {
              type: CreateViewModifyV2TabInputType.LABEL,
              value: {
                get: () => 'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_MODIFY_DATA_IN_THE_FUTURE_LABEL'
              },
              visible: () => {
                return this.futureFollowUps;
              }
            },

            // contacts
            {
              type: CreateViewModifyV2TabInputType.LINK_LIST,
              label: {
                get: () => 'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_SELECTED_CONTACTS'
              },
              links: this.selectedContacts.map((person) => ({
                label: person.name,
                action: {
                  link: () => [
                    person.type === EntityType.CASE ? '/cases' : '/contacts',
                    person.id,
                    'view'
                  ]
                }
              }))
            },

            // dates
            {
              type: CreateViewModifyV2TabInputType.LABEL_LIST,
              label: {
                get: () => 'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_FOLLOW_UPS_DATES'
              },
              labels: this.followUpDates
            }
          ]
        }, {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_MODIFY_LAB_RESULT_TAB_DETAILS_TITLE',
          inputs: [
            // inputs
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'targeted',
              placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
              description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
              value: {
                get: () => null,
                set: () => null
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'statusId',
              placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
              description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => null,
                set: () => null
              },
              disabled: () => this.futureFollowUps
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'teamId',
              placeholder: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
              description: () => 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
              value: {
                get: () => null,
                set: () => null
              }
            }
          ]
        }
      ]
    }, this.personAndRelatedHelperService.followUp.visibleMandatoryKey, this.selectedOutbreak);
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: null,
      modify: {
        link: {
          link: () => [
            '/contacts/follow-ups'
          ]
        },
        visible: () => FollowUpModel.canList(this.authUser)
      },
      createCancel: null,
      modifyCancel: {
        link: {
          link: () => [
            '/contacts/follow-ups'
          ]
        },
        visible: () => FollowUpModel.canList(this.authUser)
      },
      viewCancel: null
    };
  }

  /**
  * Initialize process data
  */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      _type,
      data,
      finished
    ) => {
      // get selected follow-ups ids to pass them to qb
      const selectedFollowUpIds: string[] = this.selectedFollowUps.map((followUp: FollowUpModel) => {
        return followUp.id;
      });

      // something went wrong ?
      if (selectedFollowUpIds.length < 1) {
        // show error
        this.toastV2Service.error('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_ERROR_NO_FOLLOW_UPS_SELECTED');

        // don't do anything
        return;
      }

      // create query
      const qb: RequestQueryBuilder = new RequestQueryBuilder();
      qb.filter.where({
        id: {
          inq: selectedFollowUpIds
        }
      });

      // do request
      this.personAndRelatedHelperService.followUp.followUpsDataService
        .bulkModifyFollowUps(
          this.selectedOutbreak.id,
          data,
          qb
        )
        .pipe(
          // handle error
          catchError((err) => {
            // show error
            finished(err, undefined);

            // finished
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        )
        .subscribe((items) => {
          // success updating event
          this.toastV2Service.success('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_ACTION_MODIFY_MULTIPLE_FOLLOW_UPS_SUCCESS_MESSAGE');

          // finished with success
          finished(undefined, items);
        });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {}

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {}

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {}

  /**
   * Refresh expand list
   */
  refreshExpandList(): void {}
}

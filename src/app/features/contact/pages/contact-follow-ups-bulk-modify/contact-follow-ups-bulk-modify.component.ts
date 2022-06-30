import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { Observable, of, throwError } from 'rxjs';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TeamModel } from '../../../../core/models/team.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { Constants } from '../../../../core/models/constants';
import { CaseModel } from '../../../../core/models/case.model';
import { moment } from '../../../../core/helperClasses/x-moment';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
  selector: 'app-contact-follow-ups-bulk-modify',
  templateUrl: './contact-follow-ups-bulk-modify.component.html'
})
export class ContactFollowUpsBulkModifyComponent extends CreateViewModifyComponent<FollowUpModel> implements OnDestroy {
  // selected follow-ups ids
  selectedFollowUpsIds: string[];
  // selected follow-ups to be modified
  selectedFollowUps: FollowUpModel[] = [];

  futureFollowUps: boolean = false;

  // selected contacts
  selectedContacts: (ContactModel | CaseModel)[] = [];

  // follow-up dates
  followUpDates: string[] = [];

  /**
     * Constructor
     */
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private followUpsDataService: FollowUpsDataService,
    protected toastV2Service: ToastV2Service,
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
    // read route query params
    this.activatedRoute.queryParams
      .subscribe((queryParams: { followUpsIds }) => {
        if (_.isEmpty(queryParams.followUpsIds)) {
          this.toastV2Service.error('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_ERROR_NO_FOLLOW_UPS_SELECTED');

          // No entities selected
          this.disableDirtyConfirm();
          this.router.navigate(['/contacts/follow-ups']);
        } else {
          this.selectedFollowUpsIds = JSON.parse(queryParams.followUpsIds);

          this.loadFollowUps();
        }
      });
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
    // TODO: Can this workaround be improved?
    return of(null);
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
          '/contacts/follow-ups'
        ]);
      }
    };
  }

  /**
   * Details tabs
   */
  private initializeDetailTab(): ICreateViewModifyV2Tab {
    // view / modify ?
    if (!this.isCreate) {
      return {
        // Details
        type: CreateViewModifyV2TabInputType.TAB,
        label: 'LNG_COMMON_LABEL_DETAILS',
        sections: [
          // inputs
          {
            type: CreateViewModifyV2TabInputType.SECTION,
            label: null,
            inputs: [
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
      };
    }
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

      const qb: RequestQueryBuilder = new RequestQueryBuilder();
      qb.filter.where({
        id: {
          inq: selectedFollowUpIds
        }
      });

      // do request
      this.followUpsDataService
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

  /**
     * Load follow-ups
     */
  private loadFollowUps() {
    if (
      this.selectedFollowUpsIds &&
            this.selectedOutbreak
    ) {
      // retrieve follow-ups information
      const qb: RequestQueryBuilder = new RequestQueryBuilder();

      // bring specific follow-ups
      qb.filter.bySelect(
        'id',
        this.selectedFollowUpsIds,
        true,
        null
      );

      // retrieve follow-ups and contact details
      this.followUpsDataService.getFollowUpsList(
        this.selectedOutbreak.id,
        qb
      ).subscribe((followUps: FollowUpModel[]) => {
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
            const date: string = moment(followUp.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
            if (!this.followUpDates.find((item) => item === date)) {
              this.followUpDates.push(date);
            }
          }

          // has future follow-ups ?
          if (Constants.isDateInTheFuture(followUp.date)) {
            this.futureFollowUps = true;
          }
        }

        // sort dates
        this.followUpDates = _.sortBy(
          this.followUpDates,
          (item1, item2) => moment(item1).diff(moment(item2))
        );
      });
    }
  }
}

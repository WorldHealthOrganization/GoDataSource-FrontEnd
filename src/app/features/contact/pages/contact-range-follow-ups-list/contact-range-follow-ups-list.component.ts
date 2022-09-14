import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ContactModel } from '../../../../core/models/contact.model';
import { FollowUpPage } from '../../typings/follow-up-page';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import * as _ from 'lodash';
import { Moment, moment } from '../../../../core/helperClasses/x-moment';
import { Constants } from '../../../../core/models/constants';
import { IV2Column, IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ActivatedRoute } from '@angular/router';
import { RequestFilterGenerator, RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { EntityType } from '../../../../core/models/entity-type';
import { Location } from '@angular/common';
import { V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { LocationModel } from '../../../../core/models/location.model';
import { throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TeamModel } from '../../../../core/models/team.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { ExportDataExtension, ExportDataMethod } from '../../../../core/services/helper/models/dialog-v2.model';
import { V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { TranslateService } from '@ngx-translate/core';
import * as momentOriginal from 'moment';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { IV2FilterText, V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';

@Component({
  selector: 'app-contact-range-follow-ups-list',
  templateUrl: './contact-range-follow-ups-list.component.html',
  styleUrls: ['./contact-range-follow-ups-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ContactRangeFollowUpsListComponent
  extends ListComponent<any>
  implements OnDestroy {

  // default table columns
  defaultTableColumns: IV2Column[] = [
    {
      field: 'name',
      label: 'LNG_ENTITY_FIELD_LABEL_NAME',
      pinned: IV2ColumnPinned.LEFT,
      format: {
        type: 'person.name'
      },
      link: (data) => {
        return data.person.type === EntityType.CASE ?
          (CaseModel.canView(this.authUser) ? `/cases/${data.person.id}/view` : undefined) :
          (ContactModel.canView(this.authUser) ? `/contacts/${data.person.id}/view` : undefined);
      },
      filter: {
        type: V2FilterType.TEXT,
        textType: V2FilterTextType.STARTS_WITH,
        childQueryBuilderKey: 'contact',
        search: (column: IV2Column) => {
          // value
          const value: string = (column.filter as IV2FilterText).value;

          // remove previous condition
          const qb: RequestQueryBuilder = this.queryBuilder.addChildQueryBuilder('contact');
          qb.filter.removePathCondition('or.firstName');
          qb.filter.removePathCondition('or.lastName');
          if (value) {
            // add new condition
            qb.filter.where({
              or: [
                {
                  firstName: RequestFilterGenerator.textStartWith(
                    value,
                    false
                  )
                }, {
                  lastName: RequestFilterGenerator.textStartWith(
                    value,
                    false
                  )
                }
              ]
            });
          }

          // refresh list
          this.needsRefreshList();
        }
      }
    }, {
      field: 'visualId',
      label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID',
      format: {
        type: 'person.visualId'
      },
      pinned: IV2ColumnPinned.LEFT,
      filter: {
        type: V2FilterType.TEXT,
        textType: V2FilterTextType.STARTS_WITH,
        childQueryBuilderKey: 'contact'
      }
    }, {
      field: 'locationId',
      label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
      format: {
        type: 'person.mainAddress.location.name'
      },
      link: (data) => {
        return data.person?.mainAddress?.location?.id && LocationModel.canView(this.authUser) ?
          `/locations/${data.person.mainAddress.location.id}/view` :
          undefined;
      }
    },
    {
      field: 'dateOfLastContact',
      label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
      format: {
        type: V2ColumnFormat.DATE,
        field: 'person.dateOfLastContact'
      }
    },
    {
      field: 'endDate',
      label: 'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_FIELD_LABEL_DATE_END_FOLLOW_UP',
      format: {
        type: V2ColumnFormat.DATE,
        field: 'person.followUp.endDate'
      }
    }
  ];

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private followUpsDataService: FollowUpsDataService,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private toastV2Service: ToastV2Service,
    private dialogV2Service: DialogV2Service,
    private translateService: TranslateService
  ) {
    super(
      listHelperService,
      true
    );

    // additional information
    this.suffixLegends = [{
      label: 'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE',
      value: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options.map((option) => Object.assign(
        {},
        option, {
          color: option.data?.getColorCode ?
            option.data.getColorCode() :
            Constants.DEFAULT_COLOR_REF_DATA
        }
      ))
    }];
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Selected outbreak was changed
   */
  selectedOutbreakChanged(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {}

  /**
   * Initialize side table columns
   */
  protected initializeTableColumns(): void {}

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {
    this.infos = [
      'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_NO_DATA_LABEL',
      'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_CLICK_TO_VIEW_FOLLOW_UP_LABEL',
      'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_QUESTIONNAIRE_ALERT_LABEL'
    ];
  }

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = [
      // case / contact
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME',
        childQueryBuilderKey: 'contact'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME',
        childQueryBuilderKey: 'contact'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID',
        childQueryBuilderKey: 'contact'
      },
      {
        type: V2AdvancedFilterType.LOCATION_MULTIPLE,
        field: 'addresses',
        label: 'LNG_CONTACT_FIELD_LABEL_ADDRESS_LOCATION',
        childQueryBuilderKey: 'contact'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        childQueryBuilderKey: 'contact'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'followUp.endDate',
        label: 'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_FIELD_LABEL_DATE_END_FOLLOW_UP',
        childQueryBuilderKey: 'contact'
      },

      // follow-up
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE'
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'teamId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
        options: (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'statusId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
        options: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }
    ];
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return FollowUpModel.canExportRange(this.authUser);
      },
      menuOptions: [
        // Export follow-up dashboard
        {
          label: {
            get: () => 'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_EXPORT_TITLE'
                },
                export: {
                  url: `outbreaks/${this.selectedOutbreak.id}/contacts/range-list/export`,
                  async: false,
                  method: ExportDataMethod.POST,
                  fileName: `${this.translateService.instant('LNG_LAYOUT_MENU_ITEM_CONTACTS_RANGE_FOLLOW_UPS_LABEL')} - ${momentOriginal().format('YYYY-MM-DD HH:mm')}`,
                  allow: {
                    types: [
                      ExportDataExtension.PDF
                    ]
                  },
                  inputs: {
                    append: [
                      {
                        type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
                        placeholder: 'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_EXPORT_GROUP_BY_BUTTON',
                        name: 'groupBy',
                        options: (this.activatedRoute.snapshot.data.followUpGroupBy as IResolverV2ResponseModel<ILabelValuePairModel>).options,
                        value: Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE.value,
                        validators: {
                          required: () => true
                        }
                      }, {
                        type: V2SideDialogConfigInputType.DATE,
                        placeholder: 'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_START_DATE',
                        name: 'startDate',
                        value: undefined,
                        validators: {
                          required: () => true
                        }
                      }, {
                        type: V2SideDialogConfigInputType.DATE,
                        placeholder: 'LNG_PAGE_LIST_RANGE_FOLLOW_UPS_END_DATE',
                        name: 'endDate',
                        value: undefined,
                        validators: {
                          required: () => true
                        }
                      }
                    ]
                  }
                }
              });
            }
          },
          visible: (): boolean => {
            return FollowUpModel.canExportRange(this.authUser);
          }
        }
      ]
    };
  }

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // contacts breadcrumb
    if (ContactModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    }

    // current page
    this.breadcrumbs.push({
      label: 'LNG_LAYOUT_MENU_ITEM_CONTACTS_RANGE_FOLLOW_UPS_LABEL',
      action: null
    });
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Refresh list
   */
  refreshList(): void {
    // order by name
    this.queryBuilder.sort.clear();
    this.queryBuilder.sort
      .by(
        'contact.firstName',
        RequestSortDirection.ASC
      )
      .by(
        'contact.lastName',
        RequestSortDirection.ASC
      )
      .by(
        'contact.visualId',
        RequestSortDirection.ASC
      );

    // retrieve list
    this.records$ = this.followUpsDataService
      .getRangeFollowUpsList(
        this.selectedOutbreak.id,
        this.queryBuilder
      )
      .pipe(
        // process data
        map((rangeData) => {
          // determine date ranges
          let minDate: Moment;
          let maxDate: Moment;

          // transform to list
          const usedDates: {
            [date: string]: true
          } = {};
          const followUpsGroupedByContact: {
            person: ContactModel | CaseModel,
            followUps: {
              [date: string]: FollowUpModel[]
            }
          }[] = (rangeData || []).map((data) => {
            // determine follow-up questionnaire alertness
            data.followUps = FollowUpModel.determineAlertness(
              this.selectedOutbreak.contactFollowUpTemplate,
              data.followUps
            );

            // get grouped followups by contact & date
            return {
              person: data.person,
              followUps: _.chain(data.followUps)
                .groupBy((followUp: FollowUpModel) => {
                  // determine min & max dates
                  const date = moment(followUp.date).startOf('day');
                  if (followUp.statusId) {
                    minDate = minDate ?
                      (date.isBefore(minDate) ? date : minDate) :
                      date;
                    maxDate = maxDate ?
                      (date.isAfter(maxDate) ? moment(date) : maxDate) :
                      moment(date);
                  }

                  // sort by date ascending
                  return date.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
                })
                .mapValues((followUpData: FollowUpModel[], date) => {
                  // used ?
                  if (followUpData?.length > 0) {
                    usedDates[date] = true;
                  }

                  // sort
                  return _.sortBy(
                    followUpData,
                    (followUp: FollowUpModel) => {
                      return moment(followUp.date);
                    }
                  );
                })
                .value()
            };
          });

          // create dates array
          const daysColumns: IV2Column[] = [];
          if (
            minDate &&
            maxDate
          ) {
            // push dates
            while (minDate.isSameOrBefore(maxDate)) {
              // add day to list
              // - exclude dates with no data
              const formattedFieldDate = minDate.format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
              const formattedLabelDate = minDate.format('YYYY<br />MMM D');
              if (usedDates[formattedFieldDate]) {
                daysColumns.push({
                  field: formattedFieldDate,
                  label: formattedLabelDate,
                  notMovable: true,
                  lockPosition: 'right',
                  width: 65,
                  alwaysVisible: true,
                  centerHeader: true,
                  format: {
                    type: V2ColumnFormat.HTML
                  },
                  html: (
                    data,
                    column
                  ) => {
                    // nothing to do here ?
                    const followUps: FollowUpModel[] = data.followUps[column.field];
                    if (!followUps?.length) {
                      return '';
                    }

                    // construct html
                    let html: string = '<div class="gd-follow-up-dashboard-date-column-cell">';
                    followUps.forEach((followUp) => {
                      // determine bg color
                      const bgColor: string = followUp.statusId && (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[followUp.statusId] ?
                        (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[followUp.statusId].getColorCode() :
                        Constants.DEFAULT_COLOR_REF_DATA;

                      // construct url
                      const url: string = data.person.type === EntityType.CASE ?
                        `/cases/${data.person.id}/follow-ups/${followUp.id}/view?rootPage=${FollowUpPage.RANGE}` :
                        `/contacts/${data.person.id}/follow-ups/${followUp.id}/view?rootPage=${FollowUpPage.RANGE}`;

                      // render html
                      html += `<a class="gd-list-table-link" href="${this.location.prepareExternalUrl(url)}">
                        <div is-link="${url}" class="gd-follow-up-dashboard-date-column-cell-follow-up" style="background-color: ${bgColor};">
                          ${!followUp.alerted ? '' : '<img class="gd-follow-up-dashboard-date-column-cell-follow-up-alerted" src="/assets/images/bell.png" />'}
                        </div>
                      </a>`;
                    });

                    // finalize html
                    html += '</div>';

                    // finished
                    return html;
                  }
                });
              }

              // next day
              minDate.add('1', 'days');
            }
          }

          // update table columns
          this.tableColumns = [
            ...this.defaultTableColumns,
            ...daysColumns
          ];

          // finished
          return followUpsGroupedByContact;
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(): void {
    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // count
    this.followUpsDataService
      .getRangeFollowUpsListCount(
        this.selectedOutbreak.id,
        countQueryBuilder
      )
      .pipe(
        // error
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

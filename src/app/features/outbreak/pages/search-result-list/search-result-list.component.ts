import {
  Component,
  OnDestroy
} from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { throwError } from 'rxjs';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { ActivatedRoute } from '@angular/router';
import { GlobalEntitySearchDataService } from '../../../../core/services/data/global-entity-search.data.service';
import { catchError, takeUntil } from 'rxjs/operators';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import * as _ from 'lodash';
import { IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { EntityType } from '../../../../core/models/entity-type';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-search-result-list',
  templateUrl: './search-result-list.component.html'
})
export class SearchResultListComponent extends ListComponent<CaseModel | ContactModel | ContactOfContactModel | EventModel> implements OnDestroy {
  // search by value
  private _searchValue: string;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private globalEntitySearchDataService: GlobalEntitySearchDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute,
    private i18nService: I18nService,
    private entityHelperService: EntityHelperService
  ) {
    // parent
    super(listHelperService);

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // determine search by value
    this._searchValue = activatedRoute.snapshot.queryParams.search;
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // enable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = false;
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
  protected initializeTableColumnActions(): void {
    this.tableColumnActions = {
      format: {
        type: V2ColumnFormat.ACTIONS
      },
      actions: [
        // View Event
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_ACTION_VIEW',
          action: {
            link: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): string[] => {
              return [this.getItemRouterLink(item, 'view')];
            }
          },
          visible: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean => {
            return !item.deleted &&
              item.canView(this.authUser);
          }
        },

        // Modify Event
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
          action: {
            link: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): string[] => {
              return [this.getItemRouterLink(item, 'modify')];
            }
          },
          visible: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean => {
            return !item.deleted &&
              this.selectedOutbreakIsActive &&
              item.canModify(this.authUser);
          }
        }
      ]
    };
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    this.tableColumns = [
      {
        field: 'id',
        label: 'LNG_COMMON_MODEL_FIELD_LABEL_ID',
        highlight: this._searchValue
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        format: {
          type: V2ColumnFormat.STATUS
        },
        notResizable: true,
        legends: [
          // person type
          {
            title: 'LNG_ENTITY_FIELD_LABEL_TYPE',
            items: (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.CIRCLE,
                  color: item.getColorCode()
                },
                label: item.id,
                order: item.order
              };
            })
          }
        ],
        forms: (_column, data): V2ColumnStatusForm[] => {
          // construct list of forms that we need to display
          const forms: V2ColumnStatusForm[] = [];

          // person type
          if (
            data.type &&
            (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[data.type]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.CIRCLE,
              color: (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[data.type].getColorCode(),
              tooltip: this.i18nService.instant(data.type)
            });
          } else {
            forms.push({
              type: IV2ColumnStatusFormType.EMPTY
            });
          }

          // finished
          return forms;
        }
      },
      {
        field: 'visualId',
        label: 'LNG_PAGE_LIST_SEARCH_RESULT_ENTITY_ID',
        highlight: this._searchValue
      },
      {
        field: 'name',
        label: 'LNG_ENTITY_FIELD_LABEL_NAME',
        highlight: this._searchValue
      },
      {
        field: 'numberOfContacts',
        label: 'LNG_ENTITY_FIELD_LABEL_NUMBER_OF_CONTACTS',
        format: {
          type: V2ColumnFormat.BUTTON
        },
        cssCellClass: 'gd-cell-button',
        buttonLabel: (item) => item.numberOfContacts === 0 ?
          item.numberOfContacts.toLocaleString('en') :
          (item.numberOfContacts || '').toLocaleString('en'),
        color: 'text',
        click: (item) => {
          // if we do not have contacts return
          if (item.numberOfContacts < 1) {
            return;
          }

          // display dialog
          this.entityHelperService.contacts(this.selectedOutbreak, item);
        },
        disabled: (data) => !RelationshipModel.canList(this.authUser) || !data.canListRelationshipContacts(this.authUser)
      },
      {
        field: 'numberOfExposures',
        label: 'LNG_ENTITY_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        format: {
          type: V2ColumnFormat.BUTTON
        },
        cssCellClass: 'gd-cell-button',
        buttonLabel: (item) => item.numberOfExposures === 0 ?
          item.numberOfExposures.toLocaleString('en') :
          (item.numberOfExposures || '').toLocaleString('en'),
        color: 'text',
        click: (item) => {
          // if we do not have exposures return
          if (item.numberOfExposures < 1) {
            return;
          }

          // display dialog
          this.entityHelperService.exposures(this.selectedOutbreak, item);
        },
        disabled: (data) => !RelationshipModel.canList(this.authUser) || !data.canListRelationshipExposures(this.authUser)
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
  protected initializeTableInfos(): void {
    this.infos = [
      'LNG_PAGE_LIST_SEARCH_RESULT_DESCRIPTION'
    ];
  }

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {}

  /**
   * Initialize quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize add action
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize grouped data
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
        label: 'LNG_PAGE_LIST_SEARCH_RESULT_TITLE',
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
      'visualId',
      'name',
      'firstName',
      'lastName',
      'type',
      'numberOfContacts',
      'numberOfExposures'
    ];
  }

  /**
   * Re(load) the Events list, based on the applied filter, sort criterias
   */
  refreshList(): void {
    // retrieve the list of entities
    this.records$ = this.globalEntitySearchDataService
      .searchEntity(
        this.selectedOutbreak.id,
        this._searchValue,
        this.queryBuilder
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean): void {
    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    countQueryBuilder.clearFields();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.globalEntitySearchDataService
      .searchEntityCount(
        this.selectedOutbreak.id,
        this._searchValue,
        countQueryBuilder
      )
      .pipe(
        catchError((err) => {
          // show error
          this.toastV2Service.error(err);

          // continue
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }

  /**
   * Get the link to redirect to view page depending on item type and action
   */
  private getItemRouterLink(item: CaseModel | ContactModel | ContactOfContactModel | EventModel, action: string): string {
    switch (item.type) {
      case EntityType.CASE:
        return `/cases/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.CONTACT:
        return `/contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.CONTACT_OF_CONTACT:
        return `/contacts-of-contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.EVENT:
        return `/events/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
    }

    // ...
    return '';
  }
}

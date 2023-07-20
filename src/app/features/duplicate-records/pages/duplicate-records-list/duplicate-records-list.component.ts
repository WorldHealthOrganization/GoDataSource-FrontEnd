import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { PeoplePossibleDuplicateGroupModel, PeoplePossibleDuplicateModel } from '../../../../core/models/people-possible-duplicate.model';
import { EntityType } from '../../../../core/models/entity-type';
import { AddressModel } from '../../../../core/models/address.model';
import { UntypedFormControl, NgForm } from '@angular/forms';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { catchError, share } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { EventModel } from '../../../../core/models/event.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2ActionIcon, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { Router } from '@angular/router';
import { AppMessages } from '../../../../core/enums/app-messages.enum';
import {
  AppFormCheckboxV2Component
} from '../../../../shared/forms-v2/components/app-form-checkbox-v2/app-form-checkbox-v2.component';

@Component({
  selector: 'app-duplicate-records-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './duplicate-records-list.component.html',
  styleUrls: ['./duplicate-records-list.component.scss']
})
export class DuplicateRecordsListComponent extends ListComponent<any> implements OnDestroy {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  // constants
  EntityType = EntityType;
  AddressModel = AddressModel;
  EntityModel = EntityModel;

  // duplicates
  duplicatesList: PeoplePossibleDuplicateModel;
  duplicatesListCount$: Observable<IBasicCount>;

  // visible table columns
  tableVisibleHeaderColumns: string[] = [
    'checkbox',
    'type',
    'firstName',
    'lastName',
    'documents',
    'visualId',
    'age',
    'address'
  ];

  // ignore
  private _ignoreCheckAllToggle: boolean = false;
  private _ignoreCheckOneToggle: boolean = false;

  // action
  actionButton: IV2ActionIcon;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private router: Router
  ) {
    // parent
    super(listHelperService);

    // action button
    this.actionButton = {
      type: V2ActionType.ICON,
      icon: 'refresh',
      iconTooltip: 'LNG_COMMON_BUTTON_REFRESH_LIST',
      action: {
        click: () => {
          this.needsRefreshList(true);
        }
      }
    };
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // remove global notifications
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_MERGE_ACTIVE_OUTBREAK);
  }

  /**
   * Selected outbreak was changed
   */
  selectedOutbreakChanged(): void {
    if (!this.selectedOutbreakIsActive) {
      this.toastV2Service.notice(
        'LNG_PAGE_LIST_DUPLICATE_RECORDS_WARNING_NO_ACTIVE_OUTBREAK',
        undefined,
        AppMessages.APP_MESSAGE_DUPLICATE_MERGE_ACTIVE_OUTBREAK
      );
    }

    // remove global notifications
    this.toastV2Service.hide(AppMessages.APP_MESSAGE_DUPLICATE_MERGE_ACTIVE_OUTBREAK);

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
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {}

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
  protected initializeTableAdvancedFilters(): void {}

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
  protected initializeAddAction(): void {}

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
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
        label: 'LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the list
   */
  refreshList() {
    // check
    if (!this.selectedOutbreak?.id) {
      return;
    }

    // retrieve the list
    this.duplicatesList = null;
    this.outbreakDataService
      .getPeoplePossibleDuplicates(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe((duplicatesList) => {
        this.duplicatesList = duplicatesList;
      });
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount() {
    // check
    if (!this.selectedOutbreak?.id) {
      return;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    countQueryBuilder.clearFields();
    this.duplicatesListCount$ = this.outbreakDataService
      .getPeoplePossibleDuplicatesCount(this.selectedOutbreak.id, countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
   * Check all checkboxes
   */
  checkAllToggle(input: AppFormCheckboxV2Component) {
    // ignore ?
    if (this._ignoreCheckAllToggle) {
      return;
    }

    // set children checkboxes values
    _.each(input.control.parent.controls, (checkbox: UntypedFormControl) => {
      // ignore check all input
      if (checkbox === input.control) {
        return;
      }

      // update value
      this._ignoreCheckOneToggle = true;
      checkbox.setValue(input.value);
      this._ignoreCheckOneToggle = false;
    });
  }

  /**
   * Check all checkboxes
   */
  checkOneToggle(form: NgForm) {
    // ignore ?
    if (this._ignoreCheckOneToggle) {
      return;
    }

    // set children checkboxes values
    let newValue: boolean = true;
    _.each(form.controls, (checkbox: UntypedFormControl, name: string) => {
      if (name !== 'checkAll') {
        newValue = newValue && checkbox.value;
      }
    });

    // set all checkbox value
    this._ignoreCheckAllToggle = true;
    form.controls.checkAll.setValue(newValue);
    this._ignoreCheckAllToggle = false;
  }

  /**
   * Determine if we have at least one checkbox checked
   */
  hasAtLeastTwoCheckboxChecked(form: NgForm): boolean {
    // set children checkboxes values
    let checkedItems: number = 0;
    _.each(form.controls, (checkbox: UntypedFormControl, name: string) => {
      if (
        name !== 'checkAll' &&
        checkbox.value
      ) {
        checkedItems++;
        if (checkedItems > 1) {
          return false;
        }
      }
    });

    // finished
    return checkedItems === 2;
  }

  /**
   * Merge records
   */
  mergeCheckedRecords(form: NgForm) {
    // determine merge ids
    const mergeIds: string[] = [];
    _.each(form.controls, (checkbox: UntypedFormControl, name: string) => {
      if (
        name !== 'checkAll' &&
                checkbox.value
      ) {
        // determine id
        const id: string = name.substring(
          name.indexOf('[') + 1,
          name.indexOf(']')
        );

        // add it to merge list
        mergeIds.push(id);
      }
    });

    // determine if we have multiple types that we want ot merge
    const types: EntityType[] = _.chain(mergeIds)
      .map((id: string) => this.duplicatesList.peopleMap[id])
      .uniqBy('type')
      .map('type')
      .value();

    // we shouldn't be able to merge two types...
    if (types.length > 1) {
      this.toastV2Service.error('LNG_PAGE_LIST_DUPLICATE_RECORDS_MERGE_NOT_SUPPORTED');
      return;
    }

    // check if we have write access to any of the present types
    if (types.length < 1) {
      this.toastV2Service.error('LNG_PAGE_LIST_DUPLICATE_RECORDS_NO_WRITE_ACCESS');
      return;
    }

    // redirect to merge page
    this.router.navigate(
      ['/duplicated-records', EntityModel.getLinkForEntityType(types[0]), 'merge'], {
        queryParams: {
          ids: JSON.stringify(mergeIds)
        }
      }
    );
  }

  /**
   * Check if group has merge permission
   */
  hasMergePermission(group: PeoplePossibleDuplicateGroupModel): boolean {
    switch (group.groupType) {
      case EntityType.CASE:
        return PeoplePossibleDuplicateModel.canMergeCases(this.authUser) && this.selectedOutbreakIsActive;
      case EntityType.CONTACT:
        return PeoplePossibleDuplicateModel.canMergeContacts(this.authUser) && this.selectedOutbreakIsActive;
      case EntityType.EVENT:
        return PeoplePossibleDuplicateModel.canMergeEvents(this.authUser) && this.selectedOutbreakIsActive;
      case EntityType.CONTACT_OF_CONTACT:
        return PeoplePossibleDuplicateModel.canMergeContacts(this.authUser) && this.selectedOutbreakIsActive;
      default:
        // not supported
        return false;
    }
  }

  /**
   * Cast to event
   */
  getEvent(item): EventModel {
    return item as EventModel;
  }

  /**
   * Cast to anything but not event
   */
  getNotEvent(item): CaseModel | ContactModel | ContactOfContactModel {
    return item as CaseModel | ContactModel | ContactOfContactModel;
  }
}

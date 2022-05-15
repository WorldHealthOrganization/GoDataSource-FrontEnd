import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { PeoplePossibleDuplicateGroupModel, PeoplePossibleDuplicateModel } from '../../../../core/models/people-possible-duplicate.model';
import { EntityType } from '../../../../core/models/entity-type';
import { AddressModel } from '../../../../core/models/address.model';
import { FormControl, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { catchError, share } from 'rxjs/operators';
import { Subscription } from 'rxjs/internal/Subscription';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { EventModel } from '../../../../core/models/event.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-duplicate-records-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './duplicate-records-list.component.html',
  styleUrls: ['./duplicate-records-list.component.less']
})
export class DuplicateRecordsListComponent extends ListComponent<any> implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE', '.', true)
  // ];

  outbreakSubscriber: Subscription;

  // constants
  EntityType = EntityType;
  AddressModel = AddressModel;
  EntityModel = EntityModel;

  // duplicates
  duplicatesList: PeoplePossibleDuplicateModel;
  duplicatesListCount$: Observable<IBasicCount>;

  /**
     * Visible table columns
     */
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

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // subscribe to the Selected Outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        // initialize pagination
        this.initPaginator();
        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
      });
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

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
    if (this.selectedOutbreak) {
      // remove paginator from query builder
      const countQueryBuilder = _.cloneDeep(this.queryBuilder);
      countQueryBuilder.paginator.clear();
      countQueryBuilder.sort.clear();
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
  }

  /**
     * Check all checkboxes
     * @param form
     */
  checkAllToggle(form: NgForm) {
    // toggle value
    const newValue: boolean = form.controls.checkAll.value;

    // set children checkboxes values
    _.each(form.controls, (checkbox: FormControl) => {
      checkbox.setValue(newValue);
    });
  }

  /**
     * Check all checkboxes
     * @param form
     */
  checkOneToggle(form: NgForm) {
    // set children checkboxes values
    let newValue: boolean = true;
    _.each(form.controls, (checkbox: FormControl, name: string) => {
      if (name !== 'checkAll') {
        newValue = newValue && checkbox.value;
      }
    });

    // set all checkbox value
    form.controls.checkAll.setValue(newValue);
  }

  /**
     * Determine if we have at least one checkbox checked
     * @param form
     */
  hasAtLeastTwoCheckboxChecked(form: NgForm): boolean {
    // set children checkboxes values
    let checkedItems: number = 0;
    _.each(form.controls, (checkbox: FormControl, name: string) => {
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
     * @param form
     */
  mergeCheckedRecords(form: NgForm) {
    // determine merge ids
    const mergeIds: string[] = [];
    _.each(form.controls, (checkbox: FormControl, name: string) => {
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
        return PeoplePossibleDuplicateModel.canMergeCases(this.authUser);
      case EntityType.CONTACT:
        return PeoplePossibleDuplicateModel.canMergeContacts(this.authUser);
      case EntityType.EVENT:
        return PeoplePossibleDuplicateModel.canMergeEvents(this.authUser);
      case EntityType.CONTACT_OF_CONTACT:
        return PeoplePossibleDuplicateModel.canMergeContacts(this.authUser);
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

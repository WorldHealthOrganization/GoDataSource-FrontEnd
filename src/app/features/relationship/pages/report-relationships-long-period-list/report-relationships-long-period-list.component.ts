import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { catchError, tap } from 'rxjs/operators';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { RelationshipModel, ReportDifferenceOnsetRelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { throwError } from 'rxjs/internal/observable/throwError';
import { CaseModel } from '../../../../core/models/case.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-report-relationships-long-period',
  templateUrl: './report-relationships-long-period-list.component.html'
})
export class ReportRelationshipsLongPeriodListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  outbreakSubscriber: Subscription;

  // list of long periods in the dates of onset between cases in the chain of transmission i.e. indicate where an intermediate contact may have been missed
  relationshipList$: Observable<ReportDifferenceOnsetRelationshipModel[]>;

  fixedTableColumns: string[] = [
    'people[0].firstName',
    'people[0].lastName',
    'people[0].dateOfOnset',
    'people[1].firstName',
    'people[1].lastName',
    'people[1].dateOfOnset',
    'differenceBetweenDatesOfOnset'
  ];

  recordActions: HoverRowAction[] = [
    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // View people 1
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_VIEW',
          menuOptionLabelTranslateData: (item: ReportDifferenceOnsetRelationshipModel) => {
            return item.people[0].model;
          },
          click: (item: ReportDifferenceOnsetRelationshipModel) => {
            this.router.navigate(['/cases', item.people[0].model.id, 'view'], {
              queryParams: {
                longPeriod: true
              }
            });
          },
          visible: () => {
            return CaseModel.canView(this.authUser);
          }
        }),

        // View people 2
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_VIEW',
          menuOptionLabelTranslateData: (item: ReportDifferenceOnsetRelationshipModel) => {
            return item.people[1].model;
          },
          click: (item: ReportDifferenceOnsetRelationshipModel) => {
            this.router.navigate(['/cases', item.people[1].model.id, 'view'], {
              queryParams: {
                longPeriod: true
              }
            });
          },
          visible: () => {
            return CaseModel.canView(this.authUser);
          }
        }),

        // View relationship
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_VIEW_RELATIONSHIP',
          click: (item: ReportDifferenceOnsetRelationshipModel) => {
            // #TODO TBD - if this is correct !?
            const relationTypePath: string = _.find(item.persons, { id: item.people[0].model.id }).source ? 'contacts' : 'exposures';
            this.router.navigate(['/relationships', EntityType.CASE, item.people[0].model.id, relationTypePath, item.id, 'view']);
          },
          visible: () => {
            return RelationshipModel.canView(this.authUser);
          }
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: () => {
            return CaseModel.canView(this.authUser) ||
                            RelationshipModel.canView(this.authUser);
          }
        }),

        // Modify people 1
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_MODIFY',
          menuOptionLabelTranslateData: (item: ReportDifferenceOnsetRelationshipModel) => {
            return item.people[0].model;
          },
          click: (item: ReportDifferenceOnsetRelationshipModel) => {
            this.router.navigate(['/cases', item.people[0].model.id, 'modify'], {
              queryParams: {
                longPeriod: true
              }
            });
          },
          visible: () => {
            return this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            CaseModel.canModify(this.authUser);
          }
        }),

        // Modify people 2
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_MODIFY',
          menuOptionLabelTranslateData: (item: ReportDifferenceOnsetRelationshipModel) => {
            return item.people[1].model;
          },
          click: (item: ReportDifferenceOnsetRelationshipModel) => {
            this.router.navigate(['/cases', item.people[1].model.id, 'modify'], {
              queryParams: {
                longPeriod: true
              }
            });
          },
          visible: () => {
            return this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            CaseModel.canModify(this.authUser);
          }
        }),

        // Modify relationship
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_MODIFY_RELATIONSHIP',
          click: (item: ReportDifferenceOnsetRelationshipModel) => {
            // #TODO TBD - if this is correct !?
            const relationTypePath: string = _.find(item.persons, { id: item.people[0].model.id }).source ? 'contacts' : 'exposures';
            this.router.navigate(['/relationships', EntityType.CASE, item.people[0].model.id, relationTypePath, item.id, 'modify']);
          },
          visible: () => {
            return this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            RelationshipModel.canModify(this.authUser);
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
    private outbreakDataService: OutbreakDataService,
    private relationshipDataService: RelationshipDataService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // subscribe to the Selected Outbreak Subject stream
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        // refresh
        this.needsRefreshList(true);
      });

    // initialize breadcrumbs
    this.initializeBreadcrumbs();
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();

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
     * Initialize breadcrumbs
     */
  // private initializeBreadcrumbs() {
  //   // reset
  //   this.breadcrumbs = [];
  //
  //   // cases list
  //   if (CaseModel.canList(this.authUser)) {
  //     this.breadcrumbs.push(
  //       new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
  //     );
  //   }
  //
  //   // current page
  //   this.breadcrumbs.push(
  //     new BreadcrumbItemModel('LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_TITLE', '', true)
  //   );
  // }

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
   * Re(load) the Cases list, based on the applied filter, sort criterias
   */
  refreshList(finishCallback: (records: any[]) => void) {
    if (this.selectedOutbreak) {
      // retrieve the list
      this.relationshipList$ = this.relationshipDataService
        .getLongPeriodBetweenDateOfOnset(this.selectedOutbreak.id)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            finishCallback([]);
            return throwError(err);
          }),
          tap((data: any[]) => {
            finishCallback(data);
          })
        );
    } else {
      finishCallback([]);
    }
  }
}

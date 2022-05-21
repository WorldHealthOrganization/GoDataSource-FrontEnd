import { Component, OnInit, ViewChild } from '@angular/core';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute } from '@angular/router';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { AddressModel } from '../../../../core/models/address.model';
import { forkJoin } from 'rxjs';
import { WorldMapMovementComponent } from '../../../../common-modules/world-map-movement/components/world-map-movement/world-map-movement.component';
import { EntityType } from '../../../../core/models/entity-type';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2ActionMenuLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';

@Component({
  selector: 'app-view-movement-case',
  templateUrl: './view-movement-case.component.html'
})
export class ViewMovementCaseComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  private _caseData: CaseModel = new CaseModel();
  movementAddresses: AddressModel[] = [];

  @ViewChild('mapMovement', { static: true }) mapMovement: WorldMapMovementComponent;

  // loading data
  displayLoading: boolean = true;

  // authenticated user details
  private _authUser: UserModel;

  // quick actions
  quickActions: IV2ActionMenuLabel;

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private caseDataService: CaseDataService,
    private outbreakDataService: OutbreakDataService,
    private authDataService: AuthDataService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this._authUser = this.authDataService.getAuthenticatedUser();

    this.route.params.subscribe((params: { caseId }) => {
      this.outbreakDataService
        .getSelectedOutbreak()
        .subscribe((selectedOutbreak: OutbreakModel) => {
          forkJoin([
            this.caseDataService.getCase(selectedOutbreak.id, params.caseId),
            this.caseDataService.getCaseMovement(selectedOutbreak.id, params.caseId)
          ])
            .subscribe((
              [caseData, movementData]: [CaseModel, AddressModel[]]
            ) => {
              // case data
              this._caseData = caseData;

              // initialize page breadcrumbs
              this.initializeBreadcrumbs();

              // movement data
              this.displayLoading = false;
              this.movementAddresses = movementData;
            });
        });
    });

    // initialize page breadcrumbs
    this.initializeBreadcrumbs();

    // quick actions
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: () => CaseModel.canExportMovementMap(this._authUser),
      menuOptions: [
        // Export map
        {
          label: {
            get: () => 'LNG_PAGE_VIEW_MOVEMENT_CASE_EXPORT'
          },
          action: {
            click: () => {
              this.mapMovement.exportMovementMap(EntityType.CASE);
            }
          },
          visible: () => CaseModel.canExportMovementMap(this._authUser)
        }
      ]
    };
  }

  /**
     * Initialize breadcrumbs
     */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this._authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // case list page
    if (CaseModel.canList(this._authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CASES_TITLE',
        action: {
          link: ['/cases']
        }
      });
    }

    // case breadcrumbs
    if (this._caseData) {
      // case view page
      if (CaseModel.canView(this._authUser)) {
        this.breadcrumbs.push({
          label: this._caseData.name,
          action: {
            link: [`/cases/${this._caseData.id}/view`]
          }
        });
      }

      // current page
      this.breadcrumbs.push({
        label: 'LNG_PAGE_VIEW_MOVEMENT_CASE_TITLE',
        action: null
      });
    }
  }
}

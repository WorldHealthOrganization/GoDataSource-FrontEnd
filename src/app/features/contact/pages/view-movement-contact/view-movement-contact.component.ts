import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { forkJoin } from 'rxjs';
import { AddressModel } from '../../../../core/models/address.model';
import { WorldMapMovementComponent } from '../../../../common-modules/world-map-movement/components/world-map-movement/world-map-movement.component';
import { EntityType } from '../../../../core/models/entity-type';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionMenuLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-view-movement-contact',
  templateUrl: './view-movement-contact.component.html'
})
export class ViewMovementContactComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  private _contactData: ContactModel = new ContactModel();
  movementAddresses: AddressModel[] = [];

  // loading data
  displayLoading: boolean = true;

  @ViewChild('mapMovement', { static: true }) mapMovement: WorldMapMovementComponent;

  // constants
  ContactModel = ContactModel;

  // authenticated user details
  private _authUser: UserModel;

  // quick actions
  quickActions: IV2ActionMenuLabel;

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private contactDataService: ContactDataService,
    private outbreakDataService: OutbreakDataService,
    private authDataService: AuthDataService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this._authUser = this.authDataService.getAuthenticatedUser();

    this.route.params.subscribe((params: { contactId }) => {
      this.outbreakDataService
        .getSelectedOutbreak()
        .subscribe((selectedOutbreak: OutbreakModel) => {
          forkJoin([
            this.contactDataService.getContact(selectedOutbreak.id, params.contactId),
            this.contactDataService.getContactMovement(selectedOutbreak.id, params.contactId)
          ])
            .subscribe((
              [contactData, movementData]: [ContactModel, AddressModel[]]
            ) => {
              // contact data
              this._contactData = contactData;

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
      visible: () => ContactModel.canExportMovementMap(this._authUser),
      menuOptions: [
        // Export map
        {
          label: {
            get: () => 'LNG_PAGE_VIEW_MOVEMENT_CONTACT_EXPORT'
          },
          action: {
            click: () => {
              this.mapMovement.exportMovementMap(EntityType.CONTACT);
            }
          },
          visible: () => ContactModel.canExportMovementMap(this._authUser)
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

    // list page
    if (ContactModel.canList(this._authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    }

    // case breadcrumbs
    if (this._contactData) {
      // case view page
      if (ContactModel.canView(this._authUser)) {
        this.breadcrumbs.push({
          label: this._contactData.name,
          action: {
            link: [`/contacts/${this._contactData.id}/view`]
          }
        });
      }

      // current page
      this.breadcrumbs.push({
        label: 'LNG_PAGE_VIEW_MOVEMENT_CONTACT_TITLE',
        action: null
      });
    }
  }
}

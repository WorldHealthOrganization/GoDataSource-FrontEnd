import { Component, OnInit, ViewChild } from '@angular/core';
import { AddressModel } from '../../../../core/models/address.model';
import { WorldMapMovementComponent } from '../../../../common-modules/world-map-movement/components/world-map-movement/world-map-movement.component';
import { UserModel } from '../../../../core/models/user.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { forkJoin } from 'rxjs';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionMenuLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-view-movement-contact-of-contact',
  templateUrl: './view-movement-contact-of-contact.component.html'
})
export class ViewMovementContactOfContactComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  private _contactOfContactData: ContactOfContactModel = new ContactOfContactModel();
  movementAddresses: AddressModel[] = [];

  // loading data
  displayLoading: boolean = true;

  @ViewChild('mapMovement', { static: true }) mapMovement: WorldMapMovementComponent;

  // constants
  ContactOfContactModel = ContactOfContactModel;

  // authenticated user details
  private _authUser: UserModel;

  // quick actions
  quickActions: IV2ActionMenuLabel;

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private contactsOfContactsDataService: ContactsOfContactsDataService,
    private outbreakDataService: OutbreakDataService,
    private authDataService: AuthDataService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this._authUser = this.authDataService.getAuthenticatedUser();

    this.route.params.subscribe((params: { contactOfContactId }) => {
      this.outbreakDataService
        .getSelectedOutbreak()
        .subscribe((selectedOutbreak: OutbreakModel) => {
          forkJoin([
            this.contactsOfContactsDataService.getContactOfContact(selectedOutbreak.id, params.contactOfContactId),
            this.contactsOfContactsDataService.getContactOfContactMovement(selectedOutbreak.id, params.contactOfContactId)
          ])
            .subscribe((
              [contactOfContactData, movementData]: [ContactOfContactModel, AddressModel[]]
            ) => {
              // contact of contact  data
              this._contactOfContactData = contactOfContactData;

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
      visible: () => ContactOfContactModel.canExportMovementMap(this._authUser),
      menuOptions: [
        // Export map
        {
          label: {
            get: () => 'LNG_PAGE_VIEW_MOVEMENT_CONTACT_OF_CONTACT_EXPORT'
          },
          action: {
            click: () => {
              this.mapMovement.exportMovementMap(EntityType.CONTACT_OF_CONTACT);
            }
          },
          visible: () => ContactOfContactModel.canExportMovementMap(this._authUser)
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
    if (ContactOfContactModel.canList(this._authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        action: {
          link: ['/contacts-of-contacts']
        }
      });
    }

    // case breadcrumbs
    if (this._contactOfContactData) {
      // case view page
      if (ContactOfContactModel.canView(this._authUser)) {
        this.breadcrumbs.push({
          label: this._contactOfContactData.name,
          action: {
            link: [`/contacts-of-contacts/${this._contactOfContactData.id}/view`]
          }
        });
      }

      // current page
      this.breadcrumbs.push({
        label: 'LNG_PAGE_VIEW_MOVEMENT_CONTACT_OF_CONTACT_TITLE',
        action: null
      });
    }
  }
}

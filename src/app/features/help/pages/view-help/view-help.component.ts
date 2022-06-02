import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
  selector: 'app-view-help-item',
  templateUrl: './view-help.component.html',
})
export class ViewHelpComponent extends ViewModifyComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  helpItemData: HelpItemModel = new HelpItemModel();
  itemId: string;
  categoryId: string;

  // authenticated user details
  authUser: UserModel;

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private helpDataService: HelpDataService,
    protected dialogService: DialogService,
    private authDataService: AuthDataService
  ) {
    super(
      route,
      dialogService
    );
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // show loading
    this.showLoadingDialog(false);

    this.route.params
      .subscribe((params: { categoryId, itemId }) => {
        // get item
        this.itemId = params.itemId;
        this.categoryId = params.categoryId;
        this.helpDataService
          .getHelpItem(this.categoryId, this.itemId)
          .subscribe(helpItemData => {
            this.helpItemData = new HelpItemModel(helpItemData);

            // hide loading
            this.hideLoadingDialog();
          });
      });

    // initialize page breadcrumbs
    this.initializeBreadcrumbs();
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs() {
    // reset
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // list page
    this.breadcrumbs.push({
      label: 'LNG_PAGE_GLOBAL_HELP_TITLE',
      action: {
        link: ['/help']
      }
    });

    // current page breadcrumb
    this.breadcrumbs.push({
      label: 'LNG_PAGE_VIEW_HELP_ITEM_TITLE',
      action: null
    });
  }
}

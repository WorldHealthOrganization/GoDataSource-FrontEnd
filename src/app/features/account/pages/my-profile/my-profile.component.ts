import { Component, OnInit } from '@angular/core';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { UserModel, UserRoleModel } from '../../../../core/models/user.model';
import { Observable } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html'
})
export class MyProfileComponent extends ViewModifyComponent implements OnInit {
  // breadcrumbs
  breadcrumbs: BreadcrumbItemModel[] = [
    new BreadcrumbItemModel('LNG_PAGE_MY_PROFILE_TITLE')
  ];

  // constants
  UserModel = UserModel;

  // authenticated user
  authUser: UserModel;

  // user data
  userId: string;
  user: UserModel = new UserModel();

  // role data
  rolesList$: Observable<UserRoleModel[]>;
  outbreaksList$: Observable<OutbreakModel[]>;

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private userRoleDataService: UserRoleDataService,
    private userDataService: UserDataService,
    private authDataService: AuthDataService,
    private outbreakDataService: OutbreakDataService,
    protected dialogService: DialogService
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
    this.authUser = this.authDataService.getAuthenticatedUser();

    // show loading
    this.showLoadingDialog(false);

    // retrieve the User instance
    this.userDataService
      .getUser(this.authUser.id)
      .subscribe((user: UserModel) => {
        this.user = user;

        // hide loading
        this.hideLoadingDialog();
      });

    // get the list of roles to populate the dropdown in UI
    this.rolesList$ = this.userRoleDataService.getRolesList();
    this.outbreaksList$ = this.outbreakDataService.getOutbreaksListReduced();
  }
}

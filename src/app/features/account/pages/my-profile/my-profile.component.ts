import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { UserModel } from '../../../../core/models/user.model';
import { Observable } from 'rxjs/Observable';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';

@Component({
    selector: 'app-my-profile',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './my-profile.component.html',
    styleUrls: ['./my-profile.component.less']
})
export class MyProfileComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_MY_PROFILE_TITLE'),
    ];

    // authenticated user
    authUser: UserModel;

    userId: string;
    user: UserModel = new UserModel();

    rolesList$: Observable<UserRoleModel[]>;
    outbreaksList$: Observable<OutbreakModel[]>;

    constructor(
        protected route: ActivatedRoute,
        private userRoleDataService: UserRoleDataService,
        private userDataService: UserDataService,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService
    ) {
        super(route);
    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();
        // retrieve the User instance
        this.userDataService
            .getUser(this.authUser.id)
            .subscribe((user: UserModel) => {
                this.user = user;
            });

        // get the list of roles to populate the dropdown in UI
        this.rolesList$ = this.userRoleDataService.getRolesList();
        this.outbreaksList$ = this.outbreakDataService.getOutbreaksList();
    }

}

import { Component, ViewEncapsulation } from '@angular/core';

import { AuthDataService } from '../../services/data/auth.data.service';
import { UserModel } from '../../models/user.model';
import { PERMISSION } from '../../models/user-role.model';

@Component({
    selector: 'app-sidenav',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './sidenav.component.html',
    styleUrls: ['./sidenav.component.less']
})
export class SidenavComponent {

    // authenticated user
    authUser: UserModel;

    // Nav items with configuration
    items = [
        {
            label: 'Admin',
            icon: 'admin',
            children: [
                {
                    label: 'System Configuration',
                    permissions: [PERMISSION.READ_SYS_CONFIG]
                },
                {
                    label: 'Users',
                    permissions: [PERMISSION.READ_USER_ACCOUNT],
                    link: 'users'
                }
            ]
        },
        {
            label: 'Outbreaks',
            icon: 'outbreaks',
            permission: [PERMISSION.READ_OUTBREAK],
            children: [
                {
                    label: 'Outbreak List'
                },
                {
                    label: 'Templates'
                },
                {
                    label: 'Teams',
                    permission: [PERMISSION.READ_TEAM]
                },
                {
                    label: 'Clusters'
                }
            ]
        },
        {
            label: 'Contacts',
            icon: 'contacts'
        },
        {
            label: 'Cases',
            icon: 'cases'
        },
        {
            label: 'Events',
            icon: 'events'
        },
        {
            label: 'Duplicated Records',
            icon: 'duplicate'
        },
        {
            label: 'Account',
            icon: 'account'
        }
    ];

    constructor(
        private authDataService: AuthDataService
    ) {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
    }

}

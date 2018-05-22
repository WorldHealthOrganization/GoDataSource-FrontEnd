import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UserRoleDataService } from '../../../../core/services/data/user-role.data.service';
import { Observable } from 'rxjs/Observable';
import { UserRoleModel } from '../../../../core/models/user-role.model';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';

@Component({
    selector: 'app-roles-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './roles-list.component.html',
    styleUrls: ['./roles-list.component.less']
})
export class RolesListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Roles', '.', true)
    ];

    rolesListObs: Observable<UserRoleModel[]>;

    constructor(
        private userRoleDataService: UserRoleDataService
    ) {
    }

    ngOnInit() {
        this.rolesListObs = this.userRoleDataService.getRolesList();
    }
}

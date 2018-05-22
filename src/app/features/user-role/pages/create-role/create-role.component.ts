import { Component, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item-model.component';

@Component({
    selector: 'app-create-role',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-role.component.html',
    styleUrls: ['./create-role.component.less']
})
export class CreateRoleComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Roles', '..'),
        new BreadcrumbItemModel('Create New Role', '.', true)
    ];

}

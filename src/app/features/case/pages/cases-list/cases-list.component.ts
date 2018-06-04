import { Component, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';

@Component({
    selector: 'app-cases-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './cases-list.component.html',
    styleUrls: ['./cases-list.component.less']
})
export class CasesListComponent {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Cases', '.', true)
    ];

}

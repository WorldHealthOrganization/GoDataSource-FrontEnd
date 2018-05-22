import { Component, Input, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from './breadcrumb-item.model';

@Component({
    selector: 'app-breadcrumbs',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './breadcrumbs.component.html',
    styleUrls: ['./breadcrumbs.component.less']
})
export class BreadcrumbsComponent {

    // Breadcrumbs items
    @Input() items: BreadcrumbItemModel;

}

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';

@Component({
    selector: 'app-system-config-main',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit {
    /**
     * Breadcrumbs
     */
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_MAIN_SYSTEM_CONFIG_TITLE', '.', true)
    ];

    // #TODO
    constructor(
    ) {}

    ngOnInit() {
        // #TODO
    }
}

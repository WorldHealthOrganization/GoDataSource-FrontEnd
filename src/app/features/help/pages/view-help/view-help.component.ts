import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';

@Component({
    selector: 'app-view-help-item',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-help.component.html',
    styleUrls: ['./view-help.component.less']
})
export class ViewHelpComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GLOBAL_HELP_TITLE', '/help'),
        new BreadcrumbItemModel(
            'LNG_PAGE_VIEW_HELP_ITEM_TITLE',
            '.',
            true,
            {},
            {}
        )
    ];

    helpItemData: HelpItemModel = new HelpItemModel();
    itemId: string;
    categoryId: string;

    constructor(
        protected route: ActivatedRoute,
        private helpDataService: HelpDataService
    ) {
        super(route);
    }

    ngOnInit() {
        this.route.params
            .subscribe((params: { categoryId, itemId }) => {
                // get item
                this.itemId = params.itemId;
                this.categoryId = params.categoryId;
                this.helpDataService
                    .getHelpItem(this.categoryId, this.itemId)
                    .subscribe(helpItemData => {
                        this.helpItemData = new HelpItemModel(helpItemData);
                    });
            });
    }
}

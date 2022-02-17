import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
  selector: 'app-view-help-item',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './view-help.component.html',
  styleUrls: ['./view-help.component.less']
})
export class ViewHelpComponent extends ViewModifyComponent implements OnInit {
  // breadcrumbs
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

  /**
     * Constructor
     */
  constructor(
    protected route: ActivatedRoute,
    private helpDataService: HelpDataService,
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
  }
}

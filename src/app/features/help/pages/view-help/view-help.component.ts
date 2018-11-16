import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'app-view-help-item',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-help.component.html',
    styleUrls: ['./view-help.component.less']
})
export class ViewHelpComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GLOBAL_HELP_TITLE', '/help')
    ];

    helpItemData: HelpItemModel = new HelpItemModel();
    categoryId: string;
    itemId: string;
    selectedCategory: HelpCategoryModel;

    helpCategoriesList$: Observable<HelpCategoryModel[]>;

    // authenticated user
    authUser: UserModel;

    constructor(
        protected route: ActivatedRoute,
        private helpDataService: HelpDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router,
        private authDataService: AuthDataService,
        private i18nService: I18nService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.helpCategoriesList$ = this.helpDataService.getHelpCategoryList();

        this.route.params
            .subscribe((params: { categoryId, itemId }) => {
                this.categoryId = params.categoryId;
                this.itemId = params.itemId;

                this.helpDataService
                    .getHelpCategory(this.categoryId)
                    .subscribe((category) => {
                        this.selectedCategory = category;
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(
                                'LNG_PAGE_VIEW_HELP_ITEM_TITLE',
                                '.',
                                true,
                                {},
                                {}
                            )
                        );
                        // get item
                        this.helpDataService
                            .getHelpItem(this.categoryId, this.itemId)
                            .subscribe(helpItemData => {
                                this.helpItemData = new HelpItemModel(helpItemData);
                            });
                    });
            });
    }

    /**
     * Check if we have write access to help
     * @returns {boolean}
     */
    hasHelpWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_HELP);
    }
}

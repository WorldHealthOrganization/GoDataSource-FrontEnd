import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ImportDataExtension } from '../../components/import-data/model';
import { LanguageModel } from '../../../../core/models/language.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';

@Component({
    selector: 'app-import-language-tokens',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-language-tokens.component.html',
    styleUrls: ['./import-language-tokens.component.less']
})
export class ImportLanguageTokensComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    authUser: UserModel;

    allowedExtensions: string[] = [
        ImportDataExtension.XLSX
    ];

    importFileUrl: string;

    /**
     * Constructor
     */
    constructor(
        private cacheService: CacheService,
        private router: Router,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        this.route.params
            .subscribe((params: { languageId }) => {
                // set import URL
                this.importFileUrl = `/languages/${params.languageId}/language-tokens/import`;
            });

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // update breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (LanguageModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_LANGUAGES_TITLE', '/languages')
            );
        }

        // import breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_IMPORT_LANGUAGE_TOKENS_TITLE',
                '.',
                true
            )
        );
    }

    /**
     * Finished import
     */
    finished() {
        this.cacheService.remove(CacheKey.LANGUAGES);
        this.router.navigate(['/languages']);
    }
}

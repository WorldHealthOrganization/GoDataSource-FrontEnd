import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { LanguageDataService } from '../../../../core/services/data/language.data.service';
import { ImportDataExtension } from '../../components/import-data/model';

@Component({
    selector: 'app-import-language-tokens',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-language-tokens.component.html',
    styleUrls: ['./import-language-tokens.component.less']
})
export class ImportLanguageTokensComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel(
            'LNG_PAGE_LIST_LANGUAGES_TITLE',
            '/languages'
        ),
        new BreadcrumbItemModel(
            'LNG_PAGE_IMPORT_LANGUAGE_TOKENS_TITLE',
            '',
            true
        )
    ];

    allowedExtensions: string[] = [
        ImportDataExtension.XLSX
    ];

    importFileUrl: string;

    /**
     * Constructor
     * @param router
     * @param route
     */
    constructor(
        private cacheService: CacheService,
        private router: Router,
        protected route: ActivatedRoute,
        private languageDataService: LanguageDataService
    ) {}

    ngOnInit() {
        this.route.params
            .subscribe((params: { languageId }) => {
                // set import URL
                this.importFileUrl = `/languages/${params.languageId}/language-tokens/import`;
            });
    }

    finished() {
        this.cacheService.remove(CacheKey.LANGUAGES);
        this.router.navigate(['/languages']);
    }
}

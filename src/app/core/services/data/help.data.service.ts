import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { HelpCategoryModel } from '../../models/help-category.model';
import { HelpItemModel } from '../../models/help-item.model';
import * as _ from 'lodash';
import { CacheKey, CacheService } from '../helper/cache.service';
import { map } from 'rxjs/operators';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class HelpDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private cacheService: CacheService
    ) {}

    /**
     * Retrieve the list of Help Categories
     * @returns {Observable<HelpCategoryModel[]>}
     */
    getHelpCategoryList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<HelpCategoryModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`help-categories?filter=${filter}`),
            HelpCategoryModel
        );
    }

    /**
     * Return count of help categories
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    getHelpCategoryCount(
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`help-categories/count?where=${whereFilter}`);
    }

    /**
     * Add new Help Category
     * @param helpCategoryData
     * @returns {Observable<any>}
     */
    createHelpCategory(helpCategoryData): Observable<any> {
        return this.http.post(`help-categories`, helpCategoryData);
    }

    /**
     * Retrieve a category
     * @param {string} categoryId
     * @returns {Observable<HelpCategoryModel>}
     */
    getHelpCategory(categoryId: string): Observable<HelpCategoryModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`help-categories/${categoryId}`),
            HelpCategoryModel
        );
    }

    /**
     * Modify an existing category
     * @param {string} categoryId
     * @param helpCategoryData
     * @returns {Observable<HelpCategoryModel>}
     */
    modifyHelpCategory(categoryId: string, helpCategoryData): Observable<HelpCategoryModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`help-categories/${categoryId}`, helpCategoryData),
            HelpCategoryModel
        );
    }

    /**
     * Delete an existing Help Category
     * @param {string} categoryId
     * @returns {Observable<any>}
     */
    deleteHelpCategory(categoryId: string): Observable<any> {
        return this.http.delete(`help-categories/${categoryId}`);
    }

    /**
     * Get the list of help items
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<HelpItemModel[]>}
     */
    getHelpItemsList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<HelpItemModel[]> {
        queryBuilder.filter.where({approved: true}, true);
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`help-items?filter=${filter}`),
            HelpItemModel
        );
    }

    /**
     * Get the list of help items
     * @param {RequestQueryBuilder} queryBuilder
     * @param searchedTerm
     * @returns {Observable<HelpItemModel[]>}
     */
    getHelpItemsListSearch(
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder(),
        searchedTerm: string
    ): Observable<HelpItemModel[]> {
        let filter = queryBuilder.buildQuery(false);
        // add condition for search term - this needs to be on the first level of where (not in 'and')
        filter.where.token = { $text: { search: searchedTerm } };
        filter = JSON.stringify(filter);
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`help-categories/search-help-items?filter=${filter}`)
                .pipe(
                    map((res) => _.get(res, 'items', []))
                ),
            HelpItemModel
        );
    }

    /**
     * Get the list of help items
     * @param {string} categoryId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<HelpItemModel[]>}
     */
    getHelpItemsCategoryList(categoryId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<HelpItemModel[]> {
        queryBuilder.include('user', true);
        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`help-categories/${categoryId}/help-items?filter=${filter}`),
            HelpItemModel
        );
    }

    /**
     * Return count of help items from a category
     * @param {string} categoryId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    getHelpItemsCategoryCount(
        categoryId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`help-categories/${categoryId}/help-items/count?where=${whereFilter}`);
    }

    /**
     * Create Help Item
     * @param {string} categoryId
     * @param helpCategoryData
     * @returns {Observable<any>}
     */
    createHelpItem(categoryId: string, helpCategoryData: any): Observable<any> {
        return this.http.post(`help-categories/${categoryId}/help-items`, helpCategoryData);
    }

    /**
     * Get help Item
     * @param {string} categoryId
     * @param {string} itemId
     * @returns {Observable<HelpItemModel>}
     */
    getHelpItem(categoryId: string, itemId: string): Observable<HelpItemModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`help-categories/${categoryId}/help-items/${itemId}`),
            HelpItemModel
        );
    }

    /**
     * Modify help item
     * @param {string} categoryId
     * @param {string} itemId
     * @param helpItemData
     * @returns {Observable<HelpItemModel>}
     */
    modifyHelpItem(categoryId: string, itemId: string, helpItemData): Observable<HelpItemModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`help-categories/${categoryId}/help-items/${itemId}`, helpItemData),
            HelpItemModel
        );
    }

    /**
     * Delete help item
     * @param {string} categoryId
     * @param {string} itemId
     * @returns {Observable<any>}
     */
    deleteHelpItem(categoryId: string, itemId: string): Observable<any> {
        return this.http.delete(`help-categories/${categoryId}/help-items/${itemId}`);
    }

    /**
     * Approve help item
     * @param {string} categoryId
     * @param {string} itemId
     * @returns {Observable<any>}
     */
    approveHelpItem(categoryId: string, itemId: string): Observable<any> {
        return this.http.post(`help-categories/${categoryId}/help-items/${itemId}/approve`, {});
    }

    /**
     * Search for context specific help
     * @param {string} url
     */
    getContextHelpItems(url: string): Observable<string[]> {
        return new Observable((observer) => {
            // get help items list from cache
            const helpItemsList = this.cacheService.get(CacheKey.HELP_ITEMS);
            if (helpItemsList) {
                const helpItems = this.checkContextSensitiveHelp(url, helpItemsList);
                observer.next(helpItems);
                observer.complete();
            } else {
                const qB = new RequestQueryBuilder();
                qB.filter.where({approved: true});
                this.getHelpItemsList(qB).subscribe((items) => {
                    // cache the list
                    this.cacheService.set(CacheKey.HELP_ITEMS, items);
                    const helpItems = this.checkContextSensitiveHelp(url, items);
                    observer.next(helpItems);
                    observer.complete();
                });
            }
        });
    }

    /**
     * Check if the page is matched and return the help items
     * @param {string} url
     * @param {HelpItemModel[]} items
     * @returns {any[]}
     */
    checkContextSensitiveHelp(url: string, items: HelpItemModel[]) {
        let helpItems = [];
        if (url) {
            helpItems = _.filter(items, (item) => {
                const pageCheck = (item.page) ? item.page.replace('*', '[^\\/]+') : '';
                return (new RegExp(pageCheck)).test(url) && pageCheck;
            });
        }
        return helpItems;
    }
}


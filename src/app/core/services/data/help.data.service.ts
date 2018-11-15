import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { HelpCategoryModel } from '../../models/help-category.model';
import { HelpItemModel } from '../../models/help-item.model';
import { FollowUpModel } from '../../models/follow-up.model';

@Injectable()
export class HelpDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

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
     * @returns {Observable<any>}
     */
    modifyHelpCategory(categoryId: string, helpCategoryData): Observable<any> {
        return this.http.put(`help-categories/${categoryId}`, helpCategoryData);
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
        queryBuilder.include('category');
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`help-items?filter=${filter}`),
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
        queryBuilder.include('user');
        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`help-categories/${categoryId}/help-items?filter=${filter}`),
            HelpItemModel
        );
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
     * @returns {Observable<any>}
     */
    modifyHelpItem(categoryId: string, itemId: string, helpItemData): Observable<any> {
        return this.http.put(`help-categories/${categoryId}/help-items/${itemId}`, helpItemData);
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


}


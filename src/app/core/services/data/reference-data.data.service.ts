import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../models/reference-data.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import 'rxjs/add/operator/mergeMap';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { UserModel } from '../../models/user.model';
import { I18nService } from '../helper/i18n.service';
import { LabelValuePair } from '../../models/label-value-pair';

@Injectable()
export class ReferenceDataDataService {

    categoriesList$: Observable<any>;
    referenceDataListMap$: Observable<any>;

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private cacheService: CacheService,
        private i18nService: I18nService
    ) {
        this.categoriesList$ = this.http.get(`reference-data/available-categories`).share();

        // retrieve categories
        this.referenceDataListMap$ = this.getCategoriesList()
            .mergeMap((categories: ReferenceDataCategoryModel[]) => {
                return this.modelHelper.mapObservableListToModel(
                    this.http.get(`reference-data`),
                    ReferenceDataEntryModel
                ).map((referenceData: ReferenceDataEntryModel[]) => {
                    // map entries by category id
                    const entriesMap = _.groupBy(referenceData, 'categoryId');

                    // group entries by category
                    return _.map(categories, (category: ReferenceDataCategoryModel) => {
                        // find all entries for current category
                        category.entries = entriesMap[category.id];

                        return category;
                    });
                }).do((referenceDataResult) => {
                    this.cacheService.set(CacheKey.REFERENCE_DATA, referenceDataResult);
                });
            }).share();
    }

    /**
     * Retrieve the list of Reference Data Categories
     * @returns {Observable<ReferenceDataCategoryModel[]>}
     */
    getCategoriesList(): Observable<ReferenceDataCategoryModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.categoriesList$,
            ReferenceDataCategoryModel
        );
    }

    /**
     * Retrieve the list of Reference Data Entries, grouped by categories
     * @returns {Observable<ReferenceDataCategoryModel[]>}
     */
    getReferenceData(): Observable<ReferenceDataCategoryModel[]> {
        // get reference data from cache
        const referenceDataCache = this.cacheService.get(CacheKey.REFERENCE_DATA);
        if (referenceDataCache) {
            return Observable.of(referenceDataCache);
        } else {
            // get reference data entries from API
            return this.referenceDataListMap$;
        }
    }

    /**
     * Retrieve the list of Reference Data Entries for a specific Category
     * @param {ReferenceDataCategory} categoryId
     * @returns {Observable<ReferenceDataCategoryModel>}
     */
    getReferenceDataByCategory(categoryId: ReferenceDataCategory): Observable<ReferenceDataCategoryModel> {
        // get reference data entries
        return this.getReferenceData()
            .map((entries) => {
                // find the category
                return _.find(entries, {id: categoryId});
            });
    }

    /**
     * Retrieve the list of Reference Data Entries for a specific Category mapped as LabelValuePair
     * @param {ReferenceDataCategory} categoryId
     * @returns {Observable<ReferenceDataCategoryModel>}
     */
    getReferenceDataByCategoryAsLabelValue(categoryId: ReferenceDataCategory): Observable<LabelValuePair[]> {
        return this.getReferenceDataByCategory(categoryId)
            .map((data: ReferenceDataCategoryModel) => {
                return _.map(data.entries, (entry: ReferenceDataEntryModel) =>
                    new LabelValuePair(
                        entry.value,
                        entry.id,
                        !entry.active
                    )
                );
            });
    }

    /**
     * Retrieve a Reference Data entry
     * @param {string} entryId
     * @returns {Observable<ReferenceDataEntryModel>}
     */
    getEntry(entryId: string): Observable<ReferenceDataEntryModel> {
        const qb = new RequestQueryBuilder();
        // include roles and permissions in response
        qb.include('category');

        const filter = qb.buildQuery();

        return this.modelHelper.mapObservableToModel(
            this.http.get(`reference-data/${entryId}?filter=${filter}`),
            ReferenceDataEntryModel
        );
    }

    /**
     * Create a new Reference Data entry
     * @param entry
     * @returns {Observable<UserModel[]>}
     */
    createEntry(entry): Observable<any> {
        return this.http.post(`reference-data`, entry)
            .mergeMap(() => {
                // invalidate list cache
                this.clearReferenceDataCache();

                // re-load language tokens
                return this.i18nService.loadUserLanguage();
            });
    }

    /**
     * Modify an existing Reference Data entry
     * @param {string} entryId
     * @param entryData
     * @returns {Observable<any>}
     */
    modifyEntry(entryId: string, entryData): Observable<any> {
        return this.http.put(`reference-data/${entryId}`, entryData)
            .mergeMap(() => {
                // invalidate list cache
                this.clearReferenceDataCache();

                // re-load language tokens
                return this.i18nService.loadUserLanguage();
            });
    }

    /**
     * Delete an existing Reference Data entry
     * @param {string} entryId
     * @returns {Observable<any>}
     */
    deleteEntry(entryId: string): Observable<any> {
        return this.http.delete(`reference-data/${entryId}`)
            .mergeMap(() => {
                // invalidate list cache
                this.clearReferenceDataCache();

                // re-load language tokens
                return this.i18nService.loadUserLanguage();
            });
    }

    /**
     * Clear reference data cache
     */
    clearReferenceDataCache() {
        this.cacheService.remove(CacheKey.REFERENCE_DATA);
        this.cacheService.remove(CacheKey.REFERENCE_DATA_GLOSSARY);
    }

    /**
     * Return a map of glossary terms
     */
    getGlossaryItems(): Observable<any> {
        const glossaryDataCache = this.cacheService.get(CacheKey.REFERENCE_DATA_GLOSSARY);
        if (glossaryDataCache) {
            return Observable.of(glossaryDataCache);
        } else {
            return this.getReferenceDataByCategory(ReferenceDataCategory.GLOSSARY)
                .map((data) => {
                    // map data
                    const glossaryMap = {};
                    _.forEach(data.entries, (entry) => {
                        const entryValue = _.camelCase(this.i18nService.instant(entry.value)).toLowerCase();
                        glossaryMap[entryValue] = entry.description;
                    });
                    // set cache
                    this.cacheService.set(CacheKey.REFERENCE_DATA_GLOSSARY, glossaryMap);
                    // finished
                    return glossaryMap;
                });
        }
    }
}


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../models/reference-data.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import * as _ from 'lodash';
import { RequestQueryBuilder, RequestSortDirection } from '../../helperClasses/request-query-builder';
import { LabelValuePair } from '../../models/label-value-pair';
import { map, mergeMap, share, tap } from 'rxjs/operators';
import { I18nService } from '../helper/i18n.service';

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
        this.categoriesList$ = this.http.get(`reference-data/available-categories`).pipe(share());

        // retrieve categories
        this.referenceDataListMap$ = this.getCategoriesList()
            .pipe(
                mergeMap((categories: ReferenceDataCategoryModel[]) => {
                    return this.getEntries()
                        .pipe(
                            map((referenceData: ReferenceDataEntryModel[]) => {
                                // map entries by category id
                                const entriesMap = _.groupBy(referenceData, 'categoryId');

                                // group entries by category
                                return _.map(categories, (category: ReferenceDataCategoryModel) => {
                                    // find all entries for current category
                                    category.entries = entriesMap[category.id];

                                    return category;
                                });
                            }),
                            tap((referenceDataResult) => {
                                this.cacheService.set(CacheKey.REFERENCE_DATA, referenceDataResult);
                            })
                        );
                }),
                share()
            );
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
            return of(referenceDataCache);
        } else {
            // get reference data entries from API
            return this.referenceDataListMap$;
        }
    }

    /**
     * Retrieve the list of Reference Data Entries for a specific Category
     * @param {string} categoryId
     * @returns {Observable<ReferenceDataCategoryModel>}
     */
    getReferenceDataByCategory(categoryId: string): Observable<ReferenceDataCategoryModel> {
        // get reference data entries
        return this.getReferenceData()
            .pipe(
                map((entries) => {
                    // find the category
                    return _.find(entries, {id: categoryId});
                })
            );
    }

    /**
     * Retrieve the list of Reference Data Entries for a specific Category mapped as LabelValuePair
     * @param {ReferenceDataCategory} categoryId
     * @returns {Observable<ReferenceDataCategoryModel>}
     */
    getReferenceDataByCategoryAsLabelValue(categoryId: ReferenceDataCategory): Observable<LabelValuePair[]> {
        return this.getReferenceDataByCategory(categoryId)
            .pipe(
                map((data: ReferenceDataCategoryModel) => {
                    return _.map(_.get(data, 'entries'), (entry: ReferenceDataEntryModel) =>
                        new LabelValuePair(
                            entry.value,
                            entry.id,
                            !entry.active,
                            entry.active,
                            entry.iconUrl
                        )
                    );
                })
            );
    }

    getEntries(): Observable<ReferenceDataEntryModel[]> {
        // sort entries
        const qb = new RequestQueryBuilder();
        qb.sort.by('order', RequestSortDirection.ASC);
        const filter = qb.buildQuery();

        // map to model
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`reference-data?filter=${filter}`),
            ReferenceDataEntryModel
        )
            .pipe(
                map((entries: ReferenceDataEntryModel[]) => {
                    return entries
                        .sort((a, b) => {
                            if (
                                !_.isNumber(a.order) &&
                                !_.isNumber(b.order)
                            ) {
                                // order by name
                                return (this.i18nService.instant(a.value) <= this.i18nService.instant(b.value)) ? -1 : 1;
                            }

                            if (!_.isNumber(a.order)) {
                                return 1;
                            }

                            if (!_.isNumber(b.order)) {
                                return -1;
                            }

                            // order by 'order' field
                            return a.order - b.order;
                        });
                })
            );
    }

    /**
     * Retrieve a Reference Data entry
     * @param {string} entryId
     * @returns {Observable<ReferenceDataEntryModel>}
     */
    getEntry(entryId: string): Observable<ReferenceDataEntryModel> {
        const qb = new RequestQueryBuilder();
        // include roles and permissions in response
        qb.include('category', true);

        const filter = qb.buildQuery();

        return this.modelHelper.mapObservableToModel(
            this.http.get(`reference-data/${entryId}?filter=${filter}`),
            ReferenceDataEntryModel
        );
    }

    /**
     * Create a new Reference Data entry
     * @param entry
     * @returns {Observable<any>}
     */
    createEntry(entry): Observable<any> {
        return this.http.post(`reference-data`, entry)
            .pipe(
                tap(() => {
                    // invalidate list cache
                    this.clearReferenceDataCache();
                })
            );
    }

    /**
     * Modify an existing Reference Data entry
     * @param {string} entryId
     * @param entryData
     * @returns {Observable<ReferenceDataEntryModel>}
     */
    modifyEntry(entryId: string, entryData): Observable<ReferenceDataEntryModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`reference-data/${entryId}`, entryData)
                .pipe(
                    tap(() => {
                        // invalidate list cache
                        this.clearReferenceDataCache();
                    })
                ),
            ReferenceDataEntryModel
        );
    }

    /**
     * Delete an existing Reference Data entry
     * @param {string} entryId
     * @returns {Observable<any>}
     */
    deleteEntry(entryId: string): Observable<any> {
        return this.http.delete(`reference-data/${entryId}`)
            .pipe(
                tap(() => {
                    // invalidate list cache
                    this.clearReferenceDataCache();
                })
            );
    }

    /**
     * Clear reference data cache
     */
    clearReferenceDataCache() {
        this.cacheService.remove(CacheKey.REFERENCE_DATA);
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../models/reference-data.model';
import { CacheKey, CacheService } from '../helper/cache.service';
import * as _ from 'lodash';
import { RequestQueryBuilder, RequestSortDirection } from '../../helperClasses/request-query-builder';
import { map, mergeMap, share, tap } from 'rxjs/operators';
import { I18nService } from '../helper/i18n.service';
import { IBasicCount } from '../../models/basic-count.interface';
import { IGeneralAsyncValidatorResponse } from '../../../shared/forms-v2/validators/general-async-validator.directive';

@Injectable()
export class ReferenceDataDataService {
  // data
  categoriesList$: Observable<any>;
  referenceDataListMap$: Observable<any>;

  /**
   * Constructor
   */
  constructor(
    private http: HttpClient,
    private modelHelper: ModelHelperService,
    private cacheService: CacheService,
    private i18nService: I18nService
  ) {
    this.categoriesList$ = this.http
      .get('reference-data/available-categories')
      .pipe(
        map((categories: any[]) => {
          return (categories || []).sort((item1: ReferenceDataCategoryModel, item2: ReferenceDataCategoryModel) => {
            return (item1.name ? this.i18nService.instant(item1.name) : '').localeCompare(item2.name ? this.i18nService.instant(item2.name) : '');
          });
        }),
        share()
      );

    // retrieve categories
    this.referenceDataListMap$ = this.getCategoriesList()
      .pipe(
        mergeMap((categories: ReferenceDataCategoryModel[]) => {
          return this.getEntries(new RequestQueryBuilder())
            .pipe(
              map((referenceData: ReferenceDataEntryModel[]) => {
                // map entries by category id
                const entriesMap: {
                  [categoryId: string]: {
                    entries: ReferenceDataEntryModel[],
                    systemWideCount: number
                  }
                } = {};
                referenceData.forEach((entry) => {
                  // not initialized ?
                  if (!entriesMap[entry.categoryId]) {
                    entriesMap[entry.categoryId] = {
                      entries: [],
                      systemWideCount: 0
                    };
                  }

                  // add it to the lis
                  entriesMap[entry.categoryId].entries.push(entry);

                  // count system wides
                  if (entry.isSystemWide) {
                    entriesMap[entry.categoryId].systemWideCount++;
                  }
                });

                // group entries by category
                return _.map(categories, (category: ReferenceDataCategoryModel) => {
                  // find all entries for current category
                  if (entriesMap[category.id]) {
                    category.entries = entriesMap[category.id].entries;
                    category.systemWideCount = entriesMap[category.id].systemWideCount;
                  } else {
                    category.entries = [];
                    category.systemWideCount = 0;
                  }

                  // finished
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
   */
  getCategoriesList(): Observable<ReferenceDataCategoryModel[]> {
    return this.modelHelper.mapObservableListToModel(
      this.categoriesList$,
      ReferenceDataCategoryModel
    );
  }

  /**
   * Retrieve the list of Reference Data Entries, grouped by categories
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
   */
  getReferenceDataByCategory(categoryId: string): Observable<ReferenceDataCategoryModel> {
    // get reference data entries
    return this.getReferenceData()
      .pipe(
        map((entries) => {
          // find the category
          return _.find(entries, { id: categoryId });
        })
      );
  }

  /**
   * Retrieve reference data entries
   */
  getEntries(
    queryBuilder: RequestQueryBuilder
  ): Observable<ReferenceDataEntryModel[]> {
    // create query
    const qb = new RequestQueryBuilder();

    // merge our request
    qb.merge(queryBuilder);

    // sort entries
    qb.sort.by('order', RequestSortDirection.ASC);

    // retrieve created user & modified user information
    qb.include('createdByUser', true);
    qb.include('updatedByUser', true);

    // build filter
    const filter = qb.buildQuery();

    // map to model
    return this.modelHelper.mapObservableListToModel(
      this.http.get(`reference-data?filter=${filter}`),
      ReferenceDataEntryModel
    );
  }

  /**
   * Retrieve a Reference Data entry
   */
  getEntry(
    entryId: string,
    retrieveCreatedUpdatedBy?: boolean
  ): Observable<ReferenceDataEntryModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.get(`reference-data/${entryId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`),
      ReferenceDataEntryModel
    );
  }

  /**
   * Create a new Reference Data entry
   */
  createEntry(entry): Observable<ReferenceDataEntryModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.post('reference-data', entry)
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
   * Modify an existing Reference Data entry
   */
  modifyEntry(
    entryId: string,
    entryData,
    retrieveCreatedUpdatedBy?: boolean
  ): Observable<ReferenceDataEntryModel> {
    return this.modelHelper.mapObservableToModel(
      this.http.put(`reference-data/${entryId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, entryData)
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

  /**
   * Retrieve the number of reference data items
   */
  getReferenceDataItemsCount(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<IBasicCount> {
    const whereFilter = queryBuilder.filter.generateCondition(true);
    return this.http.get(`reference-data/count?where=${whereFilter}`);
  }

  /**
   * Check if code of reference data item is unique
   */
  checkCodeUniqueness(
    code: string,
    id?: string
  ): Observable<boolean | IGeneralAsyncValidatorResponse> {
    // construct query
    const qb: RequestQueryBuilder = new RequestQueryBuilder();
    qb.filter.byEquality(
      'code',
      code,
      true,
      true
    );

    // exclude current item
    if (id) {
      qb.filter.where({
        id: {
          neq: id
        }
      });
    }

    // check if we have duplicates
    return this.getReferenceDataItemsCount(qb)
      .pipe(
        map((countData: { count: number }) => {
          return !countData.count ?
            true : {
              isValid: false,
              errMsg: 'LNG_FORM_VALIDATION_ERROR_REF_DATA_ITEM_CODE_NOT_UNIQUE'
            };
        })
      );
  }

  /**
   * Retrieve reference data items for per disease categories
   */
  getReferenceDataItemsPerDisease(retrieveEntries: boolean): Observable<ReferenceDataCategoryModel[]> {
    return this.http
      .get('reference-data/available-categories-per-disease')
      .pipe(
        mergeMap((categories: ReferenceDataCategoryModel[]) => {
          // no need to retrieve entries ?
          if (!retrieveEntries) {
            return of(categories);
          }

          // retrieve only the items from our categories
          const qb = new RequestQueryBuilder();
          qb.filter.bySelect(
            'categoryId',
            categories.map((item) => item.id),
            false,
            null
          );

          // retrieve data
          return this.getEntries(qb)
            .pipe(
              map((referenceData: ReferenceDataEntryModel[]) => {
                // map entries by category id
                const entriesMap = _.groupBy(referenceData, 'categoryId');
                categories.forEach((category) => {
                  // find all entries for current category
                  category.entries = entriesMap[category.id] ?
                    entriesMap[category.id] :
                    [];
                });

                // finished
                return categories;
              })
            );
        })
      );
  }
}

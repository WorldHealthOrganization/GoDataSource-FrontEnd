import { Observable, of } from 'rxjs';
import { ReferenceDataDataService } from './reference-data.data.service';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../models/reference-data.model';

const CATEGORIES = [];
const ENTRIES = [];

export class ReferenceDataDataServiceMock extends ReferenceDataDataService {
    getCategoriesList(): Observable<ReferenceDataCategoryModel[]> {
        return of(
            CATEGORIES.map((category) => new ReferenceDataCategoryModel(category))
        );
    }

    getEntries(): Observable<ReferenceDataEntryModel[]> {
        return of(
            ENTRIES.map((entry) => new ReferenceDataEntryModel(entry))
        );
    }
}

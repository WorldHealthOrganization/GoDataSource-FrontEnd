import { Observable } from 'rxjs/Observable';
import { ReferenceDataDataService } from './reference-data.data.service';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../models/reference-data.model';

const CATEGORIES = [];
const ENTRIES = [];

export class ReferenceDataDataServiceMock extends ReferenceDataDataService {
    getCategoriesList(): Observable<ReferenceDataCategoryModel[]> {
        return Observable.of(
            CATEGORIES.map((category) => new ReferenceDataCategoryModel(category))
        );
    }

    getEntries(): Observable<ReferenceDataEntryModel[]> {
        return Observable.of(
            ENTRIES.map((entry) => new ReferenceDataEntryModel(entry))
        );
    }
}

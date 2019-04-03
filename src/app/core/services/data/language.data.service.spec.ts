import { Observable, of } from 'rxjs';
import { LanguageDataService } from './language.data.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { LanguageModel } from '../../models/language.model';

const LANGUAGES = [];

export class LanguageDataServiceMock extends LanguageDataService {
    getLanguagesList(qb: RequestQueryBuilder = null): Observable<LanguageModel[]> {
        return of(
            LANGUAGES.map((language) => new LanguageModel(language))
        );
    }
}

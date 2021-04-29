import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { ExportFieldsGroupModel } from '../../models/export-fields-group.model';

@Injectable()
export class ExportFieldsGroupsDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve export fields group
     * @returns {Observable<ExportFieldsGroupModel>}
     */
    getExportFieldsGroups(model: string): Observable<ExportFieldsGroupModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/export-fields-group?model=${model}`),
            ExportFieldsGroupModel
        );
    }
}


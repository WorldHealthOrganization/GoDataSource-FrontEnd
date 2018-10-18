import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { AttachmentModel } from '../../models/attachment.model';

@Injectable()
export class AttachmentDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve Attachment of an Outbreak
     * @param {string} outbreakId
     * @param {string} attachmentId
     * @returns {Observable<AttachmentModel>}
     */
    getAttachment(outbreakId: string, attachmentId: string): Observable<AttachmentModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/attachments/${attachmentId}`),
            AttachmentModel
        );
    }

    /**
     * Delete an existing Attachment of an Outbreak
     * @param {string} outbreakId
     * @param {string} attachmentId
     * @returns {Observable<any>}
     */
    deleteAttachment(outbreakId: string, attachmentId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/attachments/${attachmentId}`);
    }
}


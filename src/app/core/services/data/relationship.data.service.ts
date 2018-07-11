import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RelationshipType } from '../../models/relationship.model';

@Injectable()
export class RelationshipDataService {

    constructor(
        private http: HttpClient
    ) {
    }

    /**
     * Retrieve link path parameter
     * @param {RelationshipType} relationshipType
     * @returns {string}
     */
    private getLinkPathFromType(relationshipType: RelationshipType) {
        switch (relationshipType) {
            case RelationshipType.CASE:
                return 'cases';
            case RelationshipType.CONTACT:
                return 'contacts';
        }
    }

    /**
     * Add a new Relationship for an Outbreak to a Case / Contact ...
     * @param {string} outbreakId
     * @param {RelationshipType} relationshipType
     * @param {string} relatedId
     * @param relationshipData
     * @returns {Observable<any>}
     */
    createRelationship(outbreakId: string, relationshipType: RelationshipType, relatedId: string, relationshipData): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/${this.getLinkPathFromType(relationshipType)}/${relatedId}/relationships`, relationshipData);
    }
}


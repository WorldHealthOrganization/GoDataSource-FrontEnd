import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { RelationshipModel } from '../../models/relationship.model';
import { ModelHelperService } from '../helper/model-helper.service';
import { Constants } from '../../models/constants';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { EntityType } from '../../models/entity.model';

@Injectable()
export class RelationshipDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     * Retrieve link path parameter
     * @param {string} entityType
     * @returns {string}
     */
    private getLinkPathFromEntityType(entityType: EntityType) {
        switch (entityType) {
            case EntityType.CASE:
                return 'cases';
            case EntityType.CONTACT:
                return 'contacts';
            case EntityType.EVENT:
                return 'events';
        }
    }

    /**
     * Add a new Relationship for an Outbreak to a Case / Contact ...
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param relationshipData
     * @returns {Observable<any>}
     */
    createRelationship(outbreakId: string, entityType: EntityType, entityId: string, relationshipData): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships`, relationshipData);
    }

    /**
     * Retrieve Relationships of a Case / Contact / Event
     * @param {string} outbreakId
     * @param {EntityType} entityType
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<RelationshipModel[]>}
     */
    getEntityRelationships(
        outbreakId: string,
        entityType: EntityType,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<RelationshipModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/${this.getLinkPathFromEntityType(entityType)}/${entityId}/relationships?filter=${filter}`),
            RelationshipModel
        );
    }
}


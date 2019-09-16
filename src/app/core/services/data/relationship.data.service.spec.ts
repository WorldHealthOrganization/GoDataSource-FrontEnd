import { Observable, of } from 'rxjs';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { EntityType } from '../../models/entity-type';
import { RelationshipModel } from '../../models/entity-and-relationship.model';

export const RelationshipDataServiceMock: {
    getEntityRelationships: (outbreakId: string,
                             entityType: EntityType,
                             entityId: string,
                             queryBuilder: RequestQueryBuilder) => Observable<RelationshipModel[]>
} = {
    getEntityRelationships: (
        outbreakId: string,
        entityType: EntityType,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<RelationshipModel[]> => {
        // finished
        return of([]);
    }
};

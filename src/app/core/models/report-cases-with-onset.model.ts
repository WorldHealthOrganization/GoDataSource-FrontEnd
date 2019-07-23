import * as _ from 'lodash';
import { CaseModel } from './case.model';
import { RelationshipModel } from './entity-and-relationship.model';

export class ReportCasesWithOnsetModel {
    primaryCase: CaseModel;
    secondaryCase: CaseModel;
    relationship: RelationshipModel;

    constructor(data = null) {
        this.primaryCase = new CaseModel(_.get(data, 'primaryCase'));
        this.secondaryCase = new CaseModel(_.get(data, 'secondaryCase'));
        this.relationship = new RelationshipModel(_.get(data, 'relationship'));
    }
}

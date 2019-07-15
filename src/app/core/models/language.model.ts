import * as _ from 'lodash';
import { moment, Moment } from '../helperClasses/x-moment';

export class LanguageTokenModel {
    token: string;
    translation: string;

    constructor(data = null) {
        this.token = _.get(data, 'token');
        this.translation = _.get(data, 'translation');
    }
}

export class LanguageTokenDetails {
    languageId: string;
    lastUpdateDate: Moment;
    tokens: LanguageTokenModel[];

    constructor(data = null) {
        this.languageId = _.get(data, 'languageId');

        this.lastUpdateDate = _.get(data, 'lastUpdateDate');
        this.lastUpdateDate = this.lastUpdateDate ? moment(this.lastUpdateDate) : null;

        this.tokens = _.get(data, 'tokens');
        this.tokens = (this.tokens || []).map((token) => new LanguageTokenModel(token));
    }
}

export class LanguageModel {
    id: string;
    name: string;
    tokens: LanguageTokenModel[];
    readOnly: boolean;

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.tokens = _.get(data, 'tokens', []);
        this.readOnly = _.get(data, 'readOnly', false);
    }
}

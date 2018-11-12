import * as _ from 'lodash';

export class LanguageTokenModel {
    token: string;
    translation: string;

    constructor(data = null) {
        this.token = _.get(data, 'token');
        this.translation = _.get(data, 'translation');
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

    getTokensObject() {
        const tokensObj = {};

        _.each(this.tokens, (token: LanguageTokenModel) => {
            _.set(tokensObj, token.token, token.translation);
        });

        return tokensObj;
    }
}

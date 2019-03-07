import { EventEmitter } from '@angular/core';

export const I18nServiceMock: {
    defaultLanguageId: string,
    languageChangedEvent: EventEmitter<void>,
    instant: (token: string) => string,
    getSelectedLanguageId: () => string
} = {
    defaultLanguageId: 'english_us',
    languageChangedEvent: new EventEmitter<void>(),

    instant: (token: string): string => {
        return token;
    },

    getSelectedLanguageId: (): string => {
        return I18nServiceMock.defaultLanguageId;
    }
};

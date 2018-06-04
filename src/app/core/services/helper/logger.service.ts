import { Injectable } from '@angular/core';

import * as _ from 'lodash';

@Injectable()
export class LoggerService {

    /**
     * Add a log message
     * @param messages Variable number of arguments, each message being logged on a separate line
     */
    log(...messages: any[]) {

        // stringify all messages
        messages = messages.map((message) => {
            if (!_.isString(message)) {
                // JSON-encode all messages that are NOT strings
                let encodedMessage = JSON.stringify(message);

                // obfuscate passwords
                encodedMessage = encodedMessage.replace(/"password":"(.*?)"/, '"password":"***"');
                encodedMessage = encodedMessage.replace(/"passwordConfirm":"(.*?)"/, '"passwordConfirm":"***"');
                encodedMessage = encodedMessage.replace(/"newPassword":"(.*?)"/, '"newPassword":"***"');
                encodedMessage = encodedMessage.replace(/"newPasswordConfirm":"(.*?)"/, '"newPasswordConfirm":"***"');

                return encodedMessage;
            }

            return message;
        });

        // compose the log message
        const logMessage = messages.join('\r\n');

        // #TODO logging via API
        console.log(logMessage);
    }
}


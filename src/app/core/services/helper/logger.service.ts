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
                const encodedMessage = JSON.stringify(message);

                // obfuscate passwords
                return encodedMessage.replace(/"password":"(.*?)"/, '"password":"***"');
            }

            return message;
        });

        // compose the log message
        const logMessage = messages.join('\r\n');

        // #TODO logging via API
        console.log(logMessage);
    }
}


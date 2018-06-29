import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { LoggingDataService } from '../data/logging.data.service';
import { environment } from '../../../../environments/environment';

@Injectable()
export class LoggerService {

    // set to 'true' when a logging request fails
    apiLoggerCrashed = false;

    constructor(
        private loggingDataService: LoggingDataService
    ) {}

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

        // log messages on client side?
        if (environment.enableClientLogging) {
            console.log(logMessage);
        }

        // log messages on server?
        if (
            environment.enableApiLogging &&
            !this.apiLoggerCrashed
        ) {
            this.loggingDataService.log([logMessage])
                .catch((err) => {
                    // do not make API calls for next logs
                    this.apiLoggerCrashed = true;

                    return err;
                })
                .subscribe();
        }
    }
}


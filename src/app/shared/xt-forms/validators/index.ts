import { EmailValidatorDirective } from './email-validator.directive';
import { EqualValidatorDirective } from './equal-validator.directive';
import { FileExtensionValidatorDirective } from './file-extension-validator.directive';
import { TruthyValidatorDirective } from './truthy-validator.directive';
import { UniqueAsyncValidatorDirective } from './unique-async-validator.directive';

export const validatorDirectives: any[] = [
    EmailValidatorDirective,
    EqualValidatorDirective,
    FileExtensionValidatorDirective,
    TruthyValidatorDirective,
    UniqueAsyncValidatorDirective
];

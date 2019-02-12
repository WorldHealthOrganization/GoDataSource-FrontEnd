import { UserModel } from '../../models/user.model';

const TEST_USER: UserModel = new UserModel({
    activeOutbreakId: 'outbreak-spec-id',
    email: 'user.spec@who.int',
    firstName: 'User',
    lastName: 'Spec',
    id: 'user-spec-id',
    languageId: 'english_us',
    permissionIds: ['read_outbreak', 'read_case', 'write_case', 'read_contact', 'write_contact']
});
const AUTH_TOKEN: string = 'abcd1234';

export class AuthDataServiceMock {
    getAuthToken(): string|null {
        return AUTH_TOKEN;
    }

    getAuthenticatedUser(): UserModel {
        return TEST_USER;
    }
}

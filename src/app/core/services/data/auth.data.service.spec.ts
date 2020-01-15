import { UserModel } from '../../models/user.model';

const TEST_USER: UserModel = new UserModel({
    activeOutbreakId: 'outbreak-spec-id',
    email: 'user.spec@who.int',
    firstName: 'User',
    lastName: 'Spec',
    id: 'user-spec-id',
    languageId: 'english_us',
    permissionIds: ['outbreak_list', 'outbreak_view', 'case_list', 'case_view', 'case_create', 'case_modify', 'case_delete', 'contact_list', 'contact_view', 'contact_create', 'contact_modify', 'contact_delete']
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

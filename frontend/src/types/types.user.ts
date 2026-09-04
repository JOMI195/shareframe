export interface ICoreUser {
    id: number;
    email: string;
    username: string;
}

export const isICoreUser = (obj: unknown): obj is ICoreUser => {
    const candidate = obj as ICoreUser;

    return (
        candidate &&
        typeof candidate.id === 'number' &&
        typeof candidate.email === 'string' &&
        typeof candidate.username === 'string'
    );
}

export interface IUserAccount {
    friendship_user_searchable: boolean;
    friendship_user_search_code: string;
}

export interface IUser extends ICoreUser {
    account: IUserAccount;
}

export interface IPatchUserForm {
    username: string;
    account: IUserAccount;
}

export interface ISetUserPasswortForm {
    "new_password": string;
    "re_new_password": string;
    "current_password": string;
}

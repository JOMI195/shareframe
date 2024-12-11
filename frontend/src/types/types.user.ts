export interface ICoreUser {
    id: number;
    email: string;
    username: string;
}

export const isICoreUser = (obj: any): obj is ICoreUser => {
    return (
        obj &&
        typeof obj.id === 'number' &&
        typeof obj.email === 'string' &&
        typeof obj.username === 'string'
    );
}

export interface ICoreUserCredentials {
    refresh: string;
    access: string;
}

export const isICoreUserCredentials = (obj: any): obj is ICoreUserCredentials => {
    return (
        obj &&
        typeof obj.refresh === 'string' &&
        typeof obj.access === 'string'
    );
}

export interface IUserAccount {
    recieves_newsletter: boolean;
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

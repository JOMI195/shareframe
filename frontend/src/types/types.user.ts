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

export type NotificationKind = 'inactivity_reminder' | 'changelog';

export type NotificationChannel = 'push' | 'email';

export interface INotificationChannelSetting {
    channel: NotificationChannel;
    enabled: boolean;
}

export interface INotificationKindSettings {
    kind: NotificationKind;
    enabled: boolean;
    channels: INotificationChannelSetting[];
}

export type INotificationKindPatch = Pick<INotificationKindSettings, 'kind'>
    & Partial<Pick<INotificationKindSettings, 'enabled' | 'channels'>>;

export interface IUserAccount {
    friendship_user_searchable: boolean;
    friendship_user_search_code: string;
    notification_preferences: INotificationKindSettings[];
    avatar?: string | null;
}

export interface IUser extends ICoreUser {
    account: IUserAccount;
}

export interface IPatchUserForm {
    username: string;
    account: Pick<IUserAccount, 'friendship_user_searchable' | 'friendship_user_search_code'>;
}

export interface IRequestEmailChangeForm {
    "new_email": string;
    "current_password": string;
}

export interface ISetUserPasswortForm {
    "new_password": string;
    "re_new_password": string;
    "current_password": string;
}

export interface IChangelogId {
    id: number;
    date: string;
    title: string;
    is_published: boolean;
}

export interface IChangelog extends IChangelogId {
    content: string;
    created_at: string;
    updated_at: string;
}

export interface IChangelogPreferences {
    deactivatedIds: number[];
}
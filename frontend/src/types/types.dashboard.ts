export interface ILatestExpiringImage {
    id: number;
    expires_at: string;
    sender: string;
    image_name: string;
}

export interface IDayActivity {
    day: string;
    sent_count: number;
    received_count: number;
}

export interface IDashboardImagesStats {
    uploaded_images_by_me_count: number,
}

export interface IDashboardSentImagesStats {
    uploaded_images_by_me_count: number,
    active_images_to_me_count: number;
    latest_expiring_image: ILatestExpiringImage | null;
    weekly_activity: IDayActivity[];
}

export interface IDashboardFrameStats {
    id: number;
    last_board_heartbeat: string | null;
}

export interface IDashboardData {
    images: IDashboardImagesStats;
    sent_images: IDashboardSentImagesStats;
    frames: IDashboardFrameStats[];
}
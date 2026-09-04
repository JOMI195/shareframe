export interface IFrame {
    id: number;
    public_serial_number: string;
    is_active: boolean;
    registered_at: string;
    last_seen: string | null;
    local_ip_address: string | null;
}

export interface IRegisterFrameForm {
    public_serial_number: string
}

export const isIFrameResponse = (obj: unknown): obj is IFrame => {
    const candidate = obj as IFrame;

    return (
        candidate &&
        typeof candidate.id === 'number' &&
        typeof candidate.public_serial_number === 'string' &&
        typeof candidate.is_active === 'boolean' &&
        typeof candidate.registered_at === 'string'
    );
}

export interface IFrameOTP {
    otp: string;
    expires_in_minutes: string;
}

export const isIFrameOTP = (obj: unknown): obj is IFrameOTP => {
    const candidate = obj as IFrameOTP;

    return (
        candidate &&
        typeof candidate.otp === 'string' &&
        typeof candidate.expires_in_minutes === 'string'
    );
}
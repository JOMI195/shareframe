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

export const isIFrameResponse = (obj: any): obj is IFrame => {
    return (
        obj &&
        typeof obj.id === 'number' &&
        typeof obj.public_serial_number === 'string' &&
        typeof obj.is_active === 'boolean' &&
        typeof obj.registered_at === 'string'
    );
}

export interface IFrameOTP {
    otp: string;
    expires_in_minutes: string;
}

export const isIFrameOTP = (obj: any): obj is IFrameOTP => {
    return (
        obj &&
        typeof obj.otp === 'string' &&
        typeof obj.expires_in_minutes === 'string'
    );
}
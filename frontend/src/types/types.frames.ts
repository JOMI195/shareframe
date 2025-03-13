export interface IFrame {
    id: number;
    public_serial_number: string;
    is_active: boolean;
    registered_at: string;
    frame_websocket_connection: {
        local_ip_address: string | null;
        connected_at: string;
        last_active: string;
    } | null;
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
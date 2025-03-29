export const fetchWithTimeout = async (
    url: string,
    options: RequestInit = {},
    timeout = 10 * 60 * 1000
): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(`http://127.0.0.1:5000${url}`, {
            ...options,
            credentials: 'include',
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};
import { sha256 } from 'js-sha256';

export const fileToSha256Hex = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    // Web Crypto (crypto.subtle) only exists in secure contexts (HTTPS / localhost).
    // Fall back to a pure-JS impl when served over plain HTTP (e.g. a LAN IP), where
    // crypto.subtle is undefined. Both paths return identical lowercase hex.
    if (globalThis.crypto?.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    return sha256(data); // lowercase hex
}

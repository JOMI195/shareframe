export const copyToClipboard = async (text: string): Promise<boolean> => {
    // Async Clipboard API requires a secure context (HTTPS / localhost).
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // fall through to legacy path
        }
    }

    // Legacy fallback for insecure contexts (e.g. plain HTTP on a LAN IP).
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
};

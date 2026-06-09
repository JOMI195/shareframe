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
        textarea.style.opacity = '0';

        // A MUI Dialog/Modal traps focus inside itself. A textarea appended to
        // document.body would be outside that trap: select() focuses it, the trap
        // synchronously yanks focus back into the dialog, the selection is lost, and
        // execCommand('copy') then copies a stale/empty selection. Mount the textarea
        // inside the active dialog subtree so focus stays valid; fall back to body.
        const active = document.activeElement as HTMLElement | null;
        const host = (active?.closest('[role="dialog"]') as HTMLElement | null) ?? document.body;

        host.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        host.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
};

const fileToArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
    return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();

        const readFile = function (event: ProgressEvent<FileReader>) {
            const result = event.target?.result;
            if (result instanceof ArrayBuffer) {
                resolve(result);
            } else {
                reject(new Error('Failed to read file as ArrayBuffer.'));
            }
        };

        reader.addEventListener('load', readFile);
        reader.readAsArrayBuffer(file);
    });
}

const bufferToSha256 = async (buffer: ArrayBuffer) => {
    const data = new Uint8Array(buffer);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return hashBuffer;
}

export const fileToSha256Hex = async (file: File) => {
    const buffer = await fileToArrayBuffer(file);
    const hashBuffer = await bufferToSha256(buffer);

    // Convert the hashBuffer to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

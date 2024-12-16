export function getReadablyFileSize(byteFileSize: number) {
    let tempSize = byteFileSize;
    const filePowers = ['Bytes', 'KB', 'MB', 'GB'];

    let i = 0;
    while (tempSize > 900) {
        tempSize /= 1000;
        i++;
    };

    const exactSize = (Math.round(tempSize * 100) / 100) + ' ' + filePowers[i];

    return exactSize
}
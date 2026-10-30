// Groups the 16 characters into blocks of four.
export const formatSerial = (value: string) =>
    value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 16)
        .replace(/(.{4})(?=.)/g, "$1-");

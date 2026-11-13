// Groups the 8 characters the frame shows into blocks of four.
export const formatClaimCode = (value: string) =>
    value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8)
        .replace(/(.{4})(?=.)/g, "$1-");

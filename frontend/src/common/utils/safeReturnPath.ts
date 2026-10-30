// Only paths inside the app: "//host" or "/\\host" would leave it, and auth pages would loop.
export const safeReturnPath = (path: string | null | undefined): string | null =>
    path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') && !path.startsWith('/auth/')
        ? path
        : null;

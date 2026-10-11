import { Avatar, SxProps, Theme, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { stringToColor } from '@/common/utils/color/color';
import { loadAvatar } from '@/common/utils/avatar/avatarCache';

interface UserAvatarProps {
    username: string;
    url?: string | null;
    size?: number;
    sx?: SxProps<Theme>;
}

const UserAvatar = ({ username, url, size = 40, sx }: UserAvatarProps) => {
    const theme = useTheme();
    const [loaded, setLoaded] = useState<{ url: string; objectUrl: string } | null>(null);

    useEffect(() => {
        if (!url) return;
        let active = true;
        loadAvatar(url).then(
            (objectUrl) => {
                if (active) setLoaded({ url, objectUrl });
            },
            () => undefined
        );
        return () => {
            active = false;
        };
    }, [url]);

    const src = url && loaded?.url === url ? loaded.objectUrl : undefined;
    const background = stringToColor(username);

    return (
        // Decorative: the username is always shown next to it.
        <Avatar
            src={src}
            alt={username}
            aria-hidden
            sx={[
                {
                    width: size,
                    height: size,
                    fontSize: size * 0.45,
                    bgcolor: background,
                    color: theme.palette.getContrastText(background),
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {username.slice(0, 1).toUpperCase()}
        </Avatar>
    );
};

export default UserAvatar;

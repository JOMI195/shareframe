import { useId } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SxProps, Theme } from "@mui/material";
import { useAppSelector } from "@/store";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getFriendAvatars } from "@/common/utils/avatar/friendAvatars";
import UserAvatar from "@/common/components/userAvatar";

interface UserFilterSelectProps {
    label: string;
    emptyLabel: string;
    value: string;
    onChange: (username: string) => void;
    disabled?: boolean;
    sx?: SxProps<Theme>;
}

// Picks one of your friends or yourself, each shown with their avatar.
const UserFilterSelect = ({ label, emptyLabel, value, onChange, disabled, sx }: UserFilterSelectProps) => {
    const user = useAppSelector(getUser);
    const labelId = useId();
    const friendships = useAppSelector(getFriendships);
    const avatars = getFriendAvatars(friendships, user.me);

    const renderUser = (username: string) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <UserAvatar username={username} url={avatars.get(username)} size={24} />
            {username === user.me.username ? 'Du' : username}
        </Box>
    );

    return (
        <FormControl fullWidth sx={sx} disabled={disabled}>
            <InputLabel id={labelId} shrink>{label}</InputLabel>
            <Select
                labelId={labelId}
                value={value}
                renderValue={(selected) => selected ? renderUser(selected) : <em>{emptyLabel}</em>}
                label={label}
                onChange={(event) => onChange(event.target.value)}
                displayEmpty
                notched
            >
                <MenuItem value="">
                    <em>{emptyLabel}</em>
                </MenuItem>
                {[...avatars.keys()].map((username) => (
                    <MenuItem key={username} value={username}>
                        {renderUser(username)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default UserFilterSelect;

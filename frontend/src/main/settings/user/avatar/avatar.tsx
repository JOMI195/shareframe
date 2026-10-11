import { Box, Button, Stack } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import { ChangeEvent, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { uploadMyAvatar } from "@/store/entities/authentication/authentication.actions";
import { IUser } from "@/types";
import UserAvatar from "@/common/components/userAvatar";
import DeleteAvatarDialog from "./deleteAvatarDialog";

const ProfileAvatar = () => {
    const dispatch = useAppDispatch();
    const me: IUser = useAppSelector(getMyUserDetails);
    const getAuthApi = useAppSelector(getApi);
    const inputRef = useRef<HTMLInputElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Cleared so picking the same file again still fires onChange.
        event.target.value = "";
        if (file) dispatch(uploadMyAvatar(file));
    };

    return (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "center" }}>
            <UserAvatar username={me.username} url={me.account.avatar} size={96} />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    hidden
                    aria-label="Profilbild auswählen"
                    onChange={handleFileChange}
                />
                <Button
                    variant="contained"
                    startIcon={<PhotoCameraIcon />}
                    disabled={getAuthApi.loading}
                    onClick={() => inputRef.current?.click()}
                >
                    {"Bild ändern"}
                </Button>
                {me.account.avatar && (
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<DeleteIcon />}
                        disabled={getAuthApi.loading}
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        {"Entfernen"}
                    </Button>
                )}
            </Box>
            <DeleteAvatarDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} />
        </Stack>
    );
};

export default ProfileAvatar;

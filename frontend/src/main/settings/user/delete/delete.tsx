import { useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Typography } from "@mui/material";
import { useAppDispatch } from "@/store";
import { deleteMyUserProfile } from "@/store/entities/authentication/authentication.actions";
import { useNavigate } from "react-router";
import { getHomeUrl } from "@/assets/endpoints/app/appEndpoints";
import SettingsSection from "@/common/components/settings/settingsSection";
import FormActions from "@/common/components/settings/formActions";

const Delete = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [openDialog, setOpenDialog] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDeleteClick = () => {
        setOpenDialog(true);
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setPassword("");
    };

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    const handleConfirmDelete = async () => {
        setLoading(true);
        try {
            await dispatch(deleteMyUserProfile(password));
        } catch {
            // cleanup happens in finally
        } finally {
            setLoading(false);
            handleDialogClose();
            navigate(getHomeUrl(), { replace: true })
        }
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        handleConfirmDelete();
    };

    return (
        <>
            <SettingsSection title="Konto löschen" tone="error">
                <Typography variant="body1" color="textSecondary">
                    Deine Fotos, Freundschaften und gesendeten Bilder werden endgültig gelöscht und deine Rahmen von deinem Konto getrennt.
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Diese Aktion ist unwiderruflich.
                </Typography>
                <FormActions>
                    <Button variant="contained" color="error" onClick={handleDeleteClick}>
                        Mein Konto löschen
                    </Button>
                </FormActions>
            </SettingsSection>

            <Dialog open={openDialog} onClose={handleDialogClose}>
                <Box component="form" id="delete-user-form" noValidate onSubmit={handleSubmit}>
                    <DialogTitle>Konto löschen</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            Bitte bestätige die Löschung deines Kontos mit deinem Passwort.
                        </DialogContentText>
                        <TextField
                            margin="dense"
                            id="password"
                            label="Passwort"
                            type="password"
                            fullWidth
                            variant="outlined"
                            value={password}
                            onChange={handlePasswordChange}
                            autoComplete="current-password"
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <FormActions fill>
                            <Button onClick={handleDialogClose} variant="outlined">
                                Abbrechen
                            </Button>
                            <Button type="submit" color="error" disabled={loading} variant="contained">
                                Löschen bestätigen
                            </Button>
                        </FormActions>
                    </DialogActions>
                </Box>
            </Dialog>
        </>
    );
};

export default Delete;

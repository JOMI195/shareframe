import { useState } from "react";
import { Button, Dialog, DialogContent, TextField, Typography, Box, Grid } from "@mui/material";
import { useAppDispatch } from "@/store";
import { deleteMyUserProfile } from "@/store/entities/authentication/authentication.actions"; // Adjust the import path as necessary
import { useNavigate } from "react-router-dom";
import { getHomeUrl } from "@/assets/endpoints/app/appEndpoints";

const Delete = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [openDialog, setOpenDialog] = useState(false);
    const [password, setPassword] = useState("");
    const [keepUserName] = useState(false);
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
            const anonymize = !keepUserName;
            await dispatch(deleteMyUserProfile(password, anonymize));
        } catch (error) {
        } finally {
            setLoading(false);
            handleDialogClose();
            navigate(getHomeUrl(), { replace: true })
        }
    };

    return (
        <Box>
            <Box sx={{ p: 2, border: "1px solid red", borderRadius: 1, display: "flex", flexDirection: "column" }}>
                <Box textAlign={{ xs: "center", sm: "left" }}>
                    <Typography variant="h6" color="error">
                        Danger Zone
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Hier kannst du dein Konto löschen.
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 1, mb: 1 }}>
                        Diese Aktion ist unwiderruflich.
                    </Typography>
                </Box>
                <Grid
                    container
                    display={"flex"} justifyContent={"flex-end"}
                >
                    <Grid item xs={12} sm={5} display={"flex"} justifyContent={"flex-end"}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="error"
                            onClick={handleDeleteClick}
                        >
                            Mein Konto löschen
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            <Dialog
                open={openDialog}
                onClose={handleDialogClose}
            >
                <Box
                    sx={{ m: 2 }}
                    component='form'
                    id='delete-user-form'
                    noValidate
                >
                    {/* <DialogTitle>Löschen deines Benutzerkontos</DialogTitle> */}
                    <DialogContent>
                        <Grid
                            container
                            display={"flex"} justifyContent={"space-between"} alignItems={"center"}
                            spacing={2}
                        >
                            <Grid item xs={12} sx={{ order: { xs: 1, md: 1 } }}>
                                <Typography variant="h6">
                                    Bitte bestätige die Löschung deines Kontos mit deinem Passwort.
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sx={{ order: { xs: 2, md: 2 } }}>
                                <TextField
                                    margin="dense"
                                    id="password"
                                    label="Passwort"
                                    type="password"
                                    fullWidth
                                    variant="outlined"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    autoComplete="password"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} sx={{ order: { xs: 4, md: 3 } }}>
                                <Button
                                    onClick={handleDialogClose}
                                    color="primary"
                                    variant="outlined"
                                    fullWidth
                                >
                                    Abbrechen
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6} sx={{ order: { xs: 3, md: 3 } }}>
                                <Button
                                    type='submit'
                                    onClick={handleConfirmDelete}
                                    color="error"
                                    disabled={loading}
                                    variant="contained"
                                    fullWidth
                                >
                                    {"Löschen bestätigen"}
                                </Button>
                            </Grid>
                        </Grid>
                    </DialogContent>
                </Box>
            </Dialog>
        </Box>
    );
};

export default Delete;

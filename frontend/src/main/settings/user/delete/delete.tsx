import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { getIn, useFormik } from "formik";
import * as yup from "yup";
import { useAppDispatch } from "@/store";
import { deleteMyUserProfile } from "@/store/entities/authentication/authentication.actions";
import { clearLocalSession } from "@/common/utils/pwa/clearLocalSession";
import { useNavigate } from "react-router";
import { getHomeUrl } from "@/assets/endpoints/app/appEndpoints";
import SettingsSection from "@/common/components/settings/settingsSection";
import FormActions from "@/common/components/settings/formActions";

const validationSchema = yup.object({
    password: yup.string().required("Dieses Feld wird benötigt"),
});

const Delete = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [editing, setEditing] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useFormik({
        initialValues: { password: "" },
        validationSchema: validationSchema,
        onSubmit: () => setConfirmOpen(true),
    });

    const handleCancel = () => {
        setEditing(false);
        form.resetForm();
    };

    const handleConfirm = async () => {
        setLoading(true);
        const response: unknown = await dispatch(deleteMyUserProfile(form.values.password));
        setLoading(false);
        setConfirmOpen(false);
        if (response === true) {
            await clearLocalSession();
            navigate(getHomeUrl(), { replace: true });
        } else {
            form.resetForm();
        }
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

                {!editing && (
                    <FormActions>
                        <Button variant="contained" color="error" onClick={() => setEditing(true)}>
                            Mein Konto löschen
                        </Button>
                    </FormActions>
                )}

                {editing && (
                    <Stack
                        component="form"
                        id="delete-user-form"
                        noValidate
                        onSubmit={form.handleSubmit}
                        spacing={2}
                    >
                        <Typography variant="body2">
                            Bitte gib zur Bestätigung dein Passwort ein.
                        </Typography>
                        <TextField
                            id="delete_user_password"
                            name="password"
                            label="Passwort"
                            value={form.values.password}
                            onChange={form.handleChange}
                            onBlur={form.handleBlur}
                            error={form.touched.password && Boolean(form.errors.password)}
                            helperText={getIn(form.touched, "password") && getIn(form.errors, "password")}
                            fullWidth
                            autoComplete="current-password"
                            variant="outlined"
                            type={showPassword ? "text" : "password"}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="Passwort anzeigen"
                                                onClick={() => setShowPassword(!showPassword)}
                                                onMouseDown={(event) => event.preventDefault()}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }
                            }}
                        />
                        <FormActions>
                            <Button type="button" variant="outlined" color="secondary" onClick={handleCancel}>
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="contained" color="error">
                                Konto löschen
                            </Button>
                        </FormActions>
                    </Stack>
                )}
            </SettingsSection>

            <Dialog
                open={confirmOpen}
                onClose={() => !loading && setConfirmOpen(false)}
                aria-labelledby="delete-user-confirm-title"
            >
                <DialogTitle id="delete-user-confirm-title">Konto endgültig löschen?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Dein Konto und alle deine Daten werden sofort gelöscht. Das kann nicht rückgängig gemacht werden.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <FormActions fill>
                        <Button onClick={() => setConfirmOpen(false)} variant="outlined" disabled={loading}>
                            Abbrechen
                        </Button>
                        <Button onClick={handleConfirm} color="error" variant="contained" disabled={loading}>
                            Endgültig löschen
                        </Button>
                    </FormActions>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Delete;

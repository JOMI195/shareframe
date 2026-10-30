import { useState } from "react";
import { Button, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { getIn, useFormik } from "formik";
import * as yup from "yup";
import { useAppDispatch } from "@/store";
import { deleteMyUserProfile } from "@/store/entities/authentication/authentication.actions";
import { clearLocalSession } from "@/common/utils/pwa/clearLocalSession";
import ConfirmDialog from "@/common/components/confirmDialog";
import { useNavigate } from "react-router";
import { getHomeUrl } from "@/assets/endpoints/app/appEndpoints";
import SettingsSection from "@/common/components/settings/settingsSection";
import FormActions from "@/common/components/settings/formActions";
import { errorMessageFor } from "@/common/utils/errors/errorMessages";

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
    const [failure, setFailure] = useState<string | null>(null);

    const form = useFormik({
        initialValues: { password: "" },
        validationSchema: validationSchema,
        onSubmit: () => setConfirmOpen(true),
    });

    const handleCancel = () => {
        setEditing(false);
        setFailure(null);
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
            const wrongPassword = errorMessageFor("wrong_password");
            form.setFieldValue("password", "", false);
            setFailure(wrongPassword && response === wrongPassword ? wrongPassword : "Dein Konto konnte nicht gelöscht werden. Versuch es später noch einmal.");
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
                            onChange={(event) => {
                                setFailure(null);
                                form.handleChange(event);
                            }}
                            onBlur={form.handleBlur}
                            error={Boolean(failure) || (form.touched.password && Boolean(form.errors.password))}
                            helperText={failure ?? (getIn(form.touched, "password") && getIn(form.errors, "password"))}
                            fullWidth
                            autoComplete="current-password"
                            variant="outlined"
                            type={showPassword ? "text" : "password"}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
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

            <ConfirmDialog
                open={confirmOpen}
                title="Konto endgültig löschen?"
                confirmLabel="Endgültig löschen"
                destructive
                loading={loading}
                onConfirm={handleConfirm}
                onCancel={() => !loading && setConfirmOpen(false)}
            >
                Dein Konto und alle deine Daten werden sofort gelöscht. Das kann nicht rückgängig gemacht werden.
            </ConfirmDialog>
        </>
    );
};

export default Delete;

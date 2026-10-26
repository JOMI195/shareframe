import { useState } from "react";
import { Alert, Box, Button, Grid, IconButton, InputAdornment, TextField } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { getIn, useFormik } from "formik";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { requestEmailChange } from "@/store/entities/authentication/authentication.actions";
import { IRequestEmailChangeForm, IUser } from "@/types";

const initialValues: IRequestEmailChangeForm = {
    new_email: "",
    current_password: "",
};

const validationSchema = yup.object({
    new_email: yup
        .string()
        .email("Bitte gib eine gültige E-Mail-Adresse ein" as string)
        .required("Dieses Feld wird benötigt" as string),
    current_password: yup
        .string()
        .required("Dieses Feld wird benötigt" as string),
});

const Email = () => {
    const dispatch = useAppDispatch();
    const me: IUser = useAppSelector(getMyUserDetails);
    const authApi = useAppSelector(getApi);

    const [editing, setEditing] = useState(false);
    const [pendingEmail, setPendingEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const form = useFormik({
        initialValues: initialValues,
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            const response: unknown = await dispatch(requestEmailChange(values));
            if (response === values.new_email) {
                setPendingEmail(values.new_email);
                setEditing(false);
                form.resetForm();
            }
        },
    });

    const handleCancel = () => {
        setEditing(false);
        form.resetForm();
    };

    return (
        <Grid container spacing={2}>
            <Grid size={12}>
                <TextField
                    id='email'
                    label={'Email'}
                    value={me.email}
                    disabled
                    fullWidth
                    variant="filled"
                />
            </Grid>

            {pendingEmail && !editing && (
                <Grid size={12}>
                    <Alert severity="info">
                        {`Wir haben dir einen Bestätigungslink an ${pendingEmail} geschickt. Deine E-Mail-Adresse ändert sich erst, wenn du den Link öffnest.`}
                    </Alert>
                </Grid>
            )}

            {!editing && (
                <Grid size={{ xs: 12, md: 5 }}>
                    <Button
                        type="button"
                        fullWidth
                        variant="outlined"
                        onClick={() => setEditing(true)}
                    >
                        {"E-Mail ändern"}
                    </Button>
                </Grid>
            )}

            {editing && (
                <Grid size={12}>
                    <Box
                        component='form'
                        id='request-email-change-form'
                        noValidate
                        onSubmit={form.handleSubmit}
                    >
                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <TextField
                                    id='new_email'
                                    name='new_email'
                                    label={'Neue E-Mail-Adresse'}
                                    value={form.values.new_email}
                                    onBlur={form.handleBlur}
                                    error={form.touched.new_email && Boolean(form.errors.new_email)}
                                    helperText={getIn(form.touched, "new_email") && getIn(form.errors, "new_email")}
                                    onChange={form.handleChange}
                                    fullWidth
                                    autoComplete='email'
                                    variant='outlined'
                                    type='email'
                                />
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    id='email_change_current_password'
                                    name='current_password'
                                    label={'Aktuelles Passwort'}
                                    value={form.values.current_password}
                                    onBlur={form.handleBlur}
                                    error={form.touched.current_password && Boolean(form.errors.current_password)}
                                    helperText={getIn(form.touched, "current_password") && getIn(form.errors, "current_password")}
                                    onChange={form.handleChange}
                                    fullWidth
                                    autoComplete='current-password'
                                    variant='outlined'
                                    type={showPassword ? 'text' : 'password'}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position='end'>
                                                    <IconButton
                                                        aria-label='toggle current password visibility'
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        onMouseDown={(event) => event.preventDefault()}
                                                        edge='end'
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid container spacing={2} size={12} sx={{ justifyContent: "space-between" }}>
                                <Grid sx={{ order: { xs: 1, md: 2 } }} size={{ xs: 12, md: 5 }}>
                                    <Button
                                        type='submit'
                                        fullWidth
                                        form='request-email-change-form'
                                        variant='contained'
                                        disabled={authApi.loading}
                                    >
                                        {'Bestätigungslink senden'}
                                    </Button>
                                </Grid>
                                <Grid sx={{ order: { xs: 2, md: 1 } }} size={{ xs: 12, md: 5 }}>
                                    <Button
                                        type="button"
                                        fullWidth
                                        variant="outlined"
                                        color="secondary"
                                        onClick={handleCancel}
                                    >
                                        {"Abbrechen"}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            )}
        </Grid>
    );
}

export default Email;

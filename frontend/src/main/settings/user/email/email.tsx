import { useState } from "react";
import { Alert, Button, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { getIn, useFormik } from "formik";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { requestEmailChange } from "@/store/entities/authentication/authentication.actions";
import { IRequestEmailChangeForm, IUser } from "@/types";
import SettingsSection from "@/common/components/settings/settingsSection";
import FormActions from "@/common/components/settings/formActions";

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
        <SettingsSection title="E-Mail-Adresse" description={me.email}>
            {pendingEmail && !editing && (
                <Alert severity="info">
                    {`Wir haben dir einen Bestätigungslink an ${pendingEmail} geschickt. Deine E-Mail-Adresse ändert sich erst, wenn du den Link öffnest.`}
                </Alert>
            )}

            {!editing && (
                <FormActions>
                    <Button type="button" variant="outlined" onClick={() => setEditing(true)}>
                        {"E-Mail ändern"}
                    </Button>
                </FormActions>
            )}

            {editing && (
                <Stack
                    component='form'
                    id='request-email-change-form'
                    noValidate
                    onSubmit={form.handleSubmit}
                    spacing={2}
                >
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
                    <FormActions>
                        <Button
                            type="button"
                            variant="outlined"
                            color="secondary"
                            onClick={handleCancel}
                        >
                            {"Abbrechen"}
                        </Button>
                        <Button
                            type='submit'
                            variant='contained'
                            disabled={authApi.loading}
                        >
                            {'Bestätigungslink senden'}
                        </Button>
                    </FormActions>
                </Stack>
            )}
        </SettingsSection>
    );
}

export default Email;

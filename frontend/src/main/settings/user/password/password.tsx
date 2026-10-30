import { Button, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi } from "@/store/entities/authentication/authentication.slice";
import { useState } from "react";
import { getIn, useFormik } from "formik";
import { ISetUserPasswortForm } from "@/types";
import { setPassword } from "@/store/entities/authentication/authentication.actions";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SettingsSection from "@/common/components/settings/settingsSection";
import FormActions from "@/common/components/settings/formActions";
import { PASSWORD_RULES } from "@/common/utils/constants/password";

const Security = () => {
    const dispatch = useAppDispatch();
    const getAuthApi = useAppSelector(getApi);

    const [showPassword, setShowPassword] = useState({
        new_password: false,
        re_new_password: false,
        current_password: false,
    });

    const handleClickShowPassword = (key: keyof typeof showPassword) => {
        setShowPassword({ ...showPassword, [key]: !showPassword[key] });
    };

    const handleMouseDownPassword = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
    };

    const userPatchValidationSchema = yup.object({
        // no policy here: an existing password predating it must stay changeable
        current_password: yup
            .string()
            .required("Dieses Feld wird benötigt" as string),
        new_password: yup
            .string()
            .required("Dieses Feld wird benötigt" as string)
            .min(
                8,
                "Dein Passwort muss mindestens 8 Zeichen enthalten" as string
            )
            .max(
                50,
                "Dein Passwort darf maximal 50 Zeichen enthalten" as string
            )
            .matches(
                /^(?=.*[0-9])(?=.*[a-zA-Z])(?=\S+$).{8,50}$/,
                "Dein Passwort muss mindestens einen Buchstaben und eine Zahl enthalten" as string
            ),
        re_new_password: yup
            .string()
            .required("Dieses Feld wird benötigt." as string)
            .oneOf([yup.ref("new_password")], "Passwörter müssen gleich sein" as string),
    });

    const [initialSetUserPasswortValues] = useState<ISetUserPasswortForm>({
        new_password: "",
        re_new_password: "",
        current_password: ""
    });

    const setUserPasswordForm = useFormik({
        initialValues: initialSetUserPasswortValues,
        validationSchema: userPatchValidationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            const changed: unknown = await dispatch(setPassword(values));
            if (changed === true) setUserPasswordForm.resetForm();
        },
    });

    const fields: { name: keyof ISetUserPasswortForm; label: string; autoComplete: string; hint?: string }[] = [
        { name: 'current_password', label: 'Aktuelles Passwort', autoComplete: 'current-password' },
        { name: 'new_password', label: 'Neues Passwort', autoComplete: 'new-password', hint: PASSWORD_RULES },
        { name: 're_new_password', label: 'Neues Passwort wiederholen', autoComplete: 'new-password' },
    ];

    return (
        <SettingsSection title="Passwort ändern">
            <Stack
                component='form'
                id='set-user-password-form'
                noValidate
                onSubmit={setUserPasswordForm.handleSubmit}
                spacing={2}
            >
                {fields.map(({ name, label, autoComplete, hint }) => (
                    <TextField
                        key={name}
                        id={name}
                        name={name}
                        label={label}
                        value={setUserPasswordForm.values[name]}
                        onBlur={setUserPasswordForm.handleBlur}
                        error={
                            setUserPasswordForm.touched[name] &&
                            Boolean(setUserPasswordForm.errors[name])
                        }
                        helperText={
                            (getIn(setUserPasswordForm.touched, name) &&
                                getIn(setUserPasswordForm.errors, name)) || hint
                        }
                        onChange={setUserPasswordForm.handleChange}
                        fullWidth
                        autoComplete={autoComplete}
                        variant='outlined'
                        type={showPassword[name] ? 'text' : 'password'}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position='end'>
                                        <IconButton
                                            aria-label={`${label} ${showPassword[name] ? 'verbergen' : 'anzeigen'}`}
                                            onClick={() => handleClickShowPassword(name)}
                                            onMouseDown={handleMouseDownPassword}
                                            edge='end'
                                        >
                                            {showPassword[name] ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />
                ))}

                <FormActions>
                    <Button
                        type="button"
                        variant="outlined"
                        color="secondary"
                        onClick={() => setUserPasswordForm.resetForm()}
                    >
                        {"Verwerfen"}
                    </Button>
                    <Button
                        type='submit'
                        variant='contained'
                        loading={getAuthApi.loading}
                    >
                        {'Speichern'}
                    </Button>
                </FormActions>
            </Stack>
        </SettingsSection>
    );
}

export default Security;

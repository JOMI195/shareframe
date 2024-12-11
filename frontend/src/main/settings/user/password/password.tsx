import { Box, Button, Grid, IconButton, InputAdornment, TextField } from "@mui/material";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi } from "@/store/entities/authentication/authentication.slice";
import { useState } from "react";
import { getIn, useFormik } from "formik";
import { ISetUserPasswortForm } from "@/types";
import { setPassword } from "@/store/entities/authentication/authentication.actions";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

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
        current_password: yup
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
        onSubmit: (values) => {
            dispatch(setPassword(values));
            setUserPasswordForm.resetForm();
        },
    });

    return (
        <Box
            component='form'
            id='set-user-password-form'
            noValidate
            onSubmit={setUserPasswordForm.handleSubmit}
        >
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField
                        id='current_password'
                        name='current_password'
                        label={'Aktuelles Passwort'}
                        value={setUserPasswordForm.values.current_password}
                        onBlur={setUserPasswordForm.handleBlur}
                        error={
                            setUserPasswordForm.touched.current_password &&
                            Boolean(setUserPasswordForm.errors.current_password)
                        }
                        helperText={
                            getIn(setUserPasswordForm.touched, "current_password") &&
                            getIn(setUserPasswordForm.errors, "current_password")
                        }
                        onChange={setUserPasswordForm.handleChange}
                        fullWidth
                        autoComplete='password'
                        variant='outlined'
                        type={showPassword.current_password ? 'text' : 'password'}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        aria-label='toggle current password visibility'
                                        onClick={() =>
                                            handleClickShowPassword('current_password')
                                        }
                                        onMouseDown={handleMouseDownPassword}
                                        edge='end'
                                    >
                                        {showPassword.current_password ? (
                                            <VisibilityOff />
                                        ) : (
                                            <Visibility />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        id='new_password'
                        name='new_password'
                        label={'Neues Passwort'}
                        value={setUserPasswordForm.values.new_password}
                        onBlur={setUserPasswordForm.handleBlur}
                        error={
                            setUserPasswordForm.touched.new_password &&
                            Boolean(setUserPasswordForm.errors.new_password)
                        }
                        helperText={
                            getIn(setUserPasswordForm.touched, "new_password") &&
                            getIn(setUserPasswordForm.errors, "new_password")
                        }
                        onChange={setUserPasswordForm.handleChange}
                        fullWidth
                        autoComplete='password'
                        variant='outlined'
                        type={showPassword.new_password ? 'text' : 'password'}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        aria-label='toggle current password visibility'
                                        onClick={() =>
                                            handleClickShowPassword('new_password')
                                        }
                                        onMouseDown={handleMouseDownPassword}
                                        edge='end'
                                    >
                                        {showPassword.new_password ? (
                                            <VisibilityOff />
                                        ) : (
                                            <Visibility />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        id='re_new_password'
                        name='re_new_password'
                        label={'Neues Passwort wiederholen'}
                        value={setUserPasswordForm.values.re_new_password}
                        onBlur={setUserPasswordForm.handleBlur}
                        error={
                            setUserPasswordForm.touched.re_new_password &&
                            Boolean(setUserPasswordForm.errors.re_new_password)
                        }
                        helperText={
                            getIn(setUserPasswordForm.touched, "re_new_password") &&
                            getIn(setUserPasswordForm.errors, "re_new_password")
                        }
                        onChange={setUserPasswordForm.handleChange}
                        fullWidth
                        autoComplete='password'
                        variant='outlined'
                        type={showPassword.re_new_password ? 'text' : 'password'}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        aria-label='toggle current password visibility'
                                        onClick={() =>
                                            handleClickShowPassword('re_new_password')
                                        }
                                        onMouseDown={handleMouseDownPassword}
                                        edge='end'
                                    >
                                        {showPassword.re_new_password ? (
                                            <VisibilityOff />
                                        ) : (
                                            <Visibility />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>

                <Grid
                    item
                    xs={12}
                    container spacing={2}
                    justifyContent={"space-between"}
                >
                    <Grid item xs={12} md={5}
                        sx={{ order: { xs: 1, md: 2 } }}
                    >
                        <Button
                            type='submit'
                            fullWidth
                            form='set-user-password-form'
                            variant='contained'
                            disabled={getAuthApi.loading}
                        >
                            {'Speichern'}
                        </Button>
                    </Grid>

                    <Grid item xs={12} md={5}
                        sx={{ order: { xs: 2, md: 1 } }}
                    >
                        <Button
                            type="button"
                            fullWidth
                            variant="outlined"
                            color="secondary"
                            onClick={() => setUserPasswordForm.resetForm()}
                        >
                            {"Eingaben zurücksetzen"}
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Security;

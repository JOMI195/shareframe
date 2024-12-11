import { Box, Button, Checkbox, FormControlLabel, FormGroup, FormHelperText, Grid, TextField } from "@mui/material";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { useEffect, useState } from "react";
import { getIn, useFormik } from "formik";
import { IUser, IPatchUserForm } from "@/types";
import { updateMyUserData } from "@/store/entities/authentication/authentication.actions";

const Profile = () => {
    const dispatch = useAppDispatch();
    const me: IUser = useAppSelector(getMyUserDetails);
    const getAuthApi = useAppSelector(getApi);

    const userPatchValidationSchema = yup.object({
        username: yup
            .string()
            .strict(true)
            .trim("Der Nutzername darf keine Leerzeichen enthalten")
            .min(1, "Dein Nutzername muss mindestens ein Zeichen enthalten")
            .max(50, "Dein Nutzername darf maximal 50 Zeichen enthalten")
            .required("Dieses Feld wird benötigt"),
        account: yup.object().shape({
            recieves_newsletter: yup
                .boolean()
                .required("Dieses Feld wird benötigt")
        })
    });

    const [initialUserPatchValues, setInitialUserPatchValues] = useState<IPatchUserForm>({
        username: me.username,
        account: { recieves_newsletter: me.account.recieves_newsletter }
    });

    const userPatchForm = useFormik({
        initialValues: initialUserPatchValues,
        validationSchema: userPatchValidationSchema,
        enableReinitialize: true,
        onSubmit: (values) => {
            dispatch(updateMyUserData(values));
        },
    });

    useEffect(() => {
        setInitialUserPatchValues(
            {
                username: me.username,
                account: { recieves_newsletter: me.account.recieves_newsletter }
            }
        );
    }, [me]);

    useEffect(() => {
        userPatchForm.resetForm();
    }, [initialUserPatchValues]);

    return (
        <Box
            component='form'
            id='patch-user-form'
            noValidate
            onSubmit={userPatchForm.handleSubmit}
        >
            <Grid container spacing={3}>

                <Grid item xs={12}>
                    <TextField
                        id='username'
                        name='username'
                        label={'Nutzername'}
                        value={userPatchForm.values.username}
                        onBlur={userPatchForm.handleBlur}
                        error={
                            userPatchForm.touched.username &&
                            Boolean(userPatchForm.errors.username)
                        }
                        helperText={
                            getIn(userPatchForm.touched, "username") &&
                            getIn(userPatchForm.errors, "username")
                        }
                        onChange={userPatchForm.handleChange}
                        fullWidth
                        autoComplete='username'
                        variant='outlined'
                    />
                </Grid>

                <Grid item xs={12}>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={userPatchForm.values.account.recieves_newsletter}
                                    onChange={userPatchForm.handleChange}
                                    onBlur={userPatchForm.handleBlur}
                                    name="account.recieves_newsletter"
                                    size={"medium"}
                                />
                            }
                            label="Täglichen Witz-des-Tages als Newsletter erhalten"
                        />
                        {getIn(userPatchForm.touched, "account.recieves_newsletter") &&
                            getIn(userPatchForm.errors, "account.recieves_newsletter") && (
                                <FormHelperText error>
                                    {getIn(userPatchForm.errors, "account.recieves_newsletter")}
                                </FormHelperText>
                            )}
                    </FormGroup>
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
                            form='patch-user-form'
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
                            onClick={() => userPatchForm.resetForm()}
                        >
                            {"Eingaben zurücksetzen"}
                        </Button>
                    </Grid>
                </ Grid>
            </Grid>
        </Box>
    );
}

export default Profile;

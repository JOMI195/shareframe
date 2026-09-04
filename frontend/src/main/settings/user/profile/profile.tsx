import { Box, Button, Checkbox, FormControlLabel, FormGroup, FormHelperText, Grid, TextField } from "@mui/material";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { useMemo } from "react";
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
            friendship_user_searchable: yup
                .boolean()
                .required("Dieses Feld wird benötigt")
        })
    });

    const initialUserPatchValues: IPatchUserForm = useMemo(() => ({
        username: me.username,
        account: {
            friendship_user_searchable: me.account.friendship_user_searchable,
            friendship_user_search_code: me.account.friendship_user_search_code
        }
    }), [me.username, me.account.friendship_user_searchable, me.account.friendship_user_search_code]);

    const userPatchForm = useFormik({
        initialValues: initialUserPatchValues,
        validationSchema: userPatchValidationSchema,
        enableReinitialize: true,
        onSubmit: (values) => {
            dispatch(updateMyUserData(values));
        },
    });

    return (
        <Box
            component='form'
            id='patch-user-form'
            noValidate
            onSubmit={userPatchForm.handleSubmit}
        >
            <Grid container spacing={3}>

                <Grid size={12}>
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

                <Grid size={12}>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={userPatchForm.values.account.friendship_user_searchable}
                                    onChange={userPatchForm.handleChange}
                                    onBlur={userPatchForm.handleBlur}
                                    name="account.friendship_user_searchable"
                                    size={"medium"}
                                />
                            }
                            label="Freundschaftsanfragen erhalten"
                        />
                        {getIn(userPatchForm.touched, "account.friendship_user_searchable") &&
                            getIn(userPatchForm.errors, "account.friendship_user_searchable") && (
                                <FormHelperText error>
                                    {getIn(userPatchForm.errors, "account.friendship_user_searchable")}
                                </FormHelperText>
                            )}
                    </FormGroup>
                </Grid>

                <Grid container spacing={2} size={12} sx={{
                    justifyContent: "space-between"
                }}>
                    <Grid
                        sx={{ order: { xs: 1, md: 2 } }}
                        size={{
                            xs: 12,
                            md: 5
                        }}>
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

                    <Grid
                        sx={{ order: { xs: 2, md: 1 } }}
                        size={{
                            xs: 12,
                            md: 5
                        }}>
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

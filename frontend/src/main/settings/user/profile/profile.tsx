import { Box, Button, Divider, Stack, Switch, TextField, Typography } from "@mui/material";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { useMemo } from "react";
import { getIn, useFormik } from "formik";
import { IUser, IPatchUserForm } from "@/types";
import { updateMyUserData } from "@/store/entities/authentication/authentication.actions";
import SettingsSection from "@/common/components/settings/settingsSection";
import FormActions from "@/common/components/settings/formActions";
import ProfileAvatar from "../avatar/avatar";

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
        <SettingsSection title="Profil" description="So sehen dich deine Freunde.">
            <ProfileAvatar />
            <Divider />
            <Stack
                component='form'
                id='patch-user-form'
                noValidate
                onSubmit={userPatchForm.handleSubmit}
                spacing={2}
            >
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

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                        <Typography variant="body1">Freundschaftsanfragen erhalten</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Andere finden dich über deinen Nutzernamen und können dir Anfragen schicken.
                        </Typography>
                    </Box>
                    <Switch
                        checked={userPatchForm.values.account.friendship_user_searchable}
                        onChange={userPatchForm.handleChange}
                        onBlur={userPatchForm.handleBlur}
                        name="account.friendship_user_searchable"
                        slotProps={{ input: { 'aria-label': 'Freundschaftsanfragen erhalten' } }}
                    />
                </Box>

                <FormActions>
                    <Button
                        type="button"
                        variant="outlined"
                        color="secondary"
                        onClick={() => userPatchForm.resetForm()}
                    >
                        {"Zurücksetzen"}
                    </Button>
                    <Button
                        type='submit'
                        variant='contained'
                        disabled={getAuthApi.loading}
                    >
                        {'Speichern'}
                    </Button>
                </FormActions>
            </Stack>
        </SettingsSection>
    );
}

export default Profile;

import { Button, Divider, Stack, Switch, TextField } from "@mui/material";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { useMemo, useState } from "react";
import { getIn, useFormik } from "formik";
import { IUser } from "@/types";
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
            .trim("Der Nutzername darf nicht mit einem Leerzeichen beginnen oder enden")
            .min(1, "Dein Nutzername muss mindestens ein Zeichen enthalten")
            .max(50, "Dein Nutzername darf maximal 50 Zeichen enthalten")
            .required("Dieses Feld wird benötigt"),
    });

    const initialUserPatchValues = useMemo(() => ({ username: me.username }), [me.username]);

    const userPatchForm = useFormik({
        initialValues: initialUserPatchValues,
        validationSchema: userPatchValidationSchema,
        enableReinitialize: true,
        // Awaited, so isSubmitting lasts until the server answered.
        onSubmit: async (values) => {
            await dispatch(updateMyUserData(values));
        },
    });

    // Shown right away; the stored value takes over again once the server answered.
    const [pendingSearchable, setPendingSearchable] = useState<boolean | null>(null);
    const searchable = pendingSearchable ?? me.account.friendship_user_searchable;

    const handleSearchableChange = async (checked: boolean) => {
        if (pendingSearchable !== null) return;
        setPendingSearchable(checked);
        await dispatch(updateMyUserData({ account: { friendship_user_searchable: checked } }));
        setPendingSearchable(null);
    };

    return (
        <>
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

                    <FormActions>
                        <Button
                            type="button"
                            variant="outlined"
                            color="secondary"
                            disabled={!userPatchForm.dirty}
                            onClick={() => userPatchForm.resetForm()}
                        >
                            {"Verwerfen"}
                        </Button>
                        <Button
                            type='submit'
                            variant='contained'
                            disabled={!userPatchForm.dirty}
                            loading={getAuthApi.loading && userPatchForm.isSubmitting}
                        >
                            {'Speichern'}
                        </Button>
                    </FormActions>
                </Stack>
            </SettingsSection>
            <SettingsSection
                title="Freundschaftsanfragen"
                description="Andere können dir über deinen Freundescode Anfragen schicken."
                action={
                    <Switch
                        checked={searchable}
                        onChange={(event) => handleSearchableChange(event.target.checked)}
                        slotProps={{ input: { 'aria-label': 'Freundschaftsanfragen erhalten' } }}
                    />
                }
            />
        </>
    );
}

export default Profile;

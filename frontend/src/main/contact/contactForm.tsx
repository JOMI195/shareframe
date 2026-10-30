import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { getIn, useFormik } from "formik";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { sendContactEmail } from "@/store/entities/contact/contact.actions";
import { getApi } from "@/store/entities/contact/contact.slice";
import { getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import SettingsSection from "@/common/components/settings/settingsSection";
import FormActions from "@/common/components/settings/formActions";

export default function ContactForm() {
    const dispatch = useAppDispatch();
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    const me = useAppSelector(getMyUserDetails);
    const { loading } = useAppSelector(getApi);

    const [initialValues] = useState({
        name: "",
        subject: "",
        email: "",
        message: "",
    });

    const validationSchema = yup.object({
        name: yup
            .string()
            .required("Bitte gib deinen Namen an"),
        subject: yup
            .string()
            .required("Bitte gib einen Betreff an"),
        email: yup
            .string()
            .email("Bitte gib eine gültige E-Mail-Adresse an")
            .required("Bitte gib deine E-Mail-Adresse an"),
        message: yup
            .string()
            .required("Bitte schreib uns eine Nachricht"),
    });

    const contactForm = useFormik({
        initialValues: initialValues,
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            const sent: unknown = await dispatch(sendContactEmail(values));
            if (sent === true) contactForm.resetForm();
        },
    });

    const { values, touched, setFieldValue } = contactForm;
    // The profile can arrive after the first render.
    useEffect(() => {
        if (loggedIn && me.email && !values.email && !touched.email) setFieldValue("email", me.email, false);
    }, [loggedIn, me.email, values.email, touched.email, setFieldValue]);

    const fields = [
        { name: "name", label: "Dein Name", autoComplete: "name" },
        { name: "email", label: "E-Mail-Adresse", autoComplete: "email", type: "email" },
        { name: "subject", label: "Betreff", autoComplete: "off" },
        { name: "message", label: "Nachricht", autoComplete: "off", multiline: true },
    ] as const;

    const renderField = ({ name, label, autoComplete, ...rest }: (typeof fields)[number]) => (
        <TextField
            key={name}
            id={name}
            name={name}
            label={label}
            value={contactForm.values[name]}
            onBlur={contactForm.handleBlur}
            error={contactForm.touched[name] && Boolean(contactForm.errors[name])}
            helperText={getIn(contactForm.touched, name) && getIn(contactForm.errors, name)}
            onChange={contactForm.handleChange}
            fullWidth
            variant="outlined"
            autoComplete={autoComplete}
            {...("type" in rest && { type: rest.type })}
            {...("multiline" in rest && { multiline: true, rows: 10 })}
        />
    );

    const mailLink = <a href="mailto:info@shareframe.de">info@shareframe.de</a>;

    if (loggedIn) {
        return (
            <Container maxWidth="md" sx={{ px: { xs: 0, sm: 3 }, pb: { xs: 4, sm: 10 } }}>
                <Typography variant="h4" component="h1" sx={{ mb: { xs: 1, sm: 2 } }}>
                    Kontaktiere uns
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 } }}>
                    Hast du Fragen, Anregungen oder möchtest einen Bug melden? Schreib uns über das Formular oder direkt an {mailLink}.
                </Typography>
                <SettingsSection title="Nachricht">
                    <Stack component="form" id="contact-form" noValidate onSubmit={contactForm.handleSubmit} spacing={2}>
                        {fields.map(renderField)}
                        <FormActions>
                            <Button type="submit" variant="contained" loading={loading}>
                                Nachricht absenden
                            </Button>
                        </FormActions>
                    </Stack>
                </SettingsSection>
            </Container>
        );
    }

    return (
        <Box
            component="form"
            id="contact-form"
            noValidate
            onSubmit={contactForm.handleSubmit}
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                mt: 3
            }}
        >
            <Grid
                container
                spacing={2}
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%"
                }}
            >
                <Grid
                    size={{
                        xs: 12,
                        lg: 7
                    }}>
                    <Typography variant="h3" component="h1">
                        Kontaktiere uns
                    </Typography>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        lg: 7
                    }}>
                    <Typography variant="body1" sx={{ fontSize: "1.1rem" }}>
                        Hast du Fragen, Anregungen oder möchtest einen Bug melden? Nutze einfach das folgende Formular, um uns dein Anliegen mitzuteilen. Wir freuen uns auf dein Feedback und werden uns so schnell wie möglich bei dir melden.
                    </Typography>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        lg: 7
                    }}>
                    <Typography variant="body1" sx={{ mt: 2, mb: 5 }}>
                        Alternativ kannst du uns auch direkt eine E-Mail an{" "}
                        {mailLink} senden.
                    </Typography>
                </Grid>
                {fields.map((field) => (
                    <Grid key={field.name} size={{ xs: 12, lg: 7 }}>
                        {renderField(field)}
                    </Grid>
                ))}
                <Grid
                    size={{
                        xs: 12,
                        lg: 7
                    }}
                    sx={{
                        display: "flex",
                        justifyContent: "center"
                    }}>
                    <Button
                        sx={{ maxWidth: 300 }}
                        type="submit"
                        fullWidth
                        form="contact-form"
                        variant="contained"
                        loading={loading}
                    >
                        Nachricht absenden
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}

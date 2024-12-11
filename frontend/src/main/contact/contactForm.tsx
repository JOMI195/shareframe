import { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { getIn, useFormik } from "formik";
import * as yup from "yup";
import { useAppDispatch } from "@/store";
import { sendContactEmail } from "@/store/entities/contact/contact.actions";

export default function ContactForm() {
    const dispatch = useAppDispatch();

    const [initialValues] = useState({
        name: "",
        subject: "",
        email: "",
        message: "",
    });

    const validationSchema = yup.object({
        name: yup
            .string()
            .required("Name is required"),
        subject: yup
            .string()
            .required("Name is required"),
        email: yup
            .string()
            .email("Enter a valid email")
            .required("Email is required"),
        message: yup
            .string()
            .required("Message is required"),
    });

    const contactForm = useFormik({
        initialValues: initialValues,
        validationSchema: validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            dispatch(sendContactEmail(values));
            contactForm.resetForm();
        },
    });

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
                <Grid item xs={12} lg={7}>
                    <Typography variant="h2">
                        Kontaktiere uns
                    </Typography>
                </Grid>
                <Grid item xs={12} lg={7}>
                    <Typography variant="h6">
                        Hast du Fragen, Anregungen oder möchtest einen Bug melden? Nutze einfach das folgende Formular, um uns dein Anliegen mitzuteilen. Wir freuen uns auf dein Feedback und werden uns so schnell wie möglich bei dir melden. Bitte gib deinen Namen den Betreff, deine E-Mail-Adresse und deine Nachricht an uns an.
                    </Typography>
                </Grid>
                <Grid item xs={12} lg={7}>
                    <Typography variant="body1" sx={{ mt: 2, mb: 5 }}>
                        Alternativ kannst du uns auch direkt eine E-Mail an{" "}
                        <a href="mailto:info@der-witz-des-tages.de">info@der-witz-des-tages.de</a> senden.
                    </Typography>
                </Grid>
                <Grid item xs={12} lg={7}>
                    <TextField
                        id="name"
                        name="name"
                        label="Dein Name"
                        value={contactForm.values.name}
                        onBlur={contactForm.handleBlur}
                        error={
                            contactForm.touched.name && Boolean(contactForm.errors.name)
                        }
                        helperText={
                            getIn(contactForm.touched, "name") &&
                            getIn(contactForm.errors, "name")
                        }
                        onChange={contactForm.handleChange}
                        fullWidth
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} lg={7}>
                    <TextField
                        id="email"
                        name="email"
                        label="Email"
                        value={contactForm.values.email}
                        onBlur={contactForm.handleBlur}
                        error={
                            contactForm.touched.email && Boolean(contactForm.errors.email)
                        }
                        helperText={
                            getIn(contactForm.touched, "email") &&
                            getIn(contactForm.errors, "email")
                        }
                        onChange={contactForm.handleChange}
                        fullWidth
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} lg={7}>
                    <TextField
                        id="subject"
                        name="subject"
                        label="Betreff"
                        value={contactForm.values.subject}
                        onBlur={contactForm.handleBlur}
                        error={
                            contactForm.touched.subject && Boolean(contactForm.errors.subject)
                        }
                        helperText={
                            getIn(contactForm.touched, "subject") &&
                            getIn(contactForm.errors, "subject")
                        }
                        onChange={contactForm.handleChange}
                        fullWidth
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} lg={7}>
                    <TextField
                        id="message"
                        name="message"
                        label="Message"
                        value={contactForm.values.message}
                        onBlur={contactForm.handleBlur}
                        error={
                            contactForm.touched.message && Boolean(contactForm.errors.message)
                        }
                        helperText={
                            getIn(contactForm.touched, "message") &&
                            getIn(contactForm.errors, "message")
                        }
                        onChange={contactForm.handleChange}
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={10}
                    />
                </Grid>
                <Grid item xs={12} lg={7} display={"flex"} justifyContent={"center"}>
                    <Button
                        sx={{ maxWidth: 300 }}
                        type="submit"
                        fullWidth
                        form="contact-form"
                        variant="contained"
                    >
                        Nachricht absenden
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}

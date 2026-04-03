import { getContactUrl } from "@/assets/endpoints/app/appEndpoints";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router";

const Contact = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate("../" + getContactUrl());
    };
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Typography sx={{ pb: 2 }} variant="body1">
                Hast du Fragen, Anregungen oder möchtest einen Bug melden? Kontaktiere uns.
            </Typography>
            <Button
                onClick={handleClick}
                variant='outlined'
                sx={{ fontWeight: "bold" }}
            >
                Zum Kontaktformular
            </Button>
        </Box>
    );
}

export default Contact;
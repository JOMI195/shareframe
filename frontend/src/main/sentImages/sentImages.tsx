import React, { useEffect } from "react";
import { Box, Container } from "@mui/material";
import Dialogs from "./dialogs/dialogs";
import SentImagesGallery from "./gallery/sentImagesGallery";
import { fetchSentImages } from "@/store/entities/images/images.actions";
import { useAppDispatch } from "@/store";

const SentImages: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchSentImages());
    }, []);

    return (
        <Container maxWidth={"md"} disableGutters>
            <Box sx={{
                height: "100%",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column"
            }}>
                <SentImagesGallery />
            </Box>
            <Dialogs />
        </Container>
    );
}

export default SentImages;
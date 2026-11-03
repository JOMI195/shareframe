import React, { useEffect } from "react";
import { Box, Container } from "@mui/material";
import { Actions } from "./actions/actions";
import Dialogs from "./dialogs/dialogs";
import FramesGallery from "./gallery/framesGallery";
import { useAppDispatch } from "@/store";
import { fetchframes, fetchFramesIfStale } from "@/store/entities/frames/frames.actions";
import HiddenPageTitle from "@/common/components/hiddenPageTitle";
import PageActionsBar from "@/common/components/pageActionsBar";
import { useFramesPageActions } from "./actions/useFramesPageActions";

const Frames: React.FC = () => {
    const dispatch = useAppDispatch();
    const { primary } = useFramesPageActions();

    useEffect(() => {
        dispatch(fetchframes());
    }, [dispatch]);

    useEffect(() => {
        const getFrames = () => {
            dispatch(fetchFramesIfStale());
        };

        window.addEventListener('focus', getFrames);

        return () => {
            window.removeEventListener('focus', getFrames);
        };
    }, [dispatch]);

    return (
        <Container maxWidth={"md"} disableGutters>
            <HiddenPageTitle>Bilderrahmen</HiddenPageTitle>
            <Box sx={{
                height: "100%",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column"
            }}>
                <PageActionsBar actions={[primary]} sx={{ mb: 2 }} />
                <FramesGallery />
            </Box>
            <Actions />
            <Dialogs />
        </Container>
    );
}

export default Frames;
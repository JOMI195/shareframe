import React, { useEffect } from "react";
import { Box, Container } from "@mui/material";
import { Actions } from "./actions/actions";
import Dialogs from "./dialogs/dialogs";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchImages, setImagesPaginatedPage } from "@/store/entities/images/images.actions";
import { fetchFriendshipsIfStale } from "@/store/entities/friendships/friendships.actions";
import ImagesGallery from "./gallery/imagesGallery";
import { getImagesPaginated, getImagesPaginatedPageSize } from "@/store/entities/images/images.slice";
import { closeSelectionDialog, getUploadRequested, openCreateImageDialog } from "@/store/ui/images/images.slice";
import HiddenPageTitle from "@/common/components/hiddenPageTitle";

const Images: React.FC = () => {
    const dispatch = useAppDispatch();

    const page = useAppSelector(getImagesPaginated).page;
    const pageSize = useAppSelector(getImagesPaginatedPageSize);
    const uploadRequested = useAppSelector(getUploadRequested);

    useEffect(() => {
        if (uploadRequested) dispatch(openCreateImageDialog());
    }, [dispatch, uploadRequested]);

    // Reset on leave, not on entry: a reset on entry refetches after the first fetch.
    useEffect(() => () => {
        dispatch(setImagesPaginatedPage(1));
        dispatch(closeSelectionDialog());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchFriendshipsIfStale());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchImages(page, pageSize));
    }, [dispatch, page, pageSize]);

    return (
        <Container maxWidth={"md"} disableGutters>
            <HiddenPageTitle>Fotos</HiddenPageTitle>
            <Box
                sx={{
                    height: "100%",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <ImagesGallery />
            </Box>
            <Actions />
            <Dialogs />
        </Container>
    );
};

export default Images;
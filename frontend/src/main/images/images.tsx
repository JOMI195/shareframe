import React, { useEffect } from "react";
import { Box, Container } from "@mui/material";
import { Actions, DesktopActions } from "./actions/actions";
import Dialogs from "./dialogs/dialogs";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchImages, setImagesPaginatedPage } from "@/store/entities/images/images.actions";
import { fetchFriendshipsIfStale } from "@/store/entities/friendships/friendships.actions";
import ImagesGallery from "./gallery/imagesGallery";
import { getImagesPaginated, getImagesPaginatedPageSize } from "@/store/entities/images/images.slice";
import { closeSelectionDialog, getUploadRequested, openCreateImageDialog, openSelectionDialog } from "@/store/ui/images/images.slice";
import { useLocation, useNavigate } from "react-router";
import HiddenPageTitle from "@/common/components/hiddenPageTitle";

const Images: React.FC = () => {
    const dispatch = useAppDispatch();

    const page = useAppSelector(getImagesPaginated).page;
    const pageSize = useAppSelector(getImagesPaginatedPageSize);
    const uploadRequested = useAppSelector(getUploadRequested);

    useEffect(() => {
        if (uploadRequested) dispatch(openCreateImageDialog());
    }, [dispatch, uploadRequested]);

    // Sent here from a friend card: pick photos for that friend.
    const location = useLocation();
    const navigate = useNavigate();
    const sendTo = (location.state as { sendTo?: string } | null)?.sendTo;
    useEffect(() => {
        if (!sendTo) return;
        dispatch(openSelectionDialog({ receiver: sendTo }));
        // Cleared, so going back or reloading does not start it again.
        navigate(location.pathname, { replace: true, state: null });
    }, [dispatch, navigate, location.pathname, sendTo]);

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
            <DesktopActions />
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
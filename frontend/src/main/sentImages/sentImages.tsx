import React, { useCallback, useEffect } from "react";
import { Box, Container } from "@mui/material";
import Dialogs from "./dialogs/dialogs";
import SentImagesGallery from "./gallery/sentImagesGallery";
import { fetchSentImagesPaginated } from "@/store/entities/images/images.actions";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchFriendships } from "@/store/entities/friendships/friendships.actions";
import { getSentImagesFilters, getSentImagesPaginated, getSentImagesPaginatedPageSize } from "@/store/entities/images/images.slice";

const SentImages: React.FC = () => {
    const dispatch = useAppDispatch();

    const sentImagesPaginated = useAppSelector(getSentImagesPaginated);
    const pageSize = useAppSelector(getSentImagesPaginatedPageSize);
    const sentImagesFilters = useAppSelector(getSentImagesFilters);

    const currentPage = sentImagesPaginated.page;

    const fetchSentImagesPaginatedWithFilters = useCallback(() => {
        dispatch(fetchSentImagesPaginated(
            currentPage,
            pageSize,
            {
                status: sentImagesFilters.status,
                shipping: sentImagesFilters.shipping,
                sender: sentImagesFilters.sender,
                receiver: sentImagesFilters.receiver,
            }
        ));
    }, [dispatch, currentPage, pageSize, sentImagesFilters]);

    useEffect(() => {
        fetchSentImagesPaginatedWithFilters();
        dispatch(fetchFriendships());
    }, [fetchSentImagesPaginatedWithFilters]);

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
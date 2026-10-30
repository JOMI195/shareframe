import { Box, Button, Paper, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearSelection, getDialogs, selectImages } from "@/store/ui/images/images.slice";
import { getImagesPaginated } from "@/store/entities/images/images.slice";

const SelectionBar = () => {
    const dispatch = useAppDispatch();
    const selectedImages = useAppSelector(getDialogs).selection.selectedImages;
    const pageImages = useAppSelector(getImagesPaginated).results;

    const selectedIds = new Set(selectedImages.map((image) => image.id));
    const allOnPageSelected = pageImages.length > 0 && pageImages.every((image) => selectedIds.has(image.id));
    const count = selectedImages.length;

    return (
        <Paper
            elevation={2}
            sx={{
                position: "sticky",
                top: (theme) => theme.layout.appbar.height + 8,
                zIndex: 2,
                px: 2,
                py: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0 }} role="status">
                <Typography variant="subtitle2">
                    {count === 0 ? "Nichts ausgewählt" : `${count} ausgewählt`}
                </Typography>
                {count === 0 && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Tippe Fotos an, um sie auszuwählen
                    </Typography>
                )}
            </Box>
            {allOnPageSelected ? (
                <Button size="small" onClick={() => dispatch(clearSelection())}>
                    Auswahl aufheben
                </Button>
            ) : (
                <Button size="small" onClick={() => dispatch(selectImages(pageImages))} disabled={pageImages.length === 0}>
                    Alle auswählen
                </Button>
            )}
        </Paper>
    );
};

export default SelectionBar;

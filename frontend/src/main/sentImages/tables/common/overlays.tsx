import { Box, Skeleton, Typography } from "@mui/material";

export const LoadingSkeletonOverly = () => (
    <Box
        sx={{
            height: "max-content"
        }}
    >
        {[...Array(10)].map((_val, index) => (
            <Skeleton key={index} variant="rectangular" sx={{ my: 2, mx: 1 }} />
        ))}
    </Box>
);


interface NoRowsOverlayProps {
    message: string;
}

export const NoRowsOverlay: React.FC<NoRowsOverlayProps> = ({ message }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                padding: 2,
                textAlign: 'center',
            }}
        >
            <Typography variant="body1" color="text.secondary">
                {message}
            </Typography>
        </Box>
    );
};

import { FC } from 'react';
import { Card, Skeleton, Grid, useTheme } from "@mui/material";

interface LoadingSkeletonProps {
    count?: number;
}

const LoadingSkeleton: FC<LoadingSkeletonProps> = ({ count = 1 }) => {
    const theme = useTheme();

    const LoadingSkeletonCard = () => (
        <Card
            sx={{
                position: "relative",
                width: "100%",
                height: "150px",
                boxSizing: "border-box",
            }}
        >
            <Skeleton
                variant="rectangular"
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: 1,
                    backgroundColor: theme.palette.action.hover,
                }}
            />
        </Card>
    );

    return (
        <Grid container spacing={1} sx={{ mb: 2 }}>
            {Array.from({ length: count }).map((_, index) => (
                <Grid item key={index} xs={12}>
                    <LoadingSkeletonCard />
                </Grid>
            ))}
        </Grid>
    );
};

export default LoadingSkeleton;
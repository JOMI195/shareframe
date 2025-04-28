import React, { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    useTheme,
    Pagination,
    Stack,
    Skeleton,
    Grid,
    CardActions,
    Tooltip,
    IconButton,
    Chip,
    Button,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { IFrame } from "@/types";
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import WifiIcon from '@mui/icons-material/Wifi';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getApi, getFrames } from "@/store/entities/frames/frames.slice";
import { openRequestOTPDialog, openUnregisterFrameDialog } from "@/store/ui/frames/frames.slice";
import { isFrameActive } from "@/common/utils/frame";
import DataNotFound from "@/common/components/dataNotFound";

const ITEMS_PER_PAGE = 6;

const FramesGallery: React.FC = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const frames: IFrame[] = useAppSelector(getFrames);
    const loading = useAppSelector(getApi).loading;

    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(frames.length / ITEMS_PER_PAGE);
    const currentFrames = frames.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const unregisterFrameButtonClickHandle = (frame: IFrame) => {
        dispatch(openUnregisterFrameDialog({ frameId: frame.id }))
    }

    const handlePageChange = (
        _event: React.ChangeEvent<unknown>,
        page: number
    ) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const LoadingSkeletonCard = () => (
        <Card
            sx={{
                position: "relative",
                width: "100%",
                paddingTop: "100%",
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

    const FrameCard = ({ frame }: { frame: IFrame }) => {
        const hasConnection = isFrameActive(frame);
        const ipAddress = frame.local_ip_address;

        return (
            <Card>
                <CardContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                    }}
                >
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                        {frame.public_serial_number}
                    </Typography>
                </CardContent>
                <CardActions>
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        width: "100%"
                    }}>
                        <Stack width={"100%"} direction="column" px={2} spacing={1}>
                            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                                <Typography>
                                    Status:
                                </Typography>
                                <Chip
                                    icon={<WifiIcon />}
                                    label={hasConnection ? "Online" : "Offline"}
                                    color={hasConnection ? "success" : "error"}
                                    size="small"
                                    sx={{
                                        height: "28px"
                                    }}
                                />
                            </Stack>
                            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                                <Typography>
                                    Einstellungen:
                                </Typography>
                                <Tooltip title={"Öffne Bilderrahmen Einstellungen"}>
                                    <Button
                                        variant="contained"
                                        color={"secondary"}
                                        size="small"
                                        onClick={() => window.open(`http://${ipAddress}`, "_blank")}
                                        disabled={(ipAddress === null || ipAddress === undefined) ? true : false}
                                        startIcon={<OpenInNewIcon />}
                                        sx={{
                                            height: "28px"
                                        }}
                                    >
                                        {"Öffnen"}
                                    </Button>
                                </Tooltip>
                            </Stack>
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                <Tooltip title={"Bilderrahmen abmelden"}>
                                    <IconButton
                                        onClick={() => { unregisterFrameButtonClickHandle(frame) }}
                                        aria-label="delete"
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={"OTP generieren"}>
                                    <IconButton
                                        aria-label="generate otp"
                                        onClick={() => dispatch(openRequestOTPDialog({ frameId: frame.id }))}
                                    >
                                        <KeyIcon />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </Box>
                </CardActions>
            </Card>
        );
    };


    return (
        <Stack spacing={2}>
            <Box sx={{ px: 2 }}>
                {loading ? (
                    <Grid container spacing={2}>
                        {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                            <Grid item key={index} xs={12} md={4}>
                                <LoadingSkeletonCard />
                            </Grid>
                        ))}
                    </Grid>
                ) : currentFrames.length !== 0 ? (
                    <Grid container spacing={2}>
                        {currentFrames
                            .map((frame) => (
                                <Grid item key={frame.id} xs={12} md={4}>
                                    <FrameCard frame={frame} />
                                </Grid>
                            ))}
                    </Grid>
                ) : (
                    <DataNotFound notFoundMessage={"Keine hinzugefügten Bilderrahmen vorhanden"} />
                )}
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 2,
                }}
            >
                {loading ? (
                    <Skeleton width={200} height={40} />
                ) : (
                    <>
                        {totalPages > 1 && (
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                            />
                        )}

                        <Typography variant="subtitle2" color="textSecondary" textAlign="center">
                            {frames.length} Bilderrahmen
                        </Typography>
                    </>
                )}
            </Box>
        </Stack>
    );
};

export default FramesGallery;

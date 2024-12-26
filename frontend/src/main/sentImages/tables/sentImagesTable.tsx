import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { Box, IconButton, Stack, Typography, useMediaQuery, useTheme, TextField, Button, Grid } from "@mui/material";
import { ISentImage } from "@/types";
import { LoadingSkeletonOverly, NoRowsOverlay } from "./common/overlays";
import { DataGrid, GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import { getApi, getSentImages } from "@/store/entities/images/images.slice";
import { fetchSentImages } from "@/store/entities/images/images.actions";
import Tooltip from '@mui/material/Tooltip';
import AuthenticatedImage from "@/common/components/authenticatedImage";
import { openDeactivateSendImageFrameDialog, openPreviewImageDialog } from "@/store/ui/images/images.slice";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HideImageIcon from '@mui/icons-material/HideImage';
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

export interface ISentImagesTableRowData extends ISentImage {
    table_id: number;
    isExpired: boolean;
}

interface SentImagesTableProps {
}

type StatusFilter = 'all' | 'active' | 'expired';

const SentImagesTable: React.FC<SentImagesTableProps> = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const sentImages = useAppSelector(getSentImages);
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getApi).loading;

    const matches = useMediaQuery(theme.breakpoints.up('md'));
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [senderFilter, setSenderFilter] = useState('');
    const [receiverFilter, setReceiverFilter] = useState('');
    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});

    const disableSentImageButtonClickHandle = (row: ISentImagesTableRowData) => {
        dispatch(openDeactivateSendImageFrameDialog({ sentImageId: row.id }))
    }

    const tableColumns: GridColDef[] = [
        {
            field: 'image',
            headerName: "Bild",
            width: 100,
            sortable: false,
            renderCell: ({ row }) => (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <AuthenticatedImage
                        url={MEDIA_BASE_URL + row.image.url}
                        alt={row.image.name}
                        style={{ maxWidth: "80px", maxHeight: "80px", objectFit: "contain" }}
                        onClick={() => dispatch(openPreviewImageDialog({ url: MEDIA_BASE_URL + row.image.url }))}
                    />
                </Box>
            ),
        },
        {
            field: 'reciever',
            headerName: "Empfänger",
            type: 'string',
            minWidth: 160,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
            renderCell: ({ row }) => {
                const isMySentImage = row.reciever === user.me.username;
                return isMySentImage ? "Du" : row.reciever
            }
        },
        {
            field: 'sender',
            headerName: "Versender",
            type: 'string',
            minWidth: 160,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
            renderCell: ({ row }) => {
                const isMySentImage = row.sender === user.me.username;
                return isMySentImage ? "Du" : row.sender
            }
        },
        {
            field: 'isExpired',
            headerName: "Status",
            type: 'boolean',
            minWidth: 150,
            flex: 0.5,
            align: 'left',
            headerAlign: 'center',
            renderCell: (params) => {
                const isExpired = params.row.isExpired;
                return (
                    <Tooltip title={isExpired ? "Abgelaufen" : "Aktiv"}>
                        {isExpired ? (
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <VisibilityOffIcon sx={{ color: theme.palette.error.main, mr: 1 }} />
                                <Typography>{"Abgelaufen"}</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <VisibilityIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                                <Typography>{"Aktiv"}</Typography>
                            </Box>
                        )}
                    </Tooltip>
                );
            },
        },
        {
            field: 'sent_at',
            headerName: "Gesendet am",
            type: 'string',
            minWidth: 160,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: 'expires_at',
            headerName: "Läuft ab am",
            type: 'string',
            minWidth: 170,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: "actions",
            headerName: "Aktionen",
            width: 100,
            align: "center",
            headerAlign: 'center',
            sortable: false,
            renderCell: ({ row }) => (
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%"
                }}>
                    <Stack direction="row">
                        {!row.isExpired && (
                            <Tooltip title={"Foto deaktivieren"}>
                                <IconButton
                                    onClick={() => { disableSentImageButtonClickHandle(row) }}
                                    aria-label="delete"
                                    size="medium"
                                >
                                    <HideImageIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Box>
            )
        },
    ];

    const tableRows = sentImages.map((sentImage: ISentImage, index: number): ISentImagesTableRowData => {
        const expiryDate = new Date(sentImage.expires_at);
        const isExpired = expiryDate < new Date();

        return ({
            table_id: index + 1,
            id: sentImage.id,
            sender: sentImage.sender,
            reciever: sentImage.reciever,
            image: sentImage.image,
            sent_at: formatGermanDateTime(new Date(sentImage.sent_at)),
            expires_at: formatGermanDateTime(new Date(sentImage.expires_at)),
            isExpired
        })
    });

    const filteredRows = tableRows.filter(row => {
        const matchesStatus =
            statusFilter === 'all' ? true :
                statusFilter === 'active' ? !row.isExpired :
                    row.isExpired;

        const matchesSender =
            !senderFilter ||
            (row.sender === user.me.username && "Du".toLowerCase().includes(senderFilter.toLowerCase())) ||
            row.sender.toLowerCase().includes(senderFilter.toLowerCase());

        const matchesReceiver =
            !receiverFilter ||
            (row.reciever === user.me.username && "Du".toLowerCase().includes(receiverFilter.toLowerCase())) ||
            row.reciever.toLowerCase().includes(receiverFilter.toLowerCase());

        return matchesStatus && matchesSender && matchesReceiver;
    });

    useEffect(() => {
        if (!matches) {
            setColumnVisibilityModel({
                image: true,
                reciever: true,
                sender: true,
                sent_at: false,
                isExpired: true,
                expires_at: true,
            });
        } else {
            setColumnVisibilityModel({
                image: true,
                reciever: true,
                sender: true,
                sent_at: true,
                isExpired: true,
                expires_at: true,
            });
        }
    }, [matches]);

    useEffect(() => {
        dispatch(fetchSentImages());
    }, []);

    const handleClearFilters = () => {
        setStatusFilter('all');
        setSenderFilter('');
        setReceiverFilter('');
    };

    const filterControls = (
        <Box sx={{ width: '100%', mb: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel id="status-filter-label">Status Filter</InputLabel>
                        <Select
                            labelId="status-filter-label"
                            value={statusFilter}
                            label="Status Filter"
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        >
                            <MenuItem value="all">Alle Bilder</MenuItem>
                            <MenuItem value="active">Nur aktive</MenuItem>
                            <MenuItem value="expired">Nur abgelaufene</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                    <TextField
                        fullWidth
                        label="Suche Empfänger"
                        value={receiverFilter}
                        onChange={(e) => setReceiverFilter(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <TextField
                        fullWidth
                        label="Suche Versender"
                        value={senderFilter}
                        onChange={(e) => setSenderFilter(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleClearFilters}
                        startIcon={<HideImageIcon />}
                        sx={{ height: '56px' }}
                    >
                        {"Zurücksetzen"}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );

    return (
        <Box sx={{ width: '100%' }}>
            {filterControls}
            <DataGrid
                rows={filteredRows}
                columns={tableColumns}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                checkboxSelection={false}
                disableRowSelectionOnClick
                disableColumnMenu
                columnVisibilityModel={columnVisibilityModel}
                slots={{
                    loadingOverlay: LoadingSkeletonOverly,
                    noRowsOverlay: () => <NoRowsOverlay message="Bisher keine Bilder gesendet" />,
                }}
                loading={loading}
                sx={{ '--DataGrid-overlayHeight': '300px' }}
            />
        </Box>
    );
}

export default SentImagesTable;
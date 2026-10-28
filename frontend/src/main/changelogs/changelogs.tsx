import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Container,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Pagination,
    Skeleton,
    useTheme,
    useMediaQuery,
    Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useChangelogs } from '@/hooks/changelogs/useChangelogs';
import { useMinimumLoading } from '@/hooks/loading/useMinimumLoading';
import DataNotFound from '@/common/components/dataNotFound';
import MarkdownImagesIntercept from '@/common/utils/markdown/markdownImagesIntercept';

const ITEMS_PER_PAGE = 10;

const Changelogs: React.FC = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const {
        isLoading,
        changelogs,
        sortedChangelogIds,
        loadChangelogsByIds,
        cleanUpdDeactivatedIds
    } = useChangelogs();

    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(sortedChangelogIds.length / ITEMS_PER_PAGE);
    // A refetch of the ids can shrink the list below the current page.
    const page = Math.min(currentPage, Math.max(totalPages, 1));

    const pageIds = useMemo(
        () => sortedChangelogIds
            .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
            .map(item => item.id),
        [sortedChangelogIds, page]
    );

    const pageChangelogs = useMemo(() => {
        const byId = new Map(changelogs.map(log => [log.id, log]));
        return pageIds.flatMap(id => byId.get(id) ?? []);
    }, [changelogs, pageIds]);

    // A background refetch must not swap loaded entries for the skeleton.
    const showSkeleton = useMinimumLoading(isLoading && pageChangelogs.length === 0);

    useEffect(() => {
        loadChangelogsByIds(pageIds);
    }, [loadChangelogsByIds, pageIds]);

    useEffect(() => {
        cleanUpdDeactivatedIds();
    }, [cleanUpdDeactivatedIds]);

    const handlePageChange = (
        _event: React.ChangeEvent<unknown>,
        newPage: number
    ) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const renderPagination = (showCount = false) => (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 2,
            }}
        >
            {totalPages > 1 && (
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="medium"
                    showFirstButton={!isSmallScreen}
                    showLastButton={!isSmallScreen}
                />
            )}

            {showCount && (
                <Typography variant="subtitle2" color="textSecondary" sx={{
                    textAlign: "center"
                }}>
                    {sortedChangelogIds.length} Änderung{sortedChangelogIds.length !== 1 ? "en" : ""}
                </Typography>
            )}
        </Box>
    );

    return (
        <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom>
                ✨ Neuste Änderungen
            </Typography>
            <Typography sx={{
                marginBottom: "16px"
            }}>
                Informiere dich hier über die neusten Änderungen deines Bilderrahmens und der Shareframe Plattform.
            </Typography>

            {showSkeleton && (
                <>
                    <Skeleton variant="rectangular" height={250} sx={{ mt: 1, mb: 2 }} />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Box key={i} sx={{ mb: 2 }}>
                            <Skeleton variant="rectangular" height={30} sx={{ mt: 1 }} />
                        </Box>
                    ))}
                </>
            )}

            {!showSkeleton && isSmallScreen && page > 1 && renderPagination()}

            {!showSkeleton && sortedChangelogIds.length === 0 && (
                <DataNotFound notFoundMessage={"Keine Änderungen vorhanden"} />
            )}

            {!showSkeleton && pageChangelogs.length > 0 && (
                <>
                    {pageChangelogs.map((changelog, index) => {
                        const isNewest = page === 1 && index === 0;
                        return (
                            <Accordion
                                key={changelog.id}
                                elevation={1}
                                square={true}
                                sx={{
                                    mb: 2,
                                    borderRadius: `${theme.shape.borderRadius}px`,
                                    "&.MuiAccordion-root:before": {
                                        backgroundColor: "transparent"
                                    }
                                }}
                                defaultExpanded={isNewest}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        '& .MuiAccordionSummary-content': {
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }
                                    }}
                                >
                                    {isSmallScreen ? (
                                        <>
                                            <Stack sx={{
                                                width: "100%"
                                            }}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        mb: 2
                                                    }}>
                                                    <Typography variant="subtitle1">
                                                        {new Date(changelog.date).toLocaleDateString()}
                                                    </Typography>
                                                    {isNewest && (
                                                        <Chip
                                                            label="Neuste Änderung"
                                                            size="small"
                                                            color="primary"
                                                            variant="filled"
                                                            sx={{ mx: 1 }}
                                                        />
                                                    )}
                                                </Box>
                                                <Typography variant="subtitle1">
                                                    {changelog.title}
                                                </Typography>
                                            </Stack>
                                        </>
                                    ) : (
                                        <>
                                            <Box>
                                                <Typography variant="subtitle1">
                                                    {new Date(changelog.date).toLocaleDateString()} - {changelog.title}
                                                </Typography>
                                            </Box>
                                            {isNewest && (
                                                <Chip
                                                    label="Neuste Änderung"
                                                    size="small"
                                                    color="primary"
                                                    variant="filled"
                                                    sx={{ mx: 1 }}
                                                />
                                            )}
                                        </>
                                    )}
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box sx={{
                                        '& img': { maxWidth: '100%', height: 'auto' } // Style for images in markdown
                                    }}>
                                        <MarkdownImagesIntercept>
                                            {changelog.content}
                                        </MarkdownImagesIntercept>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </>
            )}

            {!showSkeleton && sortedChangelogIds.length > 0 && renderPagination(true)}
        </Container>
    );
};

export default Changelogs;
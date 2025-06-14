import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Skeleton,
    useTheme,
    useMediaQuery,
    Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useChangelogs } from '@/hooks/changelogs/useChangelogs';
import DataNotFound from '@/common/components/dataNotFound';
import MarkdownImagesIntercept from '@/common/utils/markdown/markdownImagesIntercept';

const Changelogs: React.FC = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const {
        isLoading,
        changelogIds,
        changelogs,
        loadAllChangelogs,
        cleanUpdDeactivatedIds
    } = useChangelogs();

    useEffect(() => {
        if (changelogIds.length > 0) {
            loadAllChangelogs();
        }
        cleanUpdDeactivatedIds();
    }, [changelogIds]);

    return (
        <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom>
                ✨ Neuste Änderungen
            </Typography>
            <Typography paragraph>
                Informiere dich hier über die neusten Änderungen deines Bilderrahmens und der Shareframe Plattform.
            </Typography>

            {isLoading && (
                <>
                    <Skeleton variant="rectangular" height={250} sx={{ mt: 1, mb: 2 }} />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Box key={i} sx={{ mb: 2 }}>
                            <Skeleton variant="rectangular" height={30} sx={{ mt: 1 }} />
                        </Box>
                    ))}
                </>
            )}

            {!isLoading && changelogs.length === 0 && (
                <DataNotFound notFoundMessage={"Keine Änderungen vorhanden"} />
            )}

            {!isLoading && changelogs.length > 0 && (
                <>
                    {[...changelogs]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((changelog, index) => (
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
                                defaultExpanded={index === 0}
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
                                            <Stack width={"100%"}>
                                                <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"} sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle1">
                                                        {new Date(changelog.date).toLocaleDateString()}
                                                    </Typography>
                                                    {index === 0 && (
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
                                            {index === 0 && (
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
                        ))
                    }
                </>
            )}
        </Container>
    );
};

export default Changelogs;
import React from 'react';
import {
    Box,
    Button,
    Typography,
} from '@mui/material';
import { useChangelogs } from '@/hooks/changelogs/useChangelogs';
import ShareframeMainDialog from '@/common/components/shareframeMainDialog';
import MarkdownImagesIntercept from '@/common/utils/markdown/markdownImagesIntercept';

const NewChangelogDialog: React.FC = () => {
    const {
        deactivateChangelog,
        getNewestActiveChangelog
    } = useChangelogs();

    const handleClose = () => {
        const newestChangelog = getNewestActiveChangelog();
        if (newestChangelog) {
            deactivateChangelog(newestChangelog.id);
        }
    };

    const newestChangelog = getNewestActiveChangelog();

    if (!newestChangelog) {
        return null;
    }

    return (
        <ShareframeMainDialog
            open
            onDialogClose={handleClose}
            dialogTitle={"✨ Neue Änderungen während deiner Abwesenheit"}
            dialogSubtitle={new Date(newestChangelog.date).toLocaleDateString()}
            maxWidth="md"
            fullWidth
        >
            <Box
                sx={{
                    '& img': { maxWidth: '100%', height: 'auto' },
                    width: '100%',
                    mt: 2
                }}
            >
                <Typography variant='h5'>{newestChangelog.title}</Typography>
                <MarkdownImagesIntercept>
                    {newestChangelog.content}
                </MarkdownImagesIntercept>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 1, width: '100%', position: 'sticky', bottom: 0, right: 0 }}>
                <Button
                    onClick={handleClose}
                    variant="contained"
                    color="primary"
                    sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                    Schließen
                </Button>
            </Box>
        </ShareframeMainDialog>
    );
};

export default NewChangelogDialog;
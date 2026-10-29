import React, { lazy, Suspense } from 'react';
import {
    Box,
    Typography,
} from '@mui/material';
import { useChangelogs } from '@/hooks/changelogs/useChangelogs';
import ShareframeMainDialog from '@/common/components/shareframeMainDialog';

// The markdown renderer loads only when there is something to announce.
const MarkdownImagesIntercept = lazy(() => import('@/common/utils/markdown/markdownImagesIntercept'));

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
                <Suspense fallback={null}>
                    <MarkdownImagesIntercept>
                        {newestChangelog.content}
                    </MarkdownImagesIntercept>
                </Suspense>
            </Box>
        </ShareframeMainDialog>
    );
};

export default NewChangelogDialog;
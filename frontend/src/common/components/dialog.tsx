import React from 'react';
import {
    Dialog,
    DialogProps,
    Box,
    useMediaQuery,
    useTheme,
    IconButton,
    Typography,
    AppBar,
    Toolbar,
    DialogContent,
    Theme,
    SxProps,
    Tooltip
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { SlideTransition, ZoomTransition } from "./dialogTransitions";
import { DialogAction } from '@/types';

interface ReusableDialogProps extends Omit<DialogProps, 'title'> {
    title?: string;
    subtitle?: string;
    actions?: DialogAction[];
    contentSx?: SxProps<Theme>;
    toolbarSx?: SxProps<Theme>;
    onClose: () => void;
}

const CustomDialog: React.FC<ReusableDialogProps> = ({
    title,
    subtitle,
    actions,
    children,
    contentSx,
    toolbarSx,
    onClose,
    ...dialogProps
}) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Dialog
            TransitionComponent={!isSmallScreen ? ZoomTransition : SlideTransition}
            maxWidth="xl"
            fullWidth
            fullScreen={isSmallScreen}
            {...dialogProps}
            onClose={onClose}
        >
            <AppBar sx={{ position: 'relative', py: 1 }} color='inherit'>
                <Toolbar variant="dense">
                    <Box sx={{ flex: 1, alignSelf: "center" }}>
                        {title && (
                            <Typography variant='h6' component='div'>
                                {title}
                            </Typography>
                        )}
                        {subtitle && (
                            <Typography variant='subtitle2' component='div'>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    <IconButton
                        edge='start'
                        color='inherit'
                        onClick={onClose}
                        aria-label='close'
                        sx={{ alignSelf: "flex-start" }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <DialogContent sx={contentSx}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    {children}

                    {actions && actions.length > 0 && (
                        <Box>
                            <Toolbar
                                sx={{
                                    justifyContent: "flex-end",
                                    backgroundColor: (theme) => theme.palette.background.default,
                                    borderRadius: 1,
                                    mt: 1,
                                    ...toolbarSx
                                }}
                            >
                                {actions.map((action, index) => (
                                    <Tooltip
                                        title={action.label}
                                        key={index}
                                    >
                                        <IconButton
                                            disabled={action.disabled || false}
                                            onClick={action.onClick}
                                            color={action.color || 'inherit'}
                                            aria-label={action.label}
                                        >
                                            {action.icon}
                                        </IconButton>
                                    </Tooltip>
                                ))}
                            </Toolbar>
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default CustomDialog;
import React, { useState, useRef } from 'react';
import {
    Box,
    SpeedDial,
    SpeedDialAction,
    Fab,
} from "@mui/material";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { DialogAction } from '@/types';

interface BottomMainFloatingActionsProps {
    actionPrimary?: DialogAction;
    actionsSecondary: DialogAction[];
    disabled?: boolean;
    position?: 'fixed' | 'absolute';
}

const BottomFloatingActions: React.FC<BottomMainFloatingActionsProps> = ({
    actionsSecondary,
    actionPrimary,
    disabled = false,
    position = 'fixed',
}) => {
    const [speedDialOpen, setSpeedDialOpen] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);

    const mainAction = actionPrimary || actionsSecondary[0];
    const speedDialActions = actionPrimary
        ? actionsSecondary
        : actionsSecondary.slice(1);

    const getPositionStyles = () => {
        const baseStyles = {
            display: "flex",
            flexDirection: "row",
            gap: 1,
            zIndex: 1050,
        };

        if (position === 'fixed') {
            return {
                ...baseStyles,
                position: "fixed",
                bottom: { xs: 16, md: 72 },
                right: { xs: 16, md: 72 },
            };
        } else {
            return {
                ...baseStyles,
                position: "absolute",
                bottom: { xs: 16, md: 25 },
                right: { xs: 16, md: 25 },
            };
        }
    };

    return (
        <Box
            ref={actionsRef}
            sx={getPositionStyles()}
        >
            {mainAction && (
                <Fab
                    color={mainAction.color === 'primary' ? 'primary' : 'default'}
                    size="large"
                    onClick={mainAction.onClick}
                    disabled={disabled || mainAction.disabled}
                    variant='extended'
                    sx={{ alignSelf: "flex-end" }}
                >
                    <Box sx={{ mr: { xs: 1 }, display: 'flex' }}>
                        {mainAction.icon}
                    </Box>
                    {mainAction.label}
                </Fab>
            )}

            {speedDialActions.length > 0 && (
                <SpeedDial
                    ariaLabel={"Aktionen"}
                    icon={<MoreHorizIcon />}
                    onClose={() => setSpeedDialOpen(false)}
                    onOpen={() => setSpeedDialOpen(true)}
                    open={speedDialOpen}
                    FabProps={{
                        size: "medium",
                        disabled: disabled
                    }}
                    sx={{
                        '& .MuiSpeedDialAction-staticTooltipLabel': {
                            whiteSpace: 'nowrap',
                            minWidth: 'auto',
                            width: 'auto',
                        },
                        '& .MuiTooltip-tooltip': {
                            whiteSpace: 'nowrap',
                        }
                    }}
                >
                    {speedDialActions.map((action, index) => (
                        <SpeedDialAction
                            key={`${action.label}-${index}`}
                            icon={action.icon}
                            tooltipTitle={action.label}
                            tooltipOpen
                            onClick={() => {
                                setSpeedDialOpen(false);
                                action.onClick();
                            }}
                            FabProps={{
                                disabled: disabled || action.disabled,
                            }}
                            sx={{
                                '& .MuiFab-root': {
                                    backgroundColor: action.color ? `${action.color}.main` : 'default',
                                    '&:hover': {
                                        backgroundColor: action.color ? `${action.color}.light` : 'action.hover'
                                    }
                                },
                                '& .MuiSpeedDialAction-staticTooltipLabel': {
                                    whiteSpace: 'nowrap',
                                    minWidth: 'auto',
                                    maxWidth: 'none',
                                },
                            }}
                        />
                    ))}
                </SpeedDial>
            )}
        </Box>
    );
};

export default BottomFloatingActions;
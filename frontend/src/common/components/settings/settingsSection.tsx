import * as React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

interface SettingsSectionProps {
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    tone?: "default" | "error";
    children?: React.ReactNode;
}

const SettingsSection = ({ title, description, action, tone = "default", children }: SettingsSectionProps) => {
    const error = tone === "error";

    return (
        <Paper variant="outlined" sx={{ p: 2, ...(error && { borderColor: "error.main" }) }}>
            <Stack spacing={2}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                    <Box sx={{ flex: "1 1 12rem", minWidth: 0, overflowWrap: "anywhere" }}>
                        <Typography variant="h6" color={error ? "error" : undefined}>{title}</Typography>
                        {description && (
                            <Typography variant="body2" color="text.secondary">{description}</Typography>
                        )}
                    </Box>
                    {action}
                </Box>
                {children}
            </Stack>
        </Paper>
    );
};

export default SettingsSection;

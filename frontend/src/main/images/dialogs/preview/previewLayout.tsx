import React from "react";
import { Box, Typography } from "@mui/material";
import { useDesktopActions } from "@/hooks/layout/useDesktopActions";

const DETAILS_WIDTH = 260;

export interface PreviewDetails {
    fields: React.ReactNode;
    // Field columns below the desktop breakpoint.
    columns: { xs: number; sm: number };
}

interface PreviewLayoutProps {
    details?: PreviewDetails;
    toggle: React.ReactNode;
    children: React.ReactNode;
}

const PreviewLayout: React.FC<PreviewLayoutProps> = ({ details, toggle, children }) => {
    const isDesktop = useDesktopActions();

    if (isDesktop && details) {
        return (
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: `minmax(0, 1fr) ${DETAILS_WIDTH}px`,
                    columnGap: 3,
                    rowGap: 1,
                    alignItems: "start",
                    width: "100%",
                }}
            >
                <Box sx={{ gridColumn: 1, justifySelf: "center" }}>{toggle}</Box>
                <Box sx={{ gridColumn: 1, gridRow: 2, display: "flex", justifyContent: "center" }}>{children}</Box>
                <Box component="aside" sx={{ gridColumn: 2, gridRow: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    {details.fields}
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: "100%" }}>
            {details && (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: `repeat(${details.columns.xs}, minmax(0, 1fr))`,
                            sm: `repeat(${details.columns.sm}, minmax(0, 1fr))`,
                        },
                        gap: 2,
                        mb: 1,
                        alignSelf: "stretch",
                    }}
                >
                    {details.fields}
                </Box>
            )}
            {toggle}
            {children}
        </Box>
    );
};

export const PreviewField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Typography sx={{ mb: 0.5 }} color="text.secondary">{label}</Typography>
        {children}
    </Box>
);

export default PreviewLayout;

import * as React from "react";
import { Stack } from "@mui/material";

interface FormActionsProps {
    // Buttons share the full width, as in dialogs.
    fill?: boolean;
    children: React.ReactNode;
}

// Primary action goes last: right on desktop, on top on phones.
const FormActions = ({ fill = false, children }: FormActionsProps) => (
    <Stack
        direction={{ xs: "column-reverse", sm: "row" }}
        spacing={2}
        useFlexGap
        sx={{
            width: "100%",
            justifyContent: "flex-end",
            "& > .MuiButton-root": { width: { xs: "100%", sm: "auto" }, ...(fill && { flex: { sm: 1 } }) },
        }}
    >
        {children}
    </Stack>
);

export default FormActions;

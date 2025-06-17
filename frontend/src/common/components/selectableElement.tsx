import { useAppSelector } from "@/store";
import { getDesign } from "@/store/ui/settings/settings.slice";
import { Box } from "@mui/material";
import { ReactNode, useEffect, useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircleIcon from "@mui/icons-material/Circle";

interface SelectableItem {
    id: number;
    [key: string]: any; // Allow any other properties
}

interface SelectableElementProps<T extends SelectableItem> {
    children: ReactNode;
    elementToSelect: T;
    selectedElements: T[];
    selectionEnabled: boolean;
}

const SelectableElement = <T extends SelectableItem>({
    children,
    elementToSelect,
    selectedElements,
    selectionEnabled
}: SelectableElementProps<T>) => {
    const design = useAppSelector(getDesign);

    const [isSelected, setIsSelected] = useState<boolean>(false);
    const [selectedBackgroundColor, setSelectedBackgroundColor] = useState(
        "rgba(25, 118, 210, 0.35)"
    )

    useEffect(() => {
        const isElementSelected = selectedElements.find(
            (selectedElement) => selectedElement.id === elementToSelect.id
        );
        if (isElementSelected === undefined) {
            setIsSelected(false);
        } else {
            setIsSelected(true);
        }
    }, [selectedElements]);

    useEffect(() => {
        if (design === "dark") {
            setSelectedBackgroundColor("rgba(90, 152, 218, 0.3)")
        } else {
            setSelectedBackgroundColor("rgba(25, 118, 210, 0.4)")
        }
    }, [design])

    return (
        <Box
            sx={{
                position: "relative",
                display: "inline-block",
                width: "100%",
                height: "100%",
            }}
        >
            {children}

            {/* Selection overlay */}
            {selectionEnabled && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: isSelected ? selectedBackgroundColor : "rgba(0, 0, 0, 0.1)",
                        border: isSelected ? "3px solid" : "2px solid transparent",
                        borderColor: isSelected ? "primary.main" : "transparent",
                        borderRadius: 1,
                        pointerEvents: "none",
                        transition: "all 0.2s ease-in-out",
                    }}
                />
            )}

            {/* Selection icons */}
            {selectionEnabled && isSelected && (
                <CheckCircleIcon
                    sx={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        color: "primary.main",
                        backgroundColor: "white",
                        borderRadius: "50%",
                        fontSize: "20px",
                        zIndex: 10,
                    }}
                />
            )}
            {selectionEnabled && !isSelected && (
                <CircleIcon
                    sx={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        color: "rgba(255, 255, 255, 0.8)",
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        borderRadius: "50%",
                        fontSize: "20px",
                        zIndex: 10,
                    }}
                />
            )}
        </Box>
    );
}

export default SelectableElement;
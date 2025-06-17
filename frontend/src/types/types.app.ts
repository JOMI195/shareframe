import { SvgIconComponent } from "@mui/icons-material";

export interface IAccountMenuItem {
    name: string;
    url: string;
    icon: SvgIconComponent;
}

export interface IAppBarMenuItem {
    name: string;
    url: string;
    icon: JSX.Element;
}

export interface DialogAction {
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
    tooltip?: string;
    color?: "inherit" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    disabled?: boolean;
}
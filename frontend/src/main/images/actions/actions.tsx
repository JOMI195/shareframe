import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import { useAppSelector } from "@/store";
import { getDialogs } from "@/store/ui/images/images.slice";
import BottomFloatingActions from "@/common/components/bottomFloatingActions";
import PageActionsBar from "@/common/components/pageActionsBar";
import { useDesktopActions } from "@/hooks/layout/useDesktopActions";
import { useImagesPageActions } from "./useImagesPageActions";
import { useSelectionHandlers } from "../dialogs/selection/useSelectionHandlers";

export const Actions: React.FC = () => {
  const selectionDialogOpen = useAppSelector(getDialogs).selection.open;
  const { primary, secondary } = useImagesPageActions();
  const isDesktop = useDesktopActions();

  if (selectionDialogOpen || isDesktop) return null;

  return (
    <BottomFloatingActions
      actionPrimary={primary}
      actionSecondary={secondary}
    />
  );
};

export const DesktopActions: React.FC = () => {
  const selection = useAppSelector(getDialogs).selection;
  const { primary, secondary } = useImagesPageActions();
  const { send, download, remove, cancel } = useSelectionHandlers();
  const nothingSelected = selection.selectedImages.length === 0;

  const actions = selection.open ? [
    { icon: <CloseIcon />, onClick: cancel, label: 'Auswahl abbrechen' },
    { icon: <DownloadIcon />, onClick: download, label: 'Herunterladen', disabled: nothingSelected },
    { icon: <DeleteIcon />, onClick: remove, label: 'Löschen', color: 'error' as const, disabled: nothingSelected },
    { icon: <SendIcon />, onClick: send, label: 'Senden', color: 'primary' as const, disabled: nothingSelected },
  ] : [secondary, primary];

  return <PageActionsBar actions={actions} sx={{ mb: 2 }} />;
};

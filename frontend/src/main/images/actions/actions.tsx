import { Add as AddIcon } from "@mui/icons-material";
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import { useAppDispatch, useAppSelector } from "@/store";
import { getDialogs, openCreateImageDialog, openSelectionDialog } from "@/store/ui/images/images.slice";
import BottomFloatingActions from "@/common/components/bottomFloatingActions";
import { DialogAction } from "@/types";
import { getApi as imagesApi } from "@/store/entities/images/images.slice";

export const Actions: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectionDialogOpen = useAppSelector(getDialogs).selection.open;
  const imagesLoading = useAppSelector(imagesApi).loading;

  const handleDialogOpen = () => {
    dispatch(openCreateImageDialog());
  };

  const handleSelectionDialogOpen = () => {
    dispatch(openSelectionDialog());
  };

  const primaryAction: DialogAction = {
    icon: <AddIcon />,
    onClick: handleDialogOpen,
    label: 'Foto hinzufügen',
    color: 'primary',
    disabled: imagesLoading,
  };

  const secondaryAction: DialogAction = {
    icon: <HighlightAltIcon />,
    onClick: handleSelectionDialogOpen,
    color: 'primary',
    tooltip: "Mehrere Fotos auswählen",
    disabled: imagesLoading,
  };

  if (!selectionDialogOpen) {
    return (
      <BottomFloatingActions
        actionPrimary={primaryAction}
        actionSecondary={secondaryAction}
      />
    );
  }
};
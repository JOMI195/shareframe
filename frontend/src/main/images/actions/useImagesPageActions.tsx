import { Add as AddIcon } from "@mui/icons-material";
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import { useAppDispatch, useAppSelector } from "@/store";
import { openCreateImageDialog, openSelectionDialog } from "@/store/ui/images/images.slice";
import { getApi as imagesApi } from "@/store/entities/images/images.slice";
import { DialogAction } from "@/types";

export const useImagesPageActions = () => {
  const dispatch = useAppDispatch();
  const imagesLoading = useAppSelector(imagesApi).loading;

  const primary: DialogAction = {
    icon: <AddIcon />,
    onClick: () => dispatch(openCreateImageDialog()),
    label: 'Foto hinzufügen',
    color: 'primary',
    disabled: imagesLoading,
  };

  const secondary: DialogAction = {
    icon: <HighlightAltIcon />,
    onClick: () => dispatch(openSelectionDialog()),
    color: 'primary',
    tooltip: "Mehrere Fotos auswählen",
    disabled: imagesLoading,
  };

  return { primary, secondary };
};

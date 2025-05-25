import { Add as AddIcon } from "@mui/icons-material";
import { useAppDispatch } from "@/store";
import { openCreateImageDialog } from "@/store/ui/images/images.slice";
import BottomFloatingActions from "@/common/components/bottomFloatingActions";
import { DialogAction } from "@/types";

export const Actions: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleDialogOpen = () => {
    dispatch(openCreateImageDialog());
  };

  const action: DialogAction = {
    icon: <AddIcon />,
    onClick: handleDialogOpen,
    label: 'Foto hinzufügen',
    color: 'primary',
  };

  return (
    <BottomFloatingActions
      actionPrimary={action}
      actionsSecondary={[]}
    />
  );
};
import { Add as AddIcon } from "@mui/icons-material";
import { useAppDispatch } from "@/store";
import { openRegisterFrameDialog } from "@/store/ui/frames/frames.slice";
import { DialogAction } from "@/types";
import BottomFloatingActions from "@/common/components/bottomFloatingActions";

export const Actions: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleDialogOpen = () => {
    dispatch(openRegisterFrameDialog());
  };

  const action: DialogAction = {
    icon: <AddIcon />,
    onClick: handleDialogOpen,
    label: 'Bilderrahmen hinzufügen',
    color: 'primary',
  };

  return (
    <BottomFloatingActions
      actionPrimary={action}
    />
  );
};
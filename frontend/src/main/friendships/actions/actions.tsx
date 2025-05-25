import { Add as AddIcon } from "@mui/icons-material";
import { openCreateFriendshipsDialog } from "@/store/ui/friendships/friendships.slice";
import { useAppDispatch } from "@/store";
import { DialogAction } from "@/types";
import BottomFloatingActions from "@/common/components/bottomFloatingActions";

export const Actions: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleDialogOpen = () => {
    dispatch(openCreateFriendshipsDialog());
  };

  const action: DialogAction = {
    icon: <AddIcon />,
    onClick: handleDialogOpen,
    label: 'Freundschafsanfrage',
    color: 'primary',
  };

  return (
    <BottomFloatingActions
      actionPrimary={action}
      actionsSecondary={[]}
    />
  );
};
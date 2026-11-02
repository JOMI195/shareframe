import { Add as AddIcon } from "@mui/icons-material";
import { useAppDispatch } from "@/store";
import { openCreateFriendshipsDialog } from "@/store/ui/friendships/friendships.slice";
import { DialogAction } from "@/types";

export const useFriendshipsPageActions = () => {
  const dispatch = useAppDispatch();

  const primary: DialogAction = {
    icon: <AddIcon />,
    onClick: () => dispatch(openCreateFriendshipsDialog()),
    label: 'Freund hinzufügen',
    color: 'primary',
  };

  return { primary };
};

import { Fab } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { openCreateFriendshipsDialog } from "@/store/ui/friendships/friendships.slice";
import { useAppDispatch } from "@/store";

export const AddButton: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleDialogOpen = () => {
    dispatch(openCreateFriendshipsDialog());
  };

  return (
    <Fab
      color="primary"
      aria-label="add"
      sx={{
        position: "fixed",
        bottom: { xs: 16, md: 72 },
        right: { xs: 16, md: 72 },
        float: "right",
      }}
      variant={"extended"}
      onClick={handleDialogOpen}
    >
      <AddIcon
        sx={{
          mr: { xs: 0, md: 1 },
        }}
      />
      Freundschafsanfrage
    </Fab>
  );
};
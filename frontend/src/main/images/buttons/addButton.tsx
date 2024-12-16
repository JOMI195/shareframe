import { Fab } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useAppDispatch } from "@/store";
import { openCreateImageDialog } from "@/store/ui/images/images.slice";

export const AddButton: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleDialogOpen = () => {
    dispatch(openCreateImageDialog());
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
      Foto hinzufügen
    </Fab>
  );
};
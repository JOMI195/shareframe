import { Add as AddIcon } from "@mui/icons-material";
import { useAppDispatch } from "@/store";
import { openRegisterFrameDialog } from "@/store/ui/frames/frames.slice";
import { DialogAction } from "@/types";

export const useFramesPageActions = () => {
  const dispatch = useAppDispatch();

  const primary: DialogAction = {
    icon: <AddIcon />,
    onClick: () => dispatch(openRegisterFrameDialog()),
    label: 'Bilderrahmen hinzufügen',
    color: 'primary',
  };

  return { primary };
};

import BottomFloatingActions from "@/common/components/bottomFloatingActions";
import { useDesktopActions } from "@/hooks/layout/useDesktopActions";
import { useFramesPageActions } from "./useFramesPageActions";

export const Actions: React.FC = () => {
  const { primary } = useFramesPageActions();
  const isDesktop = useDesktopActions();

  if (isDesktop) return null;

  return (
    <BottomFloatingActions
      actionPrimary={primary}
    />
  );
};

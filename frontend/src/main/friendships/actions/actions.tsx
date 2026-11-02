import BottomFloatingActions from "@/common/components/bottomFloatingActions";
import { useDesktopActions } from "@/hooks/layout/useDesktopActions";
import { useFriendshipsPageActions } from "./useFriendshipsPageActions";

export const Actions: React.FC = () => {
  const { primary } = useFriendshipsPageActions();
  const isDesktop = useDesktopActions();

  if (isDesktop) return null;

  return (
    <BottomFloatingActions
      actionPrimary={primary}
    />
  );
};

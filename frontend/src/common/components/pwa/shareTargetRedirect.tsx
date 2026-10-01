import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getImageUrl } from '@/assets/endpoints/app/appEndpoints';
import { hasSharedFiles } from '@/common/utils/pwa/sharedFiles';

// Login lands on the dashboard; photos shared while logged out still need the upload dialog.
const ShareTargetRedirect: React.FC = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const imagesPath = '/' + getImageUrl();

    useEffect(() => {
        if (pathname === imagesPath) return;

        let cancelled = false;
        hasSharedFiles().then((pending) => {
            if (!cancelled && pending) navigate(imagesPath);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- checked once per mount of the authenticated layout
    }, []);

    return null;
};

export default ShareTargetRedirect;

import { useEffect, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import axiosInstance from "@/services/api";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import { getDeliveryUrl, getVariantUrl } from "@/common/utils/images";
import { IImage } from "@/types";
import EpaperToggle, { EpaperView } from "@/main/images/epaper/epaperToggle";
import { useEpaperPreview } from "@/main/images/epaper/useEpaperPreview";
import { EPAPER_HEIGHT, EPAPER_WIDTH } from "@/main/images/epaper/dither";
import { useDesktopActions } from "@/hooks/layout/useDesktopActions";
import PreviewLayout, { PreviewDetails } from "./previewLayout";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;
const MAX_HEIGHT = "60vh";
// Fills the desktop dialog below header, actions row and toggle without scrolling.
const MAX_HEIGHT_DESKTOP = "calc(85vh - 212px)";
const FALLBACK_RATIO = 4 / 3;

const PreviewImage: React.FC<{ image: IImage; details?: PreviewDetails }> = ({ image, details }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const maxHeight = useDesktopActions() ? MAX_HEIGHT_DESKTOP : MAX_HEIGHT;
    const [view, setView] = useState<EpaperView>("original");
    const [delivery, setDelivery] = useState<Blob | null>(null);

    const wantsEpaper = view === "epaper";
    const deliveryUrl = `${MEDIA_BASE_URL}${getDeliveryUrl(image)}`;

    useEffect(() => {
        if (!wantsEpaper || delivery) return;
        let active = true;
        axiosInstance
            .get<Blob>(deliveryUrl, { responseType: "blob" })
            .then((response) => {
                if (active) setDelivery(response.data);
            })
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, [wantsEpaper, delivery, deliveryUrl]);

    const epaperUrl = useEpaperPreview(delivery, wantsEpaper);

    const ratio = image.width && image.height ? image.width / image.height : FALLBACK_RATIO;

    // Sized from the known ratio so the skeleton already takes the photo's box.
    const box = (boxRatio: number) => ({ width: `min(100%, calc(${maxHeight} * ${boxRatio}))`, aspectRatio: `${boxRatio}` });
    const fill = { display: "block", width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 } as const;

    return (
        <PreviewLayout details={details} toggle={<EpaperToggle value={view} onChange={setView} />}>
            {epaperUrl ? (
                <Box sx={box(EPAPER_WIDTH / EPAPER_HEIGHT)}>
                    <img src={epaperUrl} alt={`${image.name} (E-Paper)`} style={fill} />
                </Box>
            ) : (
                <Box sx={box(ratio)}>
                    <AuthenticatedImage
                        url={`${MEDIA_BASE_URL}${getVariantUrl(image, isSmallScreen ? "medium" : "large")}`}
                        alt={image.name}
                        style={fill}
                    />
                </Box>
            )}
        </PreviewLayout>
    );
};

export default PreviewImage;

import { useEffect, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import axiosInstance from "@/services/api";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import { getDeliveryUrl, getVariantUrl } from "@/common/utils/images";
import { IImage } from "@/types";
import EpaperToggle, { EpaperView } from "@/main/images/epaper/epaperToggle";
import { useEpaperPreview } from "@/main/images/epaper/useEpaperPreview";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;
const MAX_HEIGHT = "60vh";
const FALLBACK_RATIO = 4 / 3;
const imageStyle = { maxWidth: "100%", maxHeight: MAX_HEIGHT, borderRadius: 8 };

const PreviewImage: React.FC<{ image: IImage }> = ({ image }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
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
    const original = (
        <Box sx={{ width: `min(100%, calc(${MAX_HEIGHT} * ${ratio}))`, aspectRatio: `${ratio}` }}>
            <AuthenticatedImage
                url={`${MEDIA_BASE_URL}${getVariantUrl(image, isSmallScreen ? "medium" : "large")}`}
                alt={image.name}
                style={{ display: "block", width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }}
            />
        </Box>
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: "100%" }}>
            <EpaperToggle value={view} onChange={setView} />
            {epaperUrl ? <img src={epaperUrl} alt={`${image.name} (E-Paper)`} style={imageStyle} /> : original}
        </Box>
    );
};

export default PreviewImage;

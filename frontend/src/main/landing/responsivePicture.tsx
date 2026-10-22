import { Box, type SxProps, type Theme } from "@mui/material";
import type { Picture } from "./landingImages";

interface ResponsivePictureProps {
  picture: Picture;
  alt: string;
  sizes: string;
  priority?: boolean;
  sx?: SxProps<Theme>;
}

const ResponsivePicture = ({ picture, alt, sizes, priority = false, sx }: ResponsivePictureProps) => (
  <picture>
    {Object.entries(picture.sources).map(([format, srcSet]) => (
      <source key={format} type={`image/${format}`} srcSet={srcSet} sizes={sizes} />
    ))}
    <Box
      component="img"
      src={picture.img.src}
      width={picture.img.w}
      height={picture.img.h}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      sx={[{ display: "block", width: "100%", height: "auto" }, ...(Array.isArray(sx) ? sx : [sx])]}
    />
  </picture>
);

export default ResponsivePicture;

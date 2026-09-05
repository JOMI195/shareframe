import type { IImage, IImageVariant } from '@/types';

// Relative paths: the app prepends VITE_API_MEDIA_BASE_URL before fetching.
export const makeVariant = (over: Partial<IImageVariant> = {}): IImageVariant => ({
  url: '/media/private/images/photo-thumbnail.jpg',
  width: 320,
  height: 240,
  size_name: 'thumbnail',
  ...over,
});

export const makeImage = (over: Partial<IImage> = {}): IImage => ({
  id: 1,
  name: 'photo.jpg',
  display_name: 'photo',
  size: 1024,
  width: 1920,
  height: 1080,
  format: 'JPEG',
  created_at: '2026-01-01T10:00:00Z',
  url: '/media/private/images/photo.jpg',
  variants: [
    makeVariant(),
    makeVariant({ size_name: 'medium', width: 800, url: '/media/private/images/photo-medium.jpg' }),
    makeVariant({ size_name: 'large', width: 1600, url: '/media/private/images/photo-large.jpg' }),
  ],
  auto_delete_after_period: false,
  ...over,
});

export const makeImages = (count: number, over: Partial<IImage> = {}): IImage[] =>
  Array.from({ length: count }, (_, index) =>
    makeImage({
      id: index + 1,
      name: `photo-${index + 1}.jpg`,
      display_name: `Foto ${index + 1}`,
      url: `/media/private/images/photo-${index + 1}.jpg`,
      variants: [
        makeVariant({ url: `/media/private/images/photo-${index + 1}-thumbnail.jpg` }),
        makeVariant({
          size_name: 'medium',
          width: 800,
          url: `/media/private/images/photo-${index + 1}-medium.jpg`,
        }),
      ],
      ...over,
    }),
  );

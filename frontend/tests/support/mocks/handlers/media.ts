import { http, HttpResponse } from 'msw';
import { mediaUrl } from '../apiUrl';

const jpegBytes = () => new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01]).buffer;

// AuthenticatedImage fetches every variant as a blob through the same axios instance.
export const mediaHandlers = [
  http.get(mediaUrl('/media/*'), () =>
    HttpResponse.arrayBuffer(jpegBytes(), { headers: { 'Content-Type': 'image/jpeg' } }),
  ),
];

import { http, HttpResponse } from 'msw';
import * as images from '@/assets/endpoints/api/imagesEndpoints';
import { emptyPage, makeImage, makeSentImage } from '../../fixtures';
import { apiUrl, pathParam } from '../apiUrl';

export const imageHandlers = [
  http.get(apiUrl(images.getImagesUrl()), () => HttpResponse.json(emptyPage)),
  http.post(apiUrl(images.getImagesUrl()), () => HttpResponse.json(makeImage(), { status: 201 })),
  http.get(apiUrl(images.getImagesDetailUrl(pathParam('imageId'))), ({ params }) =>
    HttpResponse.json(makeImage({ id: Number(params.imageId) })),
  ),
  http.delete(apiUrl(images.getImagesDetailUrl(pathParam('imageId'))), ({ params }) =>
    HttpResponse.json(makeImage({ id: Number(params.imageId) })),
  ),

  http.get(apiUrl(images.getSentImagesUrl()), () => HttpResponse.json(emptyPage)),
  http.post(apiUrl(images.getSentImagesDeactivateUrl(pathParam('sentImageId'))), ({ params }) =>
    HttpResponse.json(makeSentImage({ id: Number(params.sentImageId), expires_at: '2000-01-01T00:00:00Z' })),
  ),
];

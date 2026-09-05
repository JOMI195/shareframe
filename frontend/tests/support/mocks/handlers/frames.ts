import { http, HttpResponse } from 'msw';
import * as frames from '@/assets/endpoints/api/framesEndpoints';
import { makeFrame } from '../../fixtures';
import { apiUrl, pathParam } from '../apiUrl';

export const frameHandlers = [
  http.get(apiUrl(frames.getFramesUrl()), () => HttpResponse.json([])),
  http.post(apiUrl(frames.getRegisterFrameUrl()), () => HttpResponse.json(makeFrame())),
  http.post(apiUrl(frames.getUnregisterFrameUrl()), () => HttpResponse.json(makeFrame())),
  http.post(apiUrl(frames.getSentImageToFrameUrl()), () =>
    HttpResponse.json({ message: 'Image sent successful.' }),
  ),
  http.post(apiUrl(frames.getObtainFrameOtpUrl(pathParam('frameId'))), () =>
    HttpResponse.json({ otp: '123456', expires_in_minutes: '10' }),
  ),
];

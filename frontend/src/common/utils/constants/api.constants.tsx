import { createAction } from '@reduxjs/toolkit'

export interface ApiRequestPayload {
    url: string;
    method?: string;
    data?: unknown;
    headers?: Record<string, string>;
    onStart?: string;
    onSuccess?: string;
    onError?: string;
    onStartPayload?: unknown;
    onSuccessPayload?: unknown;
    onErrorPayload?: unknown;
}

export const apiRequest = createAction<ApiRequestPayload>('api/request')
export const apiSuccess = createAction<unknown>('api/success')
export const apiFailed = createAction<string>('api/failed')

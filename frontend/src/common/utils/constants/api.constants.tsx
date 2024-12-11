import { createAction } from '@reduxjs/toolkit'

export const apiRequest = createAction<any>('api/request')
export const apiSuccess = createAction<any>('api/success')
export const apiFailed = createAction<any>('api/failed')

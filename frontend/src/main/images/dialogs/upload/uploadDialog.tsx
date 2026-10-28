import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import AppDialog from '@/common/components/appDialog';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    LinearProgress,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import Slide from '@mui/material/Slide'
import Zoom from '@mui/material/Zoom'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

import { validateImage } from './imageUpload/validation/imageValidation'
import { useAppDispatch, useAppSelector } from '@/store'
import { closeCreateImageDialog, getDialogs, openImagesAlertSnackbar, openSendImageToUserFrameDialog } from '@/store/ui/images/images.slice'
import { uploadImage } from '@/store/entities/images/images.actions'
import { fileToSha256Hex } from '@/common/utils/files/getFileHash.helpers'
import { IImage, IImageValidationResponse, isIImage } from '@/types'
import { getApi, getImagesPaginated } from '@/store/entities/images/images.slice'
import { Area, Point } from 'react-easy-crop'
import { getCroppedImg } from './imageCropping/cropper/utils'
import ImageCropping from './imageCropping/imageCropping'
import ImageAdjust from './imageAdjust/imageAdjust'
import { Adjustment, NEUTRAL_ADJUSTMENT, isNeutral } from './imageAdjust/adjust'
import { adjustImage } from './imageAdjust/adjustImage'
import ImagePreview from './imagePreview/imagePreview'
import { useBlobImage } from './useBlobImage'
import type { TextOverlay } from './imageText/textOverlays'
import EpaperToggle, { EpaperView } from '@/main/images/epaper/epaperToggle'
import { maxFilesOnce, useUploadQueue } from './useUploadQueue'
import { usePhotoPicker } from './usePhotoPicker'
import EditorLayout, { EditorGrid, ToolCanvas } from './editorLayout'
import StartScreen from './startScreen'
import ThumbStrip from './thumbStrip'
import ToolTabs, { Tool } from './toolTabs'

const ImageText = lazy(() => import('./imageText/imageText'))

const ZoomTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>
  },
  ref: React.Ref<unknown>
) {
  return <Zoom ref={ref} {...props} />
})

const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>
  },
  ref: React.Ref<unknown>
) {
  return <Slide ref={ref} direction="up" {...props} />
})

const CROPPER_PROPS_INITIAL_STATE = {
  crop: { x: 0, y: 0 },
  zoom: 1,
  rotation: 0,
  croppedAreaPixels: { x: 0, y: 0, width: 0, height: 0 }
}

const UploadDialog: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const showCamera = useMediaQuery('(pointer: coarse)');
  const sending = useAppSelector(getApi).sending;

  const imagesPaginatedCount = useAppSelector(getImagesPaginated).count;

  const {
    imageStatuses,
    setImageStatuses,
    addImages,
    reset: resetQueue,
    imagePreviews,
    previewErrors,
    markPreviewBroken,
  } = useUploadQueue()
  const { inputProps, openPicker, selectFiles, isPreparing } = usePhotoPicker(imageStatuses, addImages)

  const [tool, setTool] = useState<Tool>('crop')
  const [previewing, setPreviewing] = useState(false)
  const [busy, setBusy] = useState(false)
  // The cropper measures itself on mount, which mid-transition yields a scaled-down box.
  const [entered, setEntered] = useState(false)
  const [exportRequested, setExportRequested] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  const [autoDeleteAfterPeriod, setAutoDeleteAfterPeriod] = useState(true);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>(CROPPER_PROPS_INITIAL_STATE.croppedAreaPixels)
  const [crop, setCrop] = useState<Point>(CROPPER_PROPS_INITIAL_STATE.crop)
  const [zoom, setZoom] = useState(CROPPER_PROPS_INITIAL_STATE.zoom)
  const [rotation, setRotation] = useState(CROPPER_PROPS_INITIAL_STATE.rotation)
  const [croppedImage, replaceCroppedImage] = useBlobImage()
  const [croppedKey, setCroppedKey] = useState<string | null>(null)
  const [adjustment, setAdjustment] = useState<Adjustment>(NEUTRAL_ADJUSTMENT)
  const [adjustedImage, replaceAdjustedImage] = useBlobImage()
  const [adjustedKey, setAdjustedKey] = useState<string | null>(null)
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])
  const [overlaysWidth, setOverlaysWidth] = useState<number | null>(null)
  const [finalImage, replaceFinalImage] = useBlobImage()
  const [epaperView, setEpaperView] = useState<EpaperView>('original')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [sendPrompt, setSendPrompt] = useState<IImage[]>([])
  const uploadedThisSession = useRef<IImage[]>([])

  const open = useAppSelector(getDialogs).create.open

  // Everything derived from the photo in edit belongs to that photo only.
  const resetCropperState = useCallback(() => {
    setCroppedAreaPixels(CROPPER_PROPS_INITIAL_STATE.croppedAreaPixels)
    setCrop(CROPPER_PROPS_INITIAL_STATE.crop)
    setZoom(CROPPER_PROPS_INITIAL_STATE.zoom)
    setRotation(CROPPER_PROPS_INITIAL_STATE.rotation)
    replaceCroppedImage(null)
    setCroppedKey(null)
    setAdjustment(NEUTRAL_ADJUSTMENT)
    replaceAdjustedImage(null)
    setAdjustedKey(null)
    setTextOverlays([])
    setOverlaysWidth(null)
    replaceFinalImage(null)
    setEpaperView('original')
    setExportRequested(false)
    setPreviewing(false)
    setTool('crop')
  }, [replaceCroppedImage, replaceAdjustedImage, replaceFinalImage])

  const closeDialog = () => {
    uploadedThisSession.current = [];
    setConfirmDiscard(false);
    dispatch(closeCreateImageDialog());
    resetQueue();
    setCurrentImageIndex(null);
    setAutoDeleteAfterPeriod(true);
    resetCropperState();
  }

  // Uploading is usually followed by sending, so offer it right away.
  const finishSession = () => {
    const uploaded = uploadedThisSession.current
    closeDialog()
    if (uploaded.length > 0) setSendPrompt(uploaded)
  }

  const handleSendNow = () => {
    dispatch(openSendImageToUserFrameDialog({ images: sendPrompt }))
    setSendPrompt([])
  }

  // Closing by hand (X, Escape, back) would drop every photo still being edited.
  const handleDialogClose = () => {
    if (!busy && !sending && imageStatuses.some(status => status.status !== 'uploaded')) {
      setConfirmDiscard(true)
      return
    }
    closeDialog()
  }

  const selectImageForCropping = useCallback((index: number) => {
    if (imageStatuses[index].status === 'uploaded') return

    resetCropperState()
    setCurrentImageIndex(index)
    setImageStatuses(prev =>
      prev.map((status, i) => ({
        ...status,
        status: i === index ? 'cropping' : (status.status === 'cropping' ? 'pending' : status.status)
      }))
    )
  }, [imageStatuses, resetCropperState, setImageStatuses])

  const handleSelectPhoto = (index: number) => {
    if (index === currentImageIndex || busy) return
    selectImageForCropping(index)
  }

  const removeImage = (indexToRemove: number) => {
    const remaining = imageStatuses.filter((_, index) => index !== indexToRemove)
    if (remaining.length > 0 && remaining.every(status => status.status === 'uploaded')) {
      finishSession()
      return
    }
    setImageStatuses(remaining)
    if (indexToRemove === currentImageIndex) {
      resetCropperState()
      setCurrentImageIndex(null)
    } else {
      setCurrentImageIndex(prev => (prev !== null && indexToRemove < prev ? prev - 1 : prev))
    }
  }

  const currentImage = currentImageIndex !== null ? imageStatuses[currentImageIndex] ?? null : null
  const area = croppedAreaPixels
  const cropKey = currentImage ? `${currentImage.id}:${area.x},${area.y},${area.width},${area.height}:${rotation}` : null
  const adjustKey = `${cropKey}:${adjustment.brightness},${adjustment.contrast}`
  const cropMeasured = area.width >= 1 && area.height >= 1
  const editLocked = busy || exportRequested || !cropMeasured

  // Each stage is computed when a later tool needs it and reused until its inputs change.
  const ensureCropped = async (): Promise<Blob> => {
    if (croppedImage && croppedKey === cropKey) return croppedImage.blob
    if (!currentImage || area.width < 1 || area.height < 1) {
      throw new Error('Der Zuschnitt wird noch vorbereitet. Bitte kurz warten.')
    }
    const blob = await getCroppedImg(currentImage.file, area, rotation)
    replaceCroppedImage(blob)
    setCroppedKey(cropKey)
    return blob
  }

  const ensureAdjusted = async (cropped: Blob): Promise<Blob> => {
    if (adjustedImage && adjustedKey === adjustKey) return adjustedImage.blob
    const blob = isNeutral(adjustment) ? cropped : await adjustImage(cropped, adjustment)
    replaceAdjustedImage(blob)
    setAdjustedKey(adjustKey)
    return blob
  }

  const runBusy = async (task: () => Promise<void>) => {
    setBusy(true)
    try {
      await task()
    } catch (error) {
      dispatch(openImagesAlertSnackbar({
        message: error instanceof Error ? error.message : 'Bearbeiten fehlgeschlagen',
        severity: 'error'
      }))
    } finally {
      setBusy(false)
    }
  }

  const changeTool = (next: Tool) => {
    if (next === 'crop') {
      setTool(next)
      return
    }
    runBusy(async () => {
      const cropped = await ensureCropped()
      if (next === 'text') await ensureAdjusted(cropped)
      setTool(next)
    })
  }

  // Without texts the photo needs no editor stage, so the preview skips the text tool.
  const goToPreview = () => runBusy(async () => {
    const adjusted = await ensureAdjusted(await ensureCropped())
    if (textOverlays.length === 0) {
      replaceFinalImage(adjusted)
      setPreviewing(true)
    } else {
      setTool('text')
      setExportRequested(true)
    }
  })

  const handleTextDone = useCallback((blob: Blob) => {
    replaceFinalImage(blob)
    setExportRequested(false)
    setPreviewing(true)
  }, [replaceFinalImage])

  const handleExportFailed = useCallback(() => setExportRequested(false), [])

  const handleBackToEdit = () => {
    replaceFinalImage(null)
    setPreviewing(false)
  }

  const handleUpload = async (blob: Blob) => {
    const index = currentImageIndex
    if (index === null || !imageStatuses[index]) {
      return
    }

    const imageStatus = imageStatuses[index]

    try {
      const baseName = (imageStatus.file.name || 'cropped-image').replace(/\.[^.]+$/, '')
      const croppedFile = new File([blob], `${baseName}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      const validation: IImageValidationResponse = validateImage(croppedFile, 0, 1, imagesPaginatedCount)
      if (validation.valid) {
        const upload_image_sha256_hex_hash = await fileToSha256Hex(croppedFile)

        const newImage = await dispatch(uploadImage(croppedFile, upload_image_sha256_hex_hash, autoDeleteAfterPeriod))

        if (isIImage(newImage)) {
          uploadedThisSession.current = [newImage, ...uploadedThisSession.current]
          setImageStatuses(prev =>
            prev.map((status, i) =>
              i === index
                ? { ...status, status: 'uploaded', croppedFile }
                : status
            )
          )

          const allUploaded = imageStatuses.every((status, i) =>
            i === index || status.status === 'uploaded'
          )
          if (allUploaded) {
            finishSession()
            return
          }

          resetCropperState()
          const nextPendingIndex = imageStatuses.findIndex((status, i) =>
            i !== index && status.status === 'pending'
          )
          if (nextPendingIndex !== -1) {
            selectImageForCropping(nextPendingIndex)
          } else {
            setCurrentImageIndex(null)
          }
        }
      } else {
        dispatch(openImagesAlertSnackbar({
          message: validation.errors.join(' | '),
          severity: "warning"
        }));
      }
    } catch (error) {
      dispatch(openImagesAlertSnackbar({
        message: error instanceof Error ? error.message : 'Upload fehlgeschlagen',
        severity: 'error'
      }));
    }
  }

  // Picked or shared photos open straight in the editor, so the first pending one gets selected.
  useEffect(() => {
    if (imageStatuses.length === 0) return
    if (currentImageIndex !== null && imageStatuses[currentImageIndex]?.status === 'cropping') return

    const firstPendingIdx = imageStatuses.findIndex(status => status.status === 'pending')
    if (firstPendingIdx !== -1) {
      // selection follows async status changes from several handlers, so it stays an effect
      // eslint-disable-next-line react-hooks/set-state-in-effect
      selectImageForCropping(firstPendingIdx)
    } else if (currentImageIndex !== null) {
      setCurrentImageIndex(null)
    }
  }, [imageStatuses, currentImageIndex, selectImageForCropping])

  const epaper = epaperView === 'epaper'
  const showsEpaperToggle = previewing || tool !== 'crop'
  const title = imageStatuses.length > 0 && currentImageIndex !== null
    ? `Foto ${currentImageIndex + 1} von ${imageStatuses.length}`
    : 'Fotos hochladen'

  return (
    <>
      <AppDialog
        fullScreen={!matches}
        open={open}
        onClose={handleDialogClose}
        aria-labelledby="upload-dialog-title"
        maxWidth="lg"
        fullWidth
        slots={{
          transition: matches ? ZoomTransition : SlideTransition
        }}
        slotProps={{
          paper: { sx: { height: { md: 'min(900px, calc(100% - 64px))' } } },
          transition: { onEntered: () => setEntered(true), onExited: () => setEntered(false) }
        }}
      >
        <input {...inputProps} />
        <EditorLayout
          title={title}
          subtitle={currentImage?.file.name}
          onClose={handleDialogClose}
          onBack={previewing ? handleBackToEdit : undefined}
          actions={currentImage && showsEpaperToggle && <EpaperToggle value={epaperView} onChange={setEpaperView} />}
          strip={imageStatuses.length > 0 && (
            <>
              <ThumbStrip
                imageStatuses={imageStatuses}
                currentImageIndex={currentImageIndex}
                imagePreviews={imagePreviews}
                previewErrors={previewErrors}
                markPreviewBroken={markPreviewBroken}
                onSelect={handleSelectPhoto}
                onRemove={removeImage}
                onAdd={() => openPicker('gallery')}
                canAdd={imageStatuses.length < maxFilesOnce}
                isPreparing={isPreparing}
              />
              <LinearProgress sx={{ visibility: busy || exportRequested ? 'visible' : 'hidden' }} />
            </>
          )}
          footer={currentImage && (previewing && finalImage ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {matches && (
                <Button variant="outlined" size="large" fullWidth onClick={handleBackToEdit} disabled={sending}>
                  Zurück zum Bearbeiten
                </Button>
              )}
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={sending}
                startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                onClick={() => handleUpload(finalImage.blob)}
              >
                Hochladen
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={editLocked || sending || !!previewErrors[currentImage.id]}
              startIcon={busy || exportRequested ? <CircularProgress size={18} color="inherit" /> : undefined}
              onClick={goToPreview}
            >
              Weiter zur Vorschau
            </Button>
          ))}
        >
          {imageStatuses.length === 0 && (
            <StartScreen
              openPicker={openPicker}
              selectFiles={selectFiles}
              isPreparing={isPreparing}
              showCamera={showCamera}
            />
          )}
          {currentImage && !previewing && entered && (
            <EditorGrid>
              {tool === 'crop' && (
                <ImageCropping
                  currentImage={currentImage}
                  preview={imagePreviews[currentImage.id]}
                  previewError={previewErrors[currentImage.id]}
                  markPreviewBroken={markPreviewBroken}
                  setCroppedAreaPixels={setCroppedAreaPixels}
                  crop={crop}
                  setCrop={setCrop}
                  zoom={zoom}
                  setZoom={setZoom}
                  rotation={rotation}
                  setRotation={setRotation}
                />
              )}
              {tool === 'adjust' && croppedImage && (
                <ImageAdjust
                  epaper={epaper}
                  croppedImage={croppedImage}
                  fileName={currentImage.file.name}
                  adjustment={adjustment}
                  setAdjustment={setAdjustment}
                />
              )}
              {tool === 'text' && adjustedImage && (
                <Suspense fallback={<ToolCanvas><CircularProgress /></ToolCanvas>}>
                  <ImageText
                    key={adjustedImage.url}
                    epaper={epaper}
                    photo={adjustedImage}
                    fileName={currentImage.file.name}
                    overlays={textOverlays}
                    setOverlays={setTextOverlays}
                    overlaysWidth={overlaysWidth}
                    setOverlaysWidth={setOverlaysWidth}
                    exportRequested={exportRequested}
                    handleTextDone={handleTextDone}
                    handleExportFailed={handleExportFailed}
                  />
                </Suspense>
              )}
              <ToolTabs value={tool} onChange={changeTool} disabled={editLocked} />
            </EditorGrid>
          )}
          {previewing && finalImage && currentImage && (
            <ImagePreview
              finalImage={finalImage}
              epaper={epaper}
              fileName={currentImage.file.name}
              autoDeleteAfterPeriod={autoDeleteAfterPeriod}
              setAutoDeleteAfterPeriod={setAutoDeleteAfterPeriod}
            />
          )}
        </EditorLayout>
        <Dialog open={confirmDiscard} onClose={() => setConfirmDiscard(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Bearbeitung verwerfen?</DialogTitle>
          <DialogContent>
            <DialogContentText>Noch nicht hochgeladene Fotos und ihre Bearbeitung gehen verloren.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDiscard(false)}>Weiter bearbeiten</Button>
            <Button color="error" onClick={closeDialog}>Verwerfen</Button>
          </DialogActions>
        </Dialog>
      </AppDialog>
      <Dialog open={sendPrompt.length > 0} onClose={() => setSendPrompt([])} maxWidth="xs" fullWidth>
        <DialogTitle>{sendPrompt.length === 1 ? 'Foto hochgeladen' : `${sendPrompt.length} Fotos hochgeladen`}</DialogTitle>
        <DialogContent>
          <DialogContentText>Jetzt an einen Bilderrahmen senden?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendPrompt([])}>Später</Button>
          <Button variant="contained" onClick={handleSendNow}>Jetzt senden</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default UploadDialog

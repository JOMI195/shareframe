import React, { useEffect, useRef, useState } from 'react'
import {
  AppBar,
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Container,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import Slide from '@mui/material/Slide'
import Zoom from '@mui/material/Zoom'
import CloseIcon from '@mui/icons-material/Close'

import { validateImage } from './imageUpload/validation/imageValidation'
import { useAppDispatch, useAppSelector } from '@/store'
import { closeCreateImageDialog, getDialogs, openImagesAlertSnackbar } from '@/store/ui/images/images.slice'
import { uploadImage } from '@/store/entities/images/images.actions'
import { fileToSha256Hex } from '@/common/utils/files/getFileHash.helpers'
import { IImageValidationResponse, isIImage } from '@/types'
import { getApi, getImagesPaginated } from '@/store/entities/images/images.slice'
import { Area } from 'react-easy-crop'
import { getCroppedImg } from './imageCropping/cropper/utils'
import ImageUpload from './imageUpload/imageUpload'
import ImageCropping from './imageCropping/imageCropping'

const ZoomTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Zoom ref={ref} {...props} />
})

const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide ref={ref} {...props} />
})

export interface ImageStatus {
  id: string;
  file: File;
  status: 'pending' | 'cropping' | 'uploaded';
  croppedFile?: File;
}

const steps = ['Fotos auswählen', 'Fotos zuschneiden und hochladen']

const UploadDialog: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const sending = useAppSelector(getApi).sending;

  const imagesPaginatedCount = useAppSelector(getImagesPaginated).count;

  const [activeStep, setActiveStep] = useState(0)
  const [imageStatuses, setImageStatuses] = useState<ImageStatus[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  const [autoDeleteAfterPeriod, setAutoDeleteAfterPeriod] = useState(true);

  const [imagePreviews, setImagePreviews] = useState<{ [id: string]: string }>({});

  const CROPPER_PROPS_INITIAL_STATE = {
    rotation: 0,
    croppedAreaPixels: { x: 0, y: 0, width: 0, height: 0 }
  }

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>(CROPPER_PROPS_INITIAL_STATE.croppedAreaPixels)
  const [rotation, setRotation] = useState(CROPPER_PROPS_INITIAL_STATE.rotation)

  const open = useAppSelector(getDialogs).create.open

  const handleDialogClose = () => {
    dispatch(closeCreateImageDialog());
    setImageStatuses([]);
    setActiveStep(0);
    setCurrentImageIndex(null);
    setAutoDeleteAfterPeriod(true);
    resetCropperState();
    setImagePreviews({});
  }

  const resetCropperState = () => {
    setCroppedAreaPixels(CROPPER_PROPS_INITIAL_STATE.croppedAreaPixels)
    setRotation(CROPPER_PROPS_INITIAL_STATE.rotation)
  }

  const handleNext = () => {
    if (activeStep === 0 && imageStatuses.length === 0) {
      return
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    if (activeStep === 0) {
      handleDialogClose()
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1)
    }
  }

  const setImages = (files: File[]) => {
    const newImageStatuses: ImageStatus[] = files.map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending'
    }))
    setImageStatuses(newImageStatuses)
  }

  const activeUrlRefs = useRef<{ [id: string]: string }>({});

  useEffect(() => {
    const newPreviewsMap: { [id: string]: string } = {}; // This will be the map for the new state update
    const currentImageIdsInStatus = new Set(imageStatuses.map(status => status.id));

    // Identify URLs from the *previous* successful effect run that are no longer needed
    const urlsToRevokeFromPreviousActiveSet: string[] = [];
    for (const imageId in activeUrlRefs.current) { // Check against the ref's stored URLs
      if (!currentImageIdsInStatus.has(imageId)) {
        urlsToRevokeFromPreviousActiveSet.push(activeUrlRefs.current[imageId]);
      }
    }

    // Populate newPreviewsMap: reuse existing if available in *activeUrlRefs*, otherwise create new
    imageStatuses.forEach(imageStatus => {
      if (activeUrlRefs.current[imageStatus.id]) { // Check against the ref for reuse
        newPreviewsMap[imageStatus.id] = activeUrlRefs.current[imageStatus.id];
      } else {
        newPreviewsMap[imageStatus.id] = URL.createObjectURL(imageStatus.file);
      }
    });

    // Update the React state
    setImagePreviews(newPreviewsMap);

    // Update the mutable ref to reflect the URLs that are now active
    activeUrlRefs.current = newPreviewsMap;

    // Perform immediate revocations.
    // Note: no cleanup that revokes ALL urls here. An effect's cleanup runs before
    // every re-run (not only on unmount), so revoking all + clearing the ref on each
    // imageStatuses change would defeat the reuse-by-id logic above and leave Avatar
    // <img> src pointing at a just-revoked blob (net::ERR_FILE_NOT_FOUND). Removed
    // images are already handled by the targeted revoke above; unmount is handled by
    // the dedicated effect below.
    urlsToRevokeFromPreviousActiveSet.forEach(url => URL.revokeObjectURL(url));
  }, [imageStatuses]);

  // Revoke any remaining preview URLs only on unmount.
  useEffect(() => {
    return () => {
      Object.values(activeUrlRefs.current).forEach(url => URL.revokeObjectURL(url));
      activeUrlRefs.current = {};
    };
  }, []);

  const selectImageForCropping = (index: number) => {
    if (imageStatuses[index].status === 'uploaded') return

    resetCropperState()
    setCurrentImageIndex(index)
    setImageStatuses(prev =>
      prev.map((status, i) => ({
        ...status,
        status: i === index ? 'cropping' : (status.status === 'cropping' ? 'pending' : status.status)
      }))
    )
  }

  const handleCropAndUpload = async (index: number) => {
    if (!croppedAreaPixels || !imageStatuses[index]) {
      return
    }

    const imageStatus = imageStatuses[index]

    try {
      const croppedBlob = await getCroppedImg(imageStatus.file, croppedAreaPixels, rotation)

      const croppedFile = new File([croppedBlob], imageStatus.file.name || 'cropped-image.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      const validation: IImageValidationResponse = validateImage(croppedFile, 0, 1, imagesPaginatedCount)
      if (validation.valid) {
        const upload_image_sha256_hex_hash = await fileToSha256Hex(croppedFile)

        const newImage = await dispatch(uploadImage(croppedFile, upload_image_sha256_hex_hash, autoDeleteAfterPeriod))

        if (isIImage(newImage)) {
          // Mark this image as uploaded
          setImageStatuses(prev =>
            prev.map((status, i) =>
              i === index
                ? { ...status, status: 'uploaded', croppedFile }
                : status
            )
          )

          // Find next pending image to crop
          const nextPendingIndex = imageStatuses.findIndex((status, i) =>
            i !== index && status.status === 'pending'
          )

          if (nextPendingIndex !== -1) {
            selectImageForCropping(nextPendingIndex)
          } else {
            setCurrentImageIndex(null)
            // Check if all images are uploaded
            const allUploaded = imageStatuses.every((status, i) =>
              i === index || status.status === 'uploaded'
            )
            if (allUploaded) {
              handleDialogClose()
            }
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

  // Auto-select first image when moving to step 2
  useEffect(() => {
    if (activeStep === 1 && imageStatuses.length > 0) {
      let targetIndex: number | null = null;

      // First, try to re-select the image that was last being cropped, if it's still in 'cropping' status.
      if (currentImageIndex !== null && imageStatuses[currentImageIndex]?.status === 'cropping') {
        targetIndex = currentImageIndex;
      } else {
        // If no image is currently being cropped, or the current one is no longer 'cropping',
        // find the very first image that is still 'pending'.
        const firstPendingIdx = imageStatuses.findIndex(status => status.status === 'pending');
        if (firstPendingIdx !== -1) {
          targetIndex = firstPendingIdx;
        }
      }

      // Only update the selection if a valid target is found and it's different from the current selection.
      if (targetIndex !== null && currentImageIndex !== targetIndex) {
        selectImageForCropping(targetIndex);
      }
      // If there are no pending or actively cropping images, and something was selected, deselect it.
      else if (targetIndex === null && currentImageIndex !== null) {
        setCurrentImageIndex(null);
      }
    }
  }, [activeStep, imageStatuses, currentImageIndex, selectImageForCropping, setCurrentImageIndex]);

  const totalImages = imageStatuses.length;
  const uploadedImagesCount = imageStatuses.filter(status => status.status === 'uploaded').length;
  const allImagesUploaded = totalImages > 0 && uploadedImagesCount === totalImages;

  return (
    <Container>
      <Dialog
        fullScreen={matches ? false : true}
        open={open}
        TransitionComponent={matches ? ZoomTransition : SlideTransition}
        onClose={handleDialogClose}
        aria-describedby="dialog-slide-upload"
        maxWidth="lg"
        fullWidth
      >
        {!matches && (
          <AppBar sx={{ position: 'relative' }} color="inherit">
            <Toolbar>
              <Typography sx={{ flex: 1 }} variant="h6" component="div">
                Fotos hochladen
              </Typography>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleDialogClose}
                aria-label="cancel"
              >
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}
        <DialogContent sx={{ p: matches ? 3 : 1 }}>
          <Box sx={{ width: '100%' }}>
            <Stepper orientation="vertical" activeStep={activeStep}>
              {steps.map((label, index) => (
                <Step key={label} sx={{ width: "100%", height: "100%" }}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {index === 0 && (
                      <ImageUpload
                        imageStatuses={imageStatuses}
                        setImages={setImages}
                        handleNext={handleNext}
                        handleBack={handleBack}
                        imagePreviews={imagePreviews}
                      />
                    )}
                    {index === 1 && (
                      <ImageCropping
                        imageStatuses={imageStatuses}
                        currentImageIndex={currentImageIndex}
                        selectImageForCropping={selectImageForCropping}
                        setCroppedAreaPixels={setCroppedAreaPixels}
                        rotation={rotation}
                        setRotation={setRotation}
                        handleCropAndUpload={handleCropAndUpload}
                        handleDialogClose={handleDialogClose}
                        handleBack={handleBack}
                        allImagesUploaded={allImagesUploaded}
                        sending={sending}
                        imagePreviews={imagePreviews}
                        autoDeleteAfterPeriod={autoDeleteAfterPeriod}
                        setAutoDeleteAfterPeriod={setAutoDeleteAfterPeriod}
                      />
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default UploadDialog
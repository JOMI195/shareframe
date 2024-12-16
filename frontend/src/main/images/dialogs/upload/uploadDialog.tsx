import React, { useEffect, useState } from 'react'
import {
  AppBar,
  Box,
  Button,
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
  Grid
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import Slide from '@mui/material/Slide'
import Zoom from '@mui/material/Zoom'
import CloseIcon from '@mui/icons-material/Close';
import FileUploadForm from './form'
import ImageCropper from './imageCropper'
import { validateImage } from './validation'
import { useAppDispatch, useAppSelector } from '@/store'
import { closeCreateImageDialog, getDialogs } from '@/store/ui/images/images.slice'
import { uploadImage } from '@/store/entities/images/images.actions'
import { fileToSha256Hex } from '@/common/utils/files/getFileHash.helpers'
import { IImageValidationResponse, isIImage } from '@/types'
import { FixedCropperRef } from 'react-advanced-cropper'

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

const steps = ['Foto auswählen', 'Foto zuschneiden und hochladen'];

const UploadDialog: React.FC = () => {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const matches = useMediaQuery(theme.breakpoints.up('md'))

  const [activeStep, setActiveStep] = useState(0);
  const [image, setImage] = useState<File | null>(null);

  const [cropper, setCropper] = useState<FixedCropperRef | null>(null);


  const open = useAppSelector(getDialogs).create.open;

  const handleDialogClose = () => {
    dispatch(closeCreateImageDialog());
    setImage(null);
    setActiveStep(0);
  }

  const handleNext = () => {
    if (activeStep === 0 && !image) {
      return;
    }
    else if (activeStep === 1 && image) {
      handleDialogUpload();
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDialogUpload = async () => {
    if (cropper) {
      const canvas = cropper.getCanvas();

      if (canvas) {
        canvas.toBlob(async (blob: Blob | null) => {
          if (blob) {
            const croppedFile = new File([blob], image?.name || 'cropped-image.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            const validation: IImageValidationResponse = validateImage(croppedFile, 0);
            if (validation.valid) {
              const upload_image_sha256_hex_hash = await fileToSha256Hex(croppedFile);

              const newImage = await dispatch(uploadImage(croppedFile, upload_image_sha256_hex_hash));

              if (isIImage(newImage)) {
                handleDialogClose()
              }
            }
          }
        }, 'image/jpeg');
      }
    }
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <FileUploadForm
            setImage={setImage}
            image={image}
          />
        );
      case 1:
        return image ? (
          <ImageCropper
            image={image}
            setCropper={setCropper}
          />
        ) : null;
      default:
        return 'Unbekannter Schritt';
    }
  }

  useEffect(() => {
    if (activeStep !== steps.length - 1 && image !== null) {
      handleNext();
    }
  }, [image]);

  return (
    <Container>
      <Dialog
        fullScreen={matches ? false : true}
        open={open}
        TransitionComponent={matches ? ZoomTransition : SlideTransition}
        onClose={handleDialogClose}
        aria-describedby='dialog-slide-upload'
        maxWidth="md"
        fullWidth
      >
        {!matches && (
          <AppBar sx={{ position: 'relative' }} color='inherit'>
            <Toolbar>
              <IconButton
                edge='start'
                color='inherit'
                onClick={handleDialogClose}
                aria-label='cancel'
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
                Foto hochladen
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        <DialogContent>
          <Box sx={{ width: '100%', mb: 2 }}>
            <Stepper orientation="vertical" activeStep={activeStep}>
              {steps.map((label) => (
                <Step key={label} sx={{ width: "100%" }}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    <Container disableGutters maxWidth='sm'>
                      <Grid container>
                        <Grid item xs={12} sx={{ mt: 5 }}>
                          {getStepContent(activeStep)}
                        </Grid>
                        <Grid item xs={12} sx={{ mt: 5 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={handleNext}
                            disabled={!image}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            {activeStep === steps.length - 1 ? 'Zuschneiden und Hochladen' : 'Weiter'}
                          </Button>
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant='outlined'
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            Zurück
                          </Button>
                        </Grid>
                      </Grid>
                    </Container>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        </DialogContent>
        {/* <DialogActions>
          {matches && (
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: '100%' }}>
              {activeStep !== 0 && (
                <Button onClick={handleBack} disabled={isUploading}>
                  Zurück
                </Button>
              )}
              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={activeStep === 0 && !image}
                >
                  Weiter
                </Button>
              ) : (
                <Button
                  onClick={handleDialogUpload}
                  disabled={!image || isUploading}
                >
                  {isUploading ? 'Hochladen...' : 'Hochladen'}
                </Button>
              )}
            </Box>
          )}
          {!matches && activeStep !== steps.length - 1 && (
            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: '100%' }}>
              {activeStep !== 0 && (
                <Button onClick={handleBack} disabled={isUploading}>
                  Zurück
                </Button>
              )}
            </Box>
          )}
        </DialogActions> */}
      </Dialog>
    </Container >
  )
}

export default UploadDialog;
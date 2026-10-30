import React, { useState } from "react";
import AppDialog from '@/common/components/appDialog';
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import { useFormik, getIn } from "formik";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { closeCreateFriendshipsDialog, getDialogs, openFriendshipsAlertSnackbar } from "@/store/ui/friendships/friendships.slice";
import { IFriendshipCreateForm, isIFriendship } from "@/types";
import { sendFrindshipRequest } from "@/store/entities/friendships/friendships.actions";
import { Box, Divider, Grid, IconButton, Paper, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import DialogHeader from '@/common/components/dialogHeader';
import { copyToClipboard } from "@/common/utils/clipboard/clipboard";

const FriendshipCreateDialog: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const open = useAppSelector(getDialogs).create.open;
  const user = useAppSelector(getUser);
  const friendshipCode = user.me.account.friendship_user_search_code;

  const matches = useMediaQuery(theme.breakpoints.up('sm'));

  const [initialValues] = useState<IFriendshipCreateForm>({
    reciever_friendship_user_search_code: "",
  });

  const validationSchema = yup.object({
    reciever_friendship_user_search_code: yup
      .string()
      .required("Dieses Feld wird benötigt" as string)
      .matches(
        /^[A-Za-z0-9]{8}$/,
        "Der Code besteht aus 8 Zeichen" as string
      )
    ,
  });

  const form = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values: IFriendshipCreateForm) => {
      const newFriendshipRequest = await dispatch(sendFrindshipRequest(values.reciever_friendship_user_search_code));
      if (isIFriendship(newFriendshipRequest)) {
        dispatch(closeCreateFriendshipsDialog());
        form.resetForm();
      }
    },
  });

  const handleDialogClose = () => {
    dispatch(closeCreateFriendshipsDialog());
    form.resetForm();
  };

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(friendshipCode);
    dispatch(openFriendshipsAlertSnackbar(
      ok
        ? { message: "Eigener Freundescode in die Zwischenablage kopiert", severity: "success" }
        : { message: "Kopieren fehlgeschlagen", severity: "error" }
    ));
  };

  const canShare = typeof navigator.share === "function";

  const handleShareCode = async () => {
    try {
      await navigator.share({ title: "ShareFrame", text: `Mein Freundescode für ShareFrame: ${friendshipCode}` });
    } catch {
      // Closing the share sheet rejects as well.
    }
  };

  return (
    <AppDialog
      fullScreen={matches ? false : true}
      open={open}
      onClose={handleDialogClose}
      aria-labelledby="friendship-create-title"
      maxWidth="xs"
      fullWidth
      slots={{
        transition: matches ? ZoomTransition : SlideTransition
      }}
    >
      <DialogHeader title="Freund hinzufügen" titleId="friendship-create-title" onClose={handleDialogClose} />
      <DialogContent>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          p: 2
        }}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              backgroundColor: 'background.default'
            }}
          >
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{
                fontWeight: "bold"
              }}>
                Von Nutzern eine Anfrage erhalten:
              </Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                Dein Freundescode, wenn dir andere Personen eine Anfrage stellen sollen
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'background.paper',
                  p: 2,
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'divider'
                }}
              >
                <Typography
                  variant="h6"
                  color="primary"
                  sx={{ fontWeight: 'bold', letterSpacing: 2 }}
                >
                  {friendshipCode}
                </Typography>
                <Box sx={{ display: 'flex' }}>
                  {canShare && (
                    <IconButton
                      onClick={handleShareCode}
                      aria-label="Meinen Code teilen"
                      sx={{ width: 44, height: 44, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                    >
                      <ShareIcon />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={handleCopyCode}
                    className="ignore-clickaway"
                    aria-label="Meinen Code kopieren"
                    sx={{ width: 44, height: 44, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
              </Box>
            </Stack>
          </Paper>

          <Divider textAlign="center" sx={{ my: 2 }}>
            <Typography variant="subtitle2" sx={{
              color: "text.secondary"
            }}>
              ODER
            </Typography>
          </Divider>

          <Paper
            elevation={2}
            sx={{
              p: 3,
              backgroundColor: 'background.default'
            }}
          >
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{
                fontWeight: "bold"
              }}>
                Freundschaftsanfrage senden
              </Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                Gib den Freundescode der Person ein, die du hinzufügen möchtest.
              </Typography>
              <Box
                component='form'
                id='friendship-create-form'
                noValidate
                onSubmit={form.handleSubmit}
                sx={{ mt: 3 }}
              >
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      id='friend_code'
                      name='reciever_friendship_user_search_code'
                      autoComplete="off"
                      label="Freundescode"
                      value={form.values.reciever_friendship_user_search_code}
                      onBlur={form.handleBlur}
                      onChange={(e) => {
                        const uppercaseValue = e.target.value.toUpperCase();
                        form.setFieldValue('reciever_friendship_user_search_code', uppercaseValue);
                      }}
                      error={
                        form.touched.reciever_friendship_user_search_code &&
                        Boolean(form.errors.reciever_friendship_user_search_code)
                      }
                      helperText={
                        getIn(form.touched, "reciever_friendship_user_search_code") &&
                        getIn(form.errors, "reciever_friendship_user_search_code")
                      }
                      fullWidth
                      variant='outlined'
                      slotProps={{
                        htmlInput: {
                          style: { textTransform: 'uppercase' },
                          autoCapitalize: 'characters',
                          autoCorrect: 'off',
                          spellCheck: false,
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Button
                      type='submit'
                      fullWidth
                      form='friendship-create-form'
                      variant='contained'
                      loading={form.isSubmitting}
                    >
                      {'Anfrage senden'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Paper>
        </Box>

      </DialogContent>
    </AppDialog>
  );
};

export default FriendshipCreateDialog;

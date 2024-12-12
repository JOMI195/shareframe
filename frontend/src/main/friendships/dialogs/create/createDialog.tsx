import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Zoom from "@mui/material/Zoom";
import { TransitionProps } from "@mui/material/transitions";
import { useFormik, getIn } from "formik";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { closeCreateFriendshipsDialog, getDialogs } from "@/store/ui/friendships/friendships.slice";
import { IFriendshipCreateForm, isIFriendship } from "@/types";
import { sendFrindshipRequest } from "@/store/entities/friendships/friendships.actions";
import { Box, Divider, Grid, Paper, Stack, TextField, Typography } from "@mui/material";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ZoomTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Zoom ref={ref} {...props} />;
});

const FriendshipCreateDialog: React.FC = () => {
  const dispatch = useAppDispatch();

  const open = useAppSelector(getDialogs).create.open;
  const user = useAppSelector(getUser);
  const friendshipCode = user.me.account.friendship_user_search_code;

  const [initialValues] = useState<IFriendshipCreateForm>({
    reciever_friendship_user_search_code: "",
  });

  const validationSchema = yup.object({
    reciever_friendship_user_search_code: yup
      .string()
      .required("Dieses Feld wird benötigt" as string)
      .matches(
        /^(?=.*[A-Z]).{8,8}$/,
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(friendshipCode);
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      TransitionComponent={ZoomTransition}
      aria-labelledby="friendship-create-dialog"
      fullWidth
      maxWidth="xs"
    >
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
              <Typography variant="subtitle1" fontWeight="bold">
                Von Nutzern eine Anfrage erhalten:
              </Typography>
              <Typography variant="body2" color="text.secondary">
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
                <ContentCopyIcon
                  onClick={handleCopyCode}
                  sx={{
                    cursor: 'pointer',
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                />
              </Box>
            </Stack>
          </Paper>

          <Divider textAlign="center" sx={{ my: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
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
              <Typography variant="subtitle1" fontWeight="bold">
                Freundschaftsanfrage senden
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bitte gebe hier den Freundschaftscode der Person ein, welche du hinzufügen möchtest
              </Typography>
              <Box
                component='form'
                id='friendship-create-form'
                noValidate
                onSubmit={form.handleSubmit}
                sx={{ mt: 3 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      id='friend_code'
                      name='reciever_friendship_user_search_code'
                      label="Freundschaftscode"
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
                      inputProps={{
                        style: { textTransform: 'uppercase' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type='submit'
                      fullWidth
                      form='friendship-create-form'
                      variant='contained'
                    >
                      {'Hinzufügen'}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <Button
                      type="button"
                      fullWidth
                      variant="outlined"
                      color="secondary"
                      onClick={handleDialogClose}
                    >
                      {"abbrechen"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Paper>
        </Box>

      </DialogContent>
    </Dialog>
  );
};

export default FriendshipCreateDialog;

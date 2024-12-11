import React, { useEffect, useState } from "react";
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
import { Alert, Box, Grid, TextField, Typography } from "@mui/material";

const ZoomTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Zoom ref={ref} {...props} />;
});

const FriendshipCreateDialog: React.FC = () => {
  const open = useAppSelector(getDialogs).create.open;
  const dispatch = useAppDispatch();

  const [initialValues] = useState<IFriendshipCreateForm>({
    reciever_friendship_user_search_code: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (errorMessage) {
      timer = setTimeout(() => {
        setErrorMessage("");
      }, 10000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [errorMessage]);

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
      const newFriendshipRequest = dispatch(sendFrindshipRequest(values.reciever_friendship_user_search_code));
      if (isIFriendship(newFriendshipRequest)) {
        dispatch(closeCreateFriendshipsDialog());
        form.resetForm();
      } else {
        setErrorMessage("");
      }
    },
  });

  const handleDialogClose = () => {
    dispatch(closeCreateFriendshipsDialog());
    form.resetForm();
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
        <Typography component="h1" variant="h5" sx={{ mb: 5 }}>
          {"Neue Freundschaftsanfrage"}
        </Typography >
        <Typography >
          {"Bitte gebe hier den Freundschaftscode der Person ein, welche du hinzufügen möchtest"}
        </Typography>
        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
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
      </DialogContent>
    </Dialog>
  );
};

export default FriendshipCreateDialog;

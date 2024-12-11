import * as contactSlice from "./contact.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as contactEndpoints from "@/assets/endpoints/api/contactEndpoints";

export const sendContactEmail = (emaildata: {
  name: string,
  email: string,
  subject: string,
  message: string,
}) =>
  apiRequest({
    url: contactEndpoints.getContactUrl(),
    method: "post",
    onStart: contactSlice.contactEmailSendingPending.type,
    onSuccess: contactSlice.contactEmailSendingFulfilled.type,
    onError: contactSlice.contactEmailSendingFailed.type,
    data: emaildata
  });

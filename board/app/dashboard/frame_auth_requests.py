from flask import current_app
import requests
from common.frame_token import TokenManager


def authenticated_request(url, method, **kwargs):
    """
    Helper function to make authenticated requests from anywhere in the application.
    """
    # Get the session from app extensions
    try:
        session = current_app.extensions.get("token_auth_session")
        if not session:
            # Create a session if middleware not initialized
            session = requests.Session()
    except RuntimeError:
        # Handle case when outside application context
        session = requests.Session()

    # Ensure token is valid
    if not TokenManager.verify_token_expiry():
        TokenManager.obtain_token()

    # Add authentication headers
    headers = kwargs.get("headers", {})
    headers.update(TokenManager.get_auth_headers())
    kwargs["headers"] = headers

    # Make request
    response = getattr(session, method.lower())(url, **kwargs)

    # Handle token refresh if needed
    if response.status_code == 401:  # Unauthorized
        if not TokenManager.verify_token():
            TokenManager.obtain_token()

        headers.update(TokenManager.get_auth_headers())
        kwargs["headers"] = headers
        # Retry request
        response = getattr(session, method.lower())(url, **kwargs)

    return response

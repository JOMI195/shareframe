import requests
from common.frame_token import TokenManager


def frame_auth_token_request(url, method="get", **kwargs):
    """
    Helper function to make authenticated requests from anywhere in the application.
    This version works without Flask application context.
    """
    # Create a session for the request
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

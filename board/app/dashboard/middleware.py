import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class TokenAuthMiddleware:
    """
    Flask middleware for outgoing requests to handle token authentication for specific endpoints.
    """

    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        """Initialize the middleware with the Flask app."""
        # Create a session with retry capability
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.3,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        self.session.mount("http://", HTTPAdapter(max_retries=retry_strategy))
        self.session.mount("https://", HTTPAdapter(max_retries=retry_strategy))

        # Store the session on the app
        app.extensions["token_auth_session"] = self.sessio

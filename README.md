<img width="500" height="346" alt="shareframe-title" src="https://github.com/user-attachments/assets/b1915004-cf27-4fd1-8438-6c772b75e4a8" />

# Server side of ShareFrame

Shareframe is a web application platform for sharing photos to a network of e-paper picture frames managed by raspberrypi zero microcontroller boards. Users upload and manage images through the web app and send them to their other friends picture frames. These picture frames will show them as a slideshow for a defined period of time.

## Related repos:

- [shareframe-board](https://github.com/JOMI195/shareframe-board) — C++ application firmware and local web dashboard of the picture frame raspberry pi zero hardware board
- [shareframe-hardware](https://github.com/JOMI195/shareframe-hardware) — Custom embedded Buildroot Linux OS for the raspberry pi zero hardware board

## Features
- Upload and manage photos in a personal library
- Pair e-paper frames to your account and manage them
- Add and manage friends
- Send photos to your own or your friends frames; they appear in the slideshow within seconds or in the next loop
- View history of sent photos and remove a sent photo from a users frame's slideshow
- Overview Dashboard with usage statistics and recent activity
- Manage account: profile, password change, password reset, account deletion
- Automatic firmware updates for frames with release notes
- Summary of features for users

## Website-preview

<img width="1600" height="1200" alt="Shareframe landing page screenshot" src="https://github.com/user-attachments/assets/757f3b50-6851-4ae0-a3a9-3e3df8f1fde1" />

*Figure 1: Screenshot of the landing page of the web application showing statistics and quick links to actions regarding pictures, friends and picture frames management*

## Architecture

<img width="902" height="971" alt="shareframe server architecture" src="https://github.com/user-attachments/assets/f2b9c7d0-b53a-4cb8-9fe4-61d5cee8fa13" />

*Figure 2: Outline of the architecture of the server side of the Shareframe application*

**Client side**:

- **Frontend**: The frontend is a React-based web application where users can interact with the platform. The client communicates with the backend via HTTPS requests. It allows users to create an account, upload and manage their images, pair and configure their e-paper picture frames, connect with friends, and share images to their own or their friends' frames.

- **Picture frames**: Alongside the browser client, the e-paper picture frames themselves act as clients of the platform. Each paired frame maintains a persistent WebSocket connection to the backend, over which it receives shared images and displays them as a slideshow.

**Backend**:

- **Django**: Django with a Gunicorn WSGI server serves as the main backend application server that handles business logic and REST API requests, including authentication (JWT), frame pairing, image uploads, and friendships. It interacts with PostgreSQL to query the database and with Redis to store tasks for asynchronous execution and to publish real-time events.

- **Daphne (WebSockets)**: A separate Daphne ASGI server runs Django Channels and handles the persistent WebSocket connections of the picture frames. When a user shares an image, Django publishes an event through the Redis channel layer, and Daphne pushes the image to the connected frame in real time.

- **Redis**: Redis serves two purposes. It is the message broker for task queuing in Celery and it is the channel layer for Django Channels, bridging the WSGI (Django) and ASGI (Daphne) processes for direct delivery to frames.

- **Celery**: Celery handles asynchronous task execution, such as sending emails. A Celery Beat scheduler additionally triggers periodic maintenance jobs, for example deleting expired images, removing inactive users and stale WebSocket connections, and rejecting long-pending friendship requests.

- **Database**: A PostgreSQL database interacts with Django and Celery for storing and retrieving users, frames, images, friendships, and other persistent data.

**Deployment**:

- **Hetzner Cloud**: The entire application is hosted on Hetzner Cloud, a hosting service.

- **Nginx**: Acts as a reverse proxy server that routes traffic between the clients and the backend services. It serves static assets such as the built React web app, delivers protected media files and routes API requests to the Django server and WebSocket traffic to the Daphne server.

- **Docker**: All services are containerized using Docker and orchestrated with Docker Compose, allowing for easy deployment of the different components like Django, Daphne, Redis, Celery, Nginx and PostgreSQL.

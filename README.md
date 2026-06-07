# ReBrick

Reuse and rediscover your old LEGO collection.

https://github.com/user-attachments/assets/c39c049e-b1b7-4df3-94af-300d3e8dc337

## About

I had this idea because a lot of people have buckets of random LEGO pieces and do not know what they can build with them.

ReBrick lets people upload photos of loose pieces, fix anything the app got wrong, and get ideas for things they can build.

I built it as one project where I could work on frontend, backend, computer vision, and 3D visualisation in the same app.

## How it works

1. Upload 1 to 3 photos of loose pieces on a plain background with no overlap.
2. The app checks the photos and makes a rough piece list.
3. If something looks wrong, the user can fix it or skip it.
4. The app uses the final piece list to show build ideas.
5. The user can open a 3D preview and an assembly page for each build.

## Features

1. Photo upload
2. Quick test gallery
3. Piece review with quick matches, a dropdown, and skip
4. Current cart with add and remove controls
5. Build ideas by category
6. 3D exploded view
7. 3D assembled view
8. Separate assembly page

## Tech stack

1. React and TypeScript
2. TailwindCSS
3. Three.js and React Three Fiber
4. Python, FastAPI, and Pydantic
5. OpenCV and image processing
6. Python unit tests and frontend build checks

## Getting started

1. Set up the backend.

```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
```

2. Start the backend.

```bash
cd backend
./.venv/bin/python -m uvicorn app.main:app --reload
```

3. Set up the frontend.

```bash
cd frontend
npm install
```

4. Start the frontend.

```bash
cd frontend
npm run dev
```

5. Open the local address shown by Vite in your browser.
6. More notes are in `docs/backend-readme.md`, `docs/frontend-readme.md`, and `docs/roadmap.md`.

## Roadmap

1. Make the piece count better on plain background photos
2. Cut down wrong matches on small and odd pieces
3. Add more build ideas
4. Make more builds use bigger piece counts
5. Improve the 3D shapes and assembly pages

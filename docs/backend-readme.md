# Backend

## About

The backend handles uploads, piece checks, saved scan data, and build ideas.

## Main files

1. `backend/app/main.py` starts the API and the routes
2. `backend/app/scans/` handles uploads and piece checking
3. `backend/app/recommendation/` holds the build list and the matching code
4. `backend/tests/` holds the backend tests

## Main routes

1. `/api/scan-demo`
2. `/api/scan-samples`
3. `/api/scans/{upload_id}/review`
4. `/api/recommendations`
5. `/api/catalog/builds/{build_id}`

## Notes

1. Uploads are stored in `backend/storage/uploads`
2. The piece check works best on plain backgrounds with no overlap
3. Run tests with `./.venv/bin/python -m unittest discover -s tests`

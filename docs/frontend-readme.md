# Frontend

## About

The frontend handles the scan page, the review page, the build list, and the 3D pages.

## Main files

1. `frontend/src/App.tsx` holds the main pages and state
2. `frontend/src/components/` holds the UI parts
3. `frontend/src/data/` holds build data, piece data, and 3D layouts
4. `frontend/src/lib/` holds API calls and piece helpers

## Notes

1. The review page shows cropped piece images for uncertain guesses
2. The build page shows the build list on the left and the preview on the right
3. The assembly page opens as its own page so browser back and forward works properly
4. Run the frontend with `npm run dev`

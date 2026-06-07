PYTHON ?= python3

.PHONY: backend-test backend-run

backend-test:
	cd backend && $(PYTHON) -m unittest discover -s tests

backend-run:
	cd backend && $(PYTHON) -m uvicorn app.main:app --reload


import mimetypes
from pathlib import Path
from shutil import copy2
from urllib.parse import quote

from app.schemas import SampleImageListResponse, SampleImageResponse, UploadedScanFile


ALLOWED_SAMPLE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def list_sample_images(sample_root: Path, base_url: str = "/sample-images") -> SampleImageListResponse:
    if not sample_root.exists():
        return SampleImageListResponse(samples=[])

    sample_files = [
        file_path
        for file_path in sorted(sample_root.iterdir(), key=lambda path: path.name.lower())
        if file_path.is_file() and file_path.suffix.lower() in ALLOWED_SAMPLE_EXTENSIONS
    ]

    return SampleImageListResponse(
        samples=[
            SampleImageResponse(
                sample_id=file_path.name,
                file_name=f"Test {index}",
                url=f"{base_url}/{quote(file_path.name)}",
                size_bytes=file_path.stat().st_size,
            )
            for index, file_path in enumerate(sample_files, start=1)
        ]
    )


def resolve_sample_paths(sample_ids: list[str], sample_root: Path) -> list[Path]:
    resolved_paths: list[Path] = []

    for sample_id in sample_ids:
        sample_path = sample_root / sample_id

        if not sample_path.exists() or not sample_path.is_file():
            raise FileNotFoundError(sample_id)

        if sample_path.suffix.lower() not in ALLOWED_SAMPLE_EXTENSIONS:
            raise ValueError(sample_id)

        resolved_paths.append(sample_path)

    return resolved_paths


def copy_sample_images_to_upload_dir(sample_paths: list[Path], upload_dir: Path) -> list[UploadedScanFile]:
    saved_files: list[UploadedScanFile] = []

    for index, sample_path in enumerate(sample_paths, start=1):
        stored_name = f"{index:02d}_{sample_path.name.replace(' ', '_')}"
        stored_path = upload_dir / stored_name
        copy2(sample_path, stored_path)

        content_type = mimetypes.guess_type(sample_path.name)[0] or "application/octet-stream"
        saved_files.append(
            UploadedScanFile(
                original_name=sample_path.name,
                stored_name=stored_name,
                content_type=content_type,
                size_bytes=stored_path.stat().st_size,
            )
        )

    return saved_files

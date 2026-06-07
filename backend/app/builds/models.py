from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class MissingPieceResult:
    family_id: str
    short_by: int


@dataclass(frozen=True)
class BuildMatch:
    build_id: str
    name: str
    category: str
    description: str
    compatibility_score: float
    matched_families: Dict[str, int]
    missing_families: List[MissingPieceResult]
    tags: List[str]


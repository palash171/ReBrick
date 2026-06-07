from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class MissingRequirementResult:
    family_id: str
    short_by: int


@dataclass(frozen=True)
class BuildRecommendationResult:
    build_id: str
    name: str
    category: str
    description: str
    compatibility_score: float
    matched_families: Dict[str, int]
    missing_families: List[MissingRequirementResult]
    tags: List[str]


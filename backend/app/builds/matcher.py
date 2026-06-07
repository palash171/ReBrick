from typing import Dict, Iterable, List, Optional

from app.builds.catalog import BUILD_CATALOG, BuildTemplate
from app.builds.models import (
    BuildMatch,
    MissingPieceResult,
)
from app.builds.piece_families import normalize_inventory


def score_template(
    template: BuildTemplate,
    family_inventory: Dict[str, int],
) -> BuildMatch:
    matched_families: Dict[str, int] = {}
    missing_families: List[MissingPieceResult] = []
    matched_total = 0
    required_total = 0

    for family_id, required_quantity in template.required_families.items():
        available_quantity = family_inventory.get(family_id, 0)
        matched_quantity = min(available_quantity, required_quantity)

        matched_families[family_id] = matched_quantity
        matched_total += matched_quantity
        required_total += required_quantity

        if available_quantity < required_quantity:
            missing_families.append(
                MissingPieceResult(
                    family_id=family_id,
                    short_by=required_quantity - available_quantity,
                )
            )

    compatibility_score = matched_total / required_total if required_total else 0.0

    return BuildMatch(
        build_id=template.build_id,
        name=template.name,
        category=template.category,
        description=template.description,
        compatibility_score=round(compatibility_score, 2),
        matched_families=matched_families,
        missing_families=missing_families,
        tags=template.tags,
    )


def find_build_ideas(
    raw_inventory: Dict[str, int],
    category: Optional[str] = None,
    catalog: Iterable[BuildTemplate] = BUILD_CATALOG,
) -> Dict[str, object]:
    normalized_inventory = normalize_inventory(raw_inventory)
    build_ideas = []

    for template in catalog:
        if category and template.category != category:
            continue
        build_ideas.append(score_template(template, normalized_inventory))

    build_ideas.sort(
        key=lambda item: (item.compatibility_score, -len(item.missing_families)),
        reverse=True,
    )

    return {
        "normalized_inventory": normalized_inventory,
        "build_ideas": build_ideas,
    }

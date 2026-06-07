from typing import Dict


PIECE_TO_FAMILY: Dict[str, str] = {
    "piece_2x4": "support_brick",
    "piece_2x3": "support_brick",
    "piece_2x2": "support_brick",
    "piece_1x2": "detail_plate",
    "piece_1x1": "small_brick",
    "piece_1x4": "long_plate",
    "piece_1x6": "long_plate",
    "piece_2x6": "long_plate",
    "piece_round": "wheel_component",
    "piece_connector": "connector_plate",
    "brick_2x4": "support_brick",
    "brick_2x3": "support_brick",
    "brick_2x2": "support_brick",
    "brick_1x2": "support_brick",
    "brick_1x1": "support_brick",
    "plate_1x2": "detail_plate",
    "plate_1x4": "long_plate",
    "plate_1x6": "long_plate",
    "plate_2x2": "connector_plate",
    "plate_2x6": "long_plate",
    "tile_1x4": "flat_tile",
    "tile_2x2": "flat_tile",
    "slope_2x2": "sloped_piece",
    "hinge_plate": "hinge_piece",
    "wheel_small": "wheel_component",
    "tire_small": "wheel_component",
    "technic_pin": "technic_component",
    "red_2x4_brick": "support_brick",
    "blue_2x4_brick": "support_brick",
    "yellow_2x4_brick": "support_brick",
    "yellow_2x3_brick": "support_brick",
    "red_2x3_brick": "support_brick",
    "white_2x2_brick": "support_brick",
    "gray_1x2_brick": "support_brick",
    "tan_1x2_brick": "support_brick",
    "black_1x1_brick": "support_brick",
    "black_1x2_plate": "detail_plate",
    "red_1x2_plate": "detail_plate",
    "green_1x4_plate": "long_plate",
    "blue_2x6_plate": "long_plate",
    "gray_1x6_plate": "long_plate",
    "gray_2x2_plate": "connector_plate",
    "tan_2x2_plate": "connector_plate",
    "black_2x2_tile": "flat_tile",
    "white_1x4_tile": "flat_tile",
    "small_wheel": "wheel_component",
    "small_tire": "wheel_component",
    "gray_slope_2x2": "sloped_piece",
    "red_slope_2x2": "sloped_piece",
    "black_hinge_plate": "hinge_piece",
    "gray_hinge_plate": "hinge_piece",
    "gray_technic_pin": "technic_component",
}


def normalize_inventory(raw_inventory: Dict[str, int]) -> Dict[str, int]:
    family_inventory: Dict[str, int] = {}

    for piece_id, quantity in raw_inventory.items():
        family_id = PIECE_TO_FAMILY.get(piece_id, "unknown_piece")
        family_inventory[family_id] = family_inventory.get(family_id, 0) + quantity

    return family_inventory

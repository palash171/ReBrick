export type PieceFamilyId =
  | "support_brick"
  | "detail_plate"
  | "long_plate"
  | "connector_plate"
  | "flat_tile"
  | "wheel_component"
  | "sloped_piece"
  | "hinge_piece"
  | "technic_component"
  | "small_brick"
  | "unknown_piece";

export type PieceShape =
  | "brick"
  | "plate"
  | "tile"
  | "slope"
  | "wheel"
  | "hinge"
  | "technic"
  | "unknown";

export interface PieceDefinition {
  pieceId: string;
  label: string;
  referenceName: string;
  familyId: PieceFamilyId;
  shape: PieceShape;
  studsX: number;
  studsY: number;
}

export const pieceCatalogById: Record<string, PieceDefinition> = {
  piece_2x4: {
    pieceId: "piece_2x4",
    label: "2x4",
    referenceName: "2x4",
    familyId: "support_brick",
    shape: "brick",
    studsX: 4,
    studsY: 2,
  },
  piece_2x3: {
    pieceId: "piece_2x3",
    label: "2x3",
    referenceName: "2x3",
    familyId: "support_brick",
    shape: "brick",
    studsX: 3,
    studsY: 2,
  },
  piece_2x2: {
    pieceId: "piece_2x2",
    label: "2x2",
    referenceName: "2x2",
    familyId: "support_brick",
    shape: "brick",
    studsX: 2,
    studsY: 2,
  },
  piece_1x6: {
    pieceId: "piece_1x6",
    label: "1x6",
    referenceName: "1x6",
    familyId: "long_plate",
    shape: "plate",
    studsX: 6,
    studsY: 1,
  },
  piece_2x6: {
    pieceId: "piece_2x6",
    label: "2x6",
    referenceName: "2x6",
    familyId: "long_plate",
    shape: "plate",
    studsX: 6,
    studsY: 2,
  },
  piece_1x4: {
    pieceId: "piece_1x4",
    label: "1x4",
    referenceName: "1x4",
    familyId: "long_plate",
    shape: "plate",
    studsX: 4,
    studsY: 1,
  },
  piece_1x2: {
    pieceId: "piece_1x2",
    label: "1x2",
    referenceName: "1x2",
    familyId: "detail_plate",
    shape: "plate",
    studsX: 2,
    studsY: 1,
  },
  piece_1x1: {
    pieceId: "piece_1x1",
    label: "1x1",
    referenceName: "1x1",
    familyId: "small_brick",
    shape: "brick",
    studsX: 1,
    studsY: 1,
  },
  piece_round: {
    pieceId: "piece_round",
    label: "Round",
    referenceName: "Round",
    familyId: "wheel_component",
    shape: "wheel",
    studsX: 2,
    studsY: 2,
  },
  piece_connector: {
    pieceId: "piece_connector",
    label: "Connector",
    referenceName: "Connector",
    familyId: "connector_plate",
    shape: "technic",
    studsX: 3,
    studsY: 1,
  },
  brick_2x4: {
    pieceId: "brick_2x4",
    label: "2x4 Brick",
    referenceName: "2x4 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 4,
    studsY: 2,
  },
  brick_2x3: {
    pieceId: "brick_2x3",
    label: "2x3 Brick",
    referenceName: "2x3 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 3,
    studsY: 2,
  },
  brick_2x2: {
    pieceId: "brick_2x2",
    label: "2x2 Brick",
    referenceName: "2x2 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 2,
    studsY: 2,
  },
  brick_1x2: {
    pieceId: "brick_1x2",
    label: "1x2 Brick",
    referenceName: "1x2 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 2,
    studsY: 1,
  },
  brick_1x1: {
    pieceId: "brick_1x1",
    label: "1x1 Brick",
    referenceName: "1x1 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 1,
    studsY: 1,
  },
  plate_1x2: {
    pieceId: "plate_1x2",
    label: "1x2 Plate",
    referenceName: "1x2 Plate",
    familyId: "detail_plate",
    shape: "plate",
    studsX: 2,
    studsY: 1,
  },
  plate_1x4: {
    pieceId: "plate_1x4",
    label: "1x4 Plate",
    referenceName: "1x4 Plate",
    familyId: "long_plate",
    shape: "plate",
    studsX: 4,
    studsY: 1,
  },
  plate_1x6: {
    pieceId: "plate_1x6",
    label: "1x6 Plate",
    referenceName: "1x6 Plate",
    familyId: "long_plate",
    shape: "plate",
    studsX: 6,
    studsY: 1,
  },
  plate_2x2: {
    pieceId: "plate_2x2",
    label: "2x2 Plate",
    referenceName: "2x2 Plate",
    familyId: "connector_plate",
    shape: "plate",
    studsX: 2,
    studsY: 2,
  },
  plate_2x6: {
    pieceId: "plate_2x6",
    label: "2x6 Plate",
    referenceName: "2x6 Plate",
    familyId: "long_plate",
    shape: "plate",
    studsX: 6,
    studsY: 2,
  },
  tile_1x4: {
    pieceId: "tile_1x4",
    label: "1x4 Tile",
    referenceName: "1x4 Tile",
    familyId: "flat_tile",
    shape: "tile",
    studsX: 4,
    studsY: 1,
  },
  tile_2x2: {
    pieceId: "tile_2x2",
    label: "2x2 Tile",
    referenceName: "2x2 Tile",
    familyId: "flat_tile",
    shape: "tile",
    studsX: 2,
    studsY: 2,
  },
  slope_2x2: {
    pieceId: "slope_2x2",
    label: "2x2 Slope",
    referenceName: "2x2 Slope",
    familyId: "sloped_piece",
    shape: "slope",
    studsX: 2,
    studsY: 2,
  },
  hinge_plate: {
    pieceId: "hinge_plate",
    label: "Hinge Plate",
    referenceName: "Hinge Plate",
    familyId: "hinge_piece",
    shape: "hinge",
    studsX: 2,
    studsY: 1,
  },
  wheel_small: {
    pieceId: "wheel_small",
    label: "Small Wheel",
    referenceName: "Small Wheel",
    familyId: "wheel_component",
    shape: "wheel",
    studsX: 2,
    studsY: 2,
  },
  tire_small: {
    pieceId: "tire_small",
    label: "Small Tire",
    referenceName: "Small Tire",
    familyId: "wheel_component",
    shape: "wheel",
    studsX: 2,
    studsY: 2,
  },
  technic_pin: {
    pieceId: "technic_pin",
    label: "Technic Pin",
    referenceName: "Technic Pin",
    familyId: "technic_component",
    shape: "technic",
    studsX: 3,
    studsY: 1,
  },
  blue_2x4_brick: {
    pieceId: "blue_2x4_brick",
    label: "Blue 2x4 Brick",
    referenceName: "2x4 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 4,
    studsY: 2,
  },
  red_2x4_brick: {
    pieceId: "red_2x4_brick",
    label: "Red 2x4 Brick",
    referenceName: "2x4 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 4,
    studsY: 2,
  },
  yellow_2x4_brick: {
    pieceId: "yellow_2x4_brick",
    label: "Yellow 2x4 Brick",
    referenceName: "2x4 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 4,
    studsY: 2,
  },
  yellow_2x3_brick: {
    pieceId: "yellow_2x3_brick",
    label: "Yellow 2x3 Brick",
    referenceName: "2x3 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 3,
    studsY: 2,
  },
  red_2x3_brick: {
    pieceId: "red_2x3_brick",
    label: "Red 2x3 Brick",
    referenceName: "2x3 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 3,
    studsY: 2,
  },
  white_2x2_brick: {
    pieceId: "white_2x2_brick",
    label: "White 2x2 Brick",
    referenceName: "2x2 Brick",
    familyId: "support_brick",
    shape: "brick",
    studsX: 2,
    studsY: 2,
  },
  black_1x1_brick: {
    pieceId: "black_1x1_brick",
    label: "Black 1x1 Brick",
    referenceName: "1x1 Brick",
    familyId: "small_brick",
    shape: "brick",
    studsX: 1,
    studsY: 1,
  },
  gray_1x2_brick: {
    pieceId: "gray_1x2_brick",
    label: "Gray 1x2 Brick",
    referenceName: "1x2 Brick",
    familyId: "small_brick",
    shape: "brick",
    studsX: 2,
    studsY: 1,
  },
  tan_1x2_brick: {
    pieceId: "tan_1x2_brick",
    label: "Tan 1x2 Brick",
    referenceName: "1x2 Brick",
    familyId: "small_brick",
    shape: "brick",
    studsX: 2,
    studsY: 1,
  },
  black_1x2_plate: {
    pieceId: "black_1x2_plate",
    label: "Black 1x2 Plate",
    referenceName: "1x2 Plate",
    familyId: "detail_plate",
    shape: "plate",
    studsX: 2,
    studsY: 1,
  },
  red_1x2_plate: {
    pieceId: "red_1x2_plate",
    label: "Red 1x2 Plate",
    referenceName: "1x2 Plate",
    familyId: "detail_plate",
    shape: "plate",
    studsX: 2,
    studsY: 1,
  },
  green_1x4_plate: {
    pieceId: "green_1x4_plate",
    label: "Green 1x4 Plate",
    referenceName: "1x4 Plate",
    familyId: "long_plate",
    shape: "plate",
    studsX: 4,
    studsY: 1,
  },
  blue_2x6_plate: {
    pieceId: "blue_2x6_plate",
    label: "Blue 2x6 Plate",
    referenceName: "2x6 Plate",
    familyId: "long_plate",
    shape: "plate",
    studsX: 6,
    studsY: 2,
  },
  gray_1x6_plate: {
    pieceId: "gray_1x6_plate",
    label: "Gray 1x6 Plate",
    referenceName: "1x6 Plate",
    familyId: "long_plate",
    shape: "plate",
    studsX: 6,
    studsY: 1,
  },
  gray_2x2_plate: {
    pieceId: "gray_2x2_plate",
    label: "Gray 2x2 Plate",
    referenceName: "2x2 Plate",
    familyId: "connector_plate",
    shape: "plate",
    studsX: 2,
    studsY: 2,
  },
  tan_2x2_plate: {
    pieceId: "tan_2x2_plate",
    label: "Tan 2x2 Plate",
    referenceName: "2x2 Plate",
    familyId: "connector_plate",
    shape: "plate",
    studsX: 2,
    studsY: 2,
  },
  black_2x2_tile: {
    pieceId: "black_2x2_tile",
    label: "Black 2x2 Tile",
    referenceName: "2x2 Tile",
    familyId: "flat_tile",
    shape: "tile",
    studsX: 2,
    studsY: 2,
  },
  white_1x4_tile: {
    pieceId: "white_1x4_tile",
    label: "White 1x4 Tile",
    referenceName: "1x4 Tile",
    familyId: "flat_tile",
    shape: "tile",
    studsX: 4,
    studsY: 1,
  },
  gray_slope_2x2: {
    pieceId: "gray_slope_2x2",
    label: "Gray 2x2 Slope",
    referenceName: "2x2 Slope",
    familyId: "sloped_piece",
    shape: "slope",
    studsX: 2,
    studsY: 2,
  },
  red_slope_2x2: {
    pieceId: "red_slope_2x2",
    label: "Red 2x2 Slope",
    referenceName: "2x2 Slope",
    familyId: "sloped_piece",
    shape: "slope",
    studsX: 2,
    studsY: 2,
  },
  black_hinge_plate: {
    pieceId: "black_hinge_plate",
    label: "Black Hinge Plate",
    referenceName: "Hinge Plate",
    familyId: "hinge_piece",
    shape: "hinge",
    studsX: 2,
    studsY: 1,
  },
  gray_hinge_plate: {
    pieceId: "gray_hinge_plate",
    label: "Gray Hinge Plate",
    referenceName: "Hinge Plate",
    familyId: "hinge_piece",
    shape: "hinge",
    studsX: 2,
    studsY: 1,
  },
  small_wheel: {
    pieceId: "small_wheel",
    label: "Small Wheel",
    referenceName: "Small Wheel",
    familyId: "wheel_component",
    shape: "wheel",
    studsX: 2,
    studsY: 2,
  },
  small_tire: {
    pieceId: "small_tire",
    label: "Small Tire",
    referenceName: "Small Tire",
    familyId: "wheel_component",
    shape: "wheel",
    studsX: 2,
    studsY: 2,
  },
  gray_technic_pin: {
    pieceId: "gray_technic_pin",
    label: "Gray Technic Pin",
    referenceName: "Technic Pin",
    familyId: "technic_component",
    shape: "technic",
    studsX: 3,
    studsY: 1,
  },
  unknown: {
    pieceId: "unknown",
    label: "Unclear piece",
    referenceName: "Unclear piece",
    familyId: "unknown_piece",
    shape: "unknown",
    studsX: 2,
    studsY: 2,
  },
};

export const pieceCatalog = Object.values(pieceCatalogById).sort((left, right) =>
  left.referenceName.localeCompare(right.referenceName),
);

export const pieceToFamilyMap = Object.fromEntries(
  pieceCatalog.map((piece) => [piece.pieceId, piece.familyId]),
) as Record<string, PieceFamilyId>;

export function getPieceDefinition(pieceId: string) {
  return pieceCatalogById[pieceId];
}

export function getPieceReferenceName(pieceId: string, fallbackLabel?: string) {
  return getPieceDefinition(pieceId)?.referenceName ?? fallbackLabel ?? pieceId;
}

export function getPieceDisplayLabel(pieceId: string, fallbackLabel?: string) {
  return getPieceDefinition(pieceId)?.label ?? fallbackLabel ?? pieceId;
}

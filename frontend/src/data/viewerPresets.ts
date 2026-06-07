import { getPieceDefinition } from "./pieceCatalog";

export type Vector3Tuple = [number, number, number];

export type PrimitiveShape = "box" | "cylinder";

export interface ViewerPrimitive {
  primitiveId: string;
  shape: PrimitiveShape;
  position: Vector3Tuple;
  size: Vector3Tuple;
  rotation?: Vector3Tuple;
  color: string;
  pieceId?: string;
  studless?: boolean;
}

export interface ViewerGroupPreset {
  groupId: string;
  assembledPosition: Vector3Tuple;
  explodedOffset: Vector3Tuple;
  labelOffset?: Vector3Tuple;
  parts: ViewerPrimitive[];
}

export interface ViewerBuildPreset {
  cameraPosition?: Vector3Tuple;
  groups: ViewerGroupPreset[];
}

const STUD_UNIT = 0.34;
const BRICK_HEIGHT = 0.36;
const PLATE_HEIGHT = 0.14;
const TILE_HEIGHT = 0.1;
const SLOPE_HEIGHT = 0.28;
const HINGE_HEIGHT = 0.18;
const TECHNIC_HEIGHT = 0.14;

const BEAR_BROWN = "#8a4b28";
const BEAR_TAN = "#dec18c";
const BEAR_DARK = "#111827";
const CAR_BLUE = "#2563eb";
const CAR_RED = "#dc2626";
const CAR_TEAL = "#06b6d4";
const CAR_GRAY = "#94a3b8";
const CAR_BLACK = "#111827";
const CAR_TAN = "#d4a373";
const HOUSE_RED = "#ef4444";
const HOUSE_YELLOW = "#facc15";
const HOUSE_WHITE = "#e5e7eb";
const HOUSE_GRAY = "#94a3b8";
const DRAGON_GREEN = "#22c55e";
const DRAGON_PURPLE = "#8b5cf6";
const DRAGON_PINK = "#ec4899";
const TOWER_STONE = "#94a3b8";
const TOWER_GOLD = "#facc15";
const TRUCK_BLUE = "#3b82f6";
const TRUCK_ORANGE = "#f97316";
const TRAY_GREEN = "#22c55e";
const ROBOT_GRAY = "#94a3b8";
const ROBOT_CYAN = "#22d3ee";
const SERPENT_GREEN = "#10b981";
const SERPENT_DARK = "#047857";
const SERPENT_GOLD = "#facc15";
const ROVER_SILVER = "#94a3b8";
const ROVER_RED = "#ef4444";
const ROVER_BLUE = "#38bdf8";
const ROVER_DARK = "#1e293b";

function pieceHeight(pieceId: string) {
  const piece = getPieceDefinition(pieceId);

  switch (piece?.shape) {
    case "plate":
      return PLATE_HEIGHT;
    case "tile":
      return TILE_HEIGHT;
    case "slope":
      return SLOPE_HEIGHT;
    case "hinge":
      return HINGE_HEIGHT;
    case "technic":
      return TECHNIC_HEIGHT;
    default:
      return BRICK_HEIGHT;
  }
}

function pieceSize(pieceId: string): Vector3Tuple {
  const piece = getPieceDefinition(pieceId);

  if (!piece) {
    return [0.68, BRICK_HEIGHT, 0.68];
  }

  if (piece.shape === "wheel") {
    return [0.3, 0.3, 0.22];
  }

  if (piece.shape === "technic") {
    return [piece.studsX * STUD_UNIT, TECHNIC_HEIGHT, 0.12];
  }

  return [piece.studsX * STUD_UNIT, pieceHeight(pieceId), piece.studsY * STUD_UNIT];
}

function piecePrimitive(
  primitiveId: string,
  pieceId: string,
  position: Vector3Tuple,
  color: string,
  rotation?: Vector3Tuple,
): ViewerPrimitive {
  const piece = getPieceDefinition(pieceId);

  return {
    primitiveId,
    pieceId,
    shape: piece?.shape === "wheel" ? "cylinder" : "box",
    position,
    size: pieceSize(pieceId),
    rotation,
    color,
    studless: piece?.shape === "tile",
  };
}

function wheelPrimitive(
  primitiveId: string,
  position: Vector3Tuple,
  color: string = CAR_BLACK,
): ViewerPrimitive {
  return piecePrimitive(primitiveId, "small_wheel", position, color, [0, 0, Math.PI / 2]);
}

export const viewerPresetsByBuildId: Record<string, ViewerBuildPreset> = {
  "animal-bear": {
    cameraPosition: [6.2, 4.1, 6.4],
    groups: [
      {
        groupId: "legs",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, -2.2, 0],
        labelOffset: [0, 1.15, 0],
        parts: [
          piecePrimitive("leg-front-left", "white_2x2_brick", [0.58, 0.18, 0.34], BEAR_BROWN),
          piecePrimitive("leg-front-right", "white_2x2_brick", [0.58, 0.18, -0.34], BEAR_BROWN),
          piecePrimitive("leg-back-left", "white_2x2_brick", [-0.34, 0.18, 0.34], BEAR_BROWN),
          piecePrimitive("leg-back-right", "white_2x2_brick", [-0.34, 0.18, -0.34], BEAR_BROWN),
          piecePrimitive("paw-left", "tan_1x2_brick", [0.78, 0.54, 0.34], BEAR_TAN),
          piecePrimitive("paw-right", "tan_1x2_brick", [0.78, 0.54, -0.34], BEAR_TAN),
        ],
      },
      {
        groupId: "body",
        assembledPosition: [0, 0.92, 0],
        explodedOffset: [0, 0, 0],
        labelOffset: [0, 1.2, 0],
        parts: [
          piecePrimitive("torso-bottom", "blue_2x4_brick", [0, 0.18, 0], BEAR_BROWN),
          piecePrimitive("torso-middle", "blue_2x4_brick", [0, 0.54, 0], BEAR_BROWN),
          piecePrimitive("torso-top", "blue_2x4_brick", [0, 0.9, 0], BEAR_BROWN),
          piecePrimitive("belly-plate", "tan_2x2_plate", [0.52, 0.54, 0], BEAR_TAN),
          piecePrimitive("belly-tile", "white_1x4_tile", [0.52, 0.72, 0], BEAR_TAN),
          piecePrimitive("tail", "black_1x1_brick", [-0.86, 0.36, 0], BEAR_BROWN),
        ],
      },
      {
        groupId: "head",
        assembledPosition: [1.28, 1.5, 0],
        explodedOffset: [2.2, 1.9, 0],
        labelOffset: [0, 1.18, 0],
        parts: [
          piecePrimitive("head-bottom-left", "white_2x2_brick", [0, 0.18, 0.18], BEAR_BROWN),
          piecePrimitive("head-bottom-right", "white_2x2_brick", [0, 0.18, -0.18], BEAR_BROWN),
          piecePrimitive("head-top-left", "white_2x2_brick", [0, 0.54, 0.18], BEAR_BROWN),
          piecePrimitive("head-top-right", "white_2x2_brick", [0, 0.54, -0.18], BEAR_BROWN),
          piecePrimitive("ear-left", "gray_1x2_brick", [-0.12, 0.9, 0.36], BEAR_BROWN),
          piecePrimitive("ear-right", "gray_1x2_brick", [-0.12, 0.9, -0.36], BEAR_BROWN),
          piecePrimitive("snout", "tan_2x2_plate", [0.56, 0.34, 0], BEAR_TAN),
          piecePrimitive("eye-left", "black_1x1_brick", [0.56, 0.62, 0.22], BEAR_DARK),
          piecePrimitive("eye-right", "black_1x1_brick", [0.56, 0.62, -0.22], BEAR_DARK),
          piecePrimitive("nose", "black_1x1_brick", [0.8, 0.34, 0], BEAR_DARK),
        ],
      },
    ],
  },
  "vehicle-race-car": {
    cameraPosition: [7.0, 3.8, 6.8],
    groups: [
      {
        groupId: "wheel-base",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, -2.6, 0],
        labelOffset: [0, 1.2, 0],
        parts: [
          piecePrimitive("base-plate", "blue_2x6_plate", [0, 0.07, 0], CAR_TEAL),
          piecePrimitive("support-left", "gray_1x2_brick", [0.36, 0.25, 0.24], CAR_GRAY),
          piecePrimitive("support-right", "gray_1x2_brick", [0.36, 0.25, -0.24], CAR_GRAY),
          piecePrimitive("axle-front", "black_1x2_plate", [0.82, 0.48, 0], CAR_BLACK),
          piecePrimitive("axle-back", "black_1x2_plate", [-0.58, 0.48, 0], CAR_BLACK),
          wheelPrimitive("wheel-front-left", [0.9, 0.18, 0.6]),
          wheelPrimitive("wheel-front-right", [0.9, 0.18, -0.6]),
          wheelPrimitive("wheel-back-left", [-0.9, 0.18, 0.6]),
          wheelPrimitive("wheel-back-right", [-0.9, 0.18, -0.6]),
        ],
      },
      {
        groupId: "body-shell",
        assembledPosition: [0, 0.78, 0],
        explodedOffset: [0, 3.0, 0],
        labelOffset: [0, 1.1, 0],
        parts: [
          piecePrimitive("chassis-core", "blue_2x4_brick", [0, 0.18, 0], CAR_BLUE),
          piecePrimitive("rear-deck", "red_2x3_brick", [-0.34, 0.54, 0], CAR_RED),
          piecePrimitive("seat-strip", "green_1x4_plate", [-0.4, 0.78, 0], CAR_BLUE),
          piecePrimitive("front-slope", "gray_slope_2x2", [0.9, 0.3, 0], CAR_BLUE),
          piecePrimitive("side-plate-left", "black_1x2_plate", [0.15, 0.36, 0.42], CAR_BLACK),
          piecePrimitive("side-plate-right", "black_1x2_plate", [0.15, 0.36, -0.42], CAR_BLACK),
          piecePrimitive("cabin-top", "tan_1x2_brick", [-0.08, 0.96, 0], CAR_TAN),
        ],
      },
    ],
  },
  "object-phone-stand": {
    cameraPosition: [5.8, 4.1, 7.0],
    groups: [
      {
        groupId: "base",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, 0, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("base-left", "blue_2x4_brick", [-0.36, 0.18, 0], "#22d3ee"),
          piecePrimitive("base-right", "blue_2x4_brick", [0.36, 0.18, 0], "#22d3ee"),
          piecePrimitive("base-lock", "gray_2x2_plate", [0, 0.43, 0], "#67e8f9"),
        ],
      },
      {
        groupId: "angled-back",
        assembledPosition: [-0.34, 1.02, 0],
        explodedOffset: [-1.7, 2.0, 0],
        labelOffset: [0, 1.1, 0],
        parts: [
          piecePrimitive("back-bottom", "green_1x4_plate", [0, 0.2, 0], "#6366f1", [0, 0, 0.55]),
          piecePrimitive("back-middle", "green_1x4_plate", [0.1, 0.56, 0], "#818cf8", [0, 0, 0.55]),
          piecePrimitive("back-top", "gray_1x6_plate", [0.2, 0.92, 0], "#818cf8", [0, 0, 0.55]),
        ],
      },
      {
        groupId: "front-stop",
        assembledPosition: [1.02, 0.34, 0],
        explodedOffset: [1.9, -1.1, 0],
        labelOffset: [0, 0.9, 0],
        parts: [
          piecePrimitive("front-lip-left", "tan_1x2_brick", [0, 0.18, 0.18], "#34d399"),
          piecePrimitive("front-lip-right", "tan_1x2_brick", [0, 0.18, -0.18], "#34d399"),
          piecePrimitive("front-lip-top", "white_1x4_tile", [0, 0.42, 0], "#86efac"),
        ],
      },
    ],
  },
  "object-pencil-holder": {
    cameraPosition: [6.3, 4.9, 6.9],
    groups: [
      {
        groupId: "base",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, 0, 0],
        labelOffset: [0, 0.95, 0],
        parts: [
          piecePrimitive("holder-floor-front-left", "piece_2x4", [0.52, 0.18, 0.48], "#6366f1"),
          piecePrimitive("holder-floor-front-right", "piece_2x4", [0.52, 0.18, -0.48], "#6366f1"),
          piecePrimitive("holder-floor-back-left", "piece_2x4", [-0.52, 0.18, 0.48], "#6366f1"),
          piecePrimitive("holder-floor-back-right", "piece_2x4", [-0.52, 0.18, -0.48], "#6366f1"),
          piecePrimitive("holder-floor-bridge-left", "piece_1x4", [0, 0.4, 0.92], "#818cf8"),
          piecePrimitive("holder-floor-bridge-right", "piece_1x4", [0, 0.4, -0.92], "#818cf8"),
        ],
      },
      {
        groupId: "wall-ring",
        assembledPosition: [0, 0.86, 0],
        explodedOffset: [0, 2.0, 0],
        labelOffset: [0, 1.3, 0],
        parts: [
          piecePrimitive("holder-wall-front-left-low", "piece_2x4", [0.64, 0.18, 0.84], "#6366f1"),
          piecePrimitive("holder-wall-front-right-low", "piece_2x4", [0.64, 0.18, -0.84], "#6366f1"),
          piecePrimitive("holder-wall-back-left-low", "piece_2x4", [-0.64, 0.18, 0.84], "#6366f1"),
          piecePrimitive("holder-wall-back-right-low", "piece_2x4", [-0.64, 0.18, -0.84], "#6366f1"),
          piecePrimitive("holder-wall-left-low", "piece_1x6", [0, 0.18, 1.18], "#818cf8"),
          piecePrimitive("holder-wall-right-low", "piece_1x6", [0, 0.18, -1.18], "#818cf8"),
          piecePrimitive("holder-wall-front-left-high", "piece_2x2", [0.92, 0.54, 0.68], "#4f46e5"),
          piecePrimitive("holder-wall-front-right-high", "piece_2x2", [0.92, 0.54, -0.68], "#4f46e5"),
          piecePrimitive("holder-wall-back-left-high", "piece_2x2", [-0.92, 0.54, 0.68], "#4f46e5"),
          piecePrimitive("holder-wall-back-right-high", "piece_2x2", [-0.92, 0.54, -0.68], "#4f46e5"),
        ],
      },
      {
        groupId: "top-rim",
        assembledPosition: [0, 1.72, 0],
        explodedOffset: [0, 3.2, 0],
        labelOffset: [0, 1.08, 0],
        parts: [
          piecePrimitive("holder-rim-front", "piece_1x6", [0.58, 0.14, 0], "#c4b5fd"),
          piecePrimitive("holder-rim-back", "piece_1x6", [-0.58, 0.14, 0], "#c4b5fd"),
          piecePrimitive("holder-rim-left", "piece_1x4", [0, 0.14, 1.12], "#ddd6fe"),
          piecePrimitive("holder-rim-right", "piece_1x4", [0, 0.14, -1.12], "#ddd6fe"),
          piecePrimitive("holder-rim-lock-left", "piece_1x2", [0.84, 0.34, 0.66], "#e9d5ff"),
          piecePrimitive("holder-rim-lock-right", "piece_1x2", [0.84, 0.34, -0.66], "#e9d5ff"),
          piecePrimitive("holder-rim-lock-back-left", "piece_1x2", [-0.84, 0.34, 0.66], "#e9d5ff"),
          piecePrimitive("holder-rim-lock-back-right", "piece_1x2", [-0.84, 0.34, -0.66], "#e9d5ff"),
        ],
      },
    ],
  },
  "building-micro-house": {
    cameraPosition: [6.2, 4.6, 6.5],
    groups: [
      {
        groupId: "base",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, 0, 0],
        labelOffset: [0, 0.9, 0],
        parts: [
          piecePrimitive("house-floor-left", "piece_2x4", [-0.42, 0.18, 0], HOUSE_GRAY),
          piecePrimitive("house-floor-right", "piece_2x4", [0.42, 0.18, 0], HOUSE_GRAY),
          piecePrimitive("house-floor-front", "piece_1x4", [0.14, 0.43, 0.52], HOUSE_GRAY),
          piecePrimitive("house-floor-back", "piece_1x4", [-0.14, 0.43, -0.52], HOUSE_GRAY),
          piecePrimitive("door-step", "piece_1x2", [1.0, 0.14, 0], HOUSE_WHITE),
          piecePrimitive("porch-plate", "piece_1x2", [0.82, 0.28, 0], HOUSE_WHITE),
        ],
      },
      {
        groupId: "walls",
        assembledPosition: [0, 0.82, 0],
        explodedOffset: [0, 1.9, 0],
        labelOffset: [0, 1.15, 0],
        parts: [
          piecePrimitive("front-left-wall-low", "piece_2x2", [0.76, 0.18, 0.32], HOUSE_YELLOW),
          piecePrimitive("front-right-wall-low", "piece_2x2", [0.76, 0.18, -0.32], HOUSE_YELLOW),
          piecePrimitive("back-left-wall-low", "piece_2x2", [-0.76, 0.18, 0.32], HOUSE_YELLOW),
          piecePrimitive("back-right-wall-low", "piece_2x2", [-0.76, 0.18, -0.32], HOUSE_YELLOW),
          piecePrimitive("left-wall-low", "piece_2x3", [0, 0.18, 0.82], HOUSE_WHITE, [0, Math.PI / 2, 0]),
          piecePrimitive("right-wall-low", "piece_2x3", [0, 0.18, -0.82], HOUSE_WHITE, [0, Math.PI / 2, 0]),
          piecePrimitive("front-beam", "piece_1x4", [0.78, 0.55, 0], HOUSE_RED),
          piecePrimitive("back-beam", "piece_1x4", [-0.78, 0.55, 0], HOUSE_RED),
          piecePrimitive("left-window-sill", "piece_1x2", [0.02, 0.52, 0.82], HOUSE_WHITE),
          piecePrimitive("right-window-sill", "piece_1x2", [0.02, 0.52, -0.82], HOUSE_WHITE),
          piecePrimitive("door-top", "piece_1x2", [1.02, 0.54, 0], HOUSE_WHITE),
        ],
      },
      {
        groupId: "roof",
        assembledPosition: [0, 1.62, 0],
        explodedOffset: [0, 3.0, 0],
        labelOffset: [0, 0.95, 0],
        parts: [
          piecePrimitive("roof-left-front", "piece_2x4", [0.12, 0.14, 0.48], HOUSE_RED, [0.16, 0, 0]),
          piecePrimitive("roof-left-back", "piece_2x4", [-0.42, 0.14, 0.48], HOUSE_RED, [0.16, 0, 0]),
          piecePrimitive("roof-right-front", "piece_2x4", [0.12, 0.14, -0.48], HOUSE_RED, [-0.16, 0, 0]),
          piecePrimitive("roof-right-back", "piece_2x4", [-0.42, 0.14, -0.48], HOUSE_RED, [-0.16, 0, 0]),
          piecePrimitive("roof-ridge-front", "piece_1x4", [0.08, 0.46, 0], HOUSE_WHITE),
          piecePrimitive("roof-ridge-back", "piece_1x4", [-0.46, 0.46, 0], HOUSE_WHITE),
          piecePrimitive("chimney-base", "piece_1x2", [-0.32, 0.6, 0.24], HOUSE_GRAY),
          piecePrimitive("chimney-cap", "piece_1x1", [-0.28, 0.92, 0.24], HOUSE_WHITE),
        ],
      },
    ],
  },
  "fantasy-dragon": {
    cameraPosition: [7.1, 4.9, 7.1],
    groups: [
      {
        groupId: "body",
        assembledPosition: [0, 0.82, 0],
        explodedOffset: [0, 0, 0],
        labelOffset: [0, 1.1, 0],
        parts: [
          piecePrimitive("dragon-body-core-front", "piece_2x4", [0.34, 0.18, 0], DRAGON_PURPLE),
          piecePrimitive("dragon-body-core-back", "piece_2x4", [-0.46, 0.18, 0], DRAGON_PURPLE),
          piecePrimitive("dragon-body-top", "piece_2x3", [-0.04, 0.54, 0], DRAGON_GREEN),
          piecePrimitive("dragon-hip", "piece_2x2", [-1.02, 0.36, 0], DRAGON_PURPLE),
          piecePrimitive("dragon-neck", "piece_1x2", [1.06, 0.72, 0], DRAGON_GREEN),
          piecePrimitive("dragon-leg-front-left", "piece_1x2", [0.64, -0.06, 0.34], DRAGON_GREEN),
          piecePrimitive("dragon-leg-front-right", "piece_1x2", [0.64, -0.06, -0.34], DRAGON_GREEN),
          piecePrimitive("dragon-leg-back-left", "piece_1x2", [-0.72, -0.06, 0.34], DRAGON_GREEN),
          piecePrimitive("dragon-leg-back-right", "piece_1x2", [-0.72, -0.06, -0.34], DRAGON_GREEN),
          piecePrimitive("dragon-spine-1", "piece_1x1", [-0.52, 0.9, 0], DRAGON_PINK),
          piecePrimitive("dragon-spine-2", "piece_1x1", [0.16, 0.96, 0], DRAGON_PINK),
        ],
      },
      {
        groupId: "head-tail",
        assembledPosition: [0.08, 1.08, 0],
        explodedOffset: [2.2, 1.2, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("dragon-head-core", "piece_2x2", [0.86, 0.24, 0], DRAGON_PINK),
          piecePrimitive("dragon-snout", "slope_2x2", [1.34, 0.22, 0], DRAGON_PINK),
          piecePrimitive("dragon-jaw", "piece_1x2", [1.62, 0.08, 0], DRAGON_PINK),
          piecePrimitive("dragon-horn-left", "piece_1x1", [0.84, 0.6, 0.18], HOUSE_WHITE),
          piecePrimitive("dragon-horn-right", "piece_1x1", [0.84, 0.6, -0.18], HOUSE_WHITE),
          piecePrimitive("dragon-tail-base", "piece_1x4", [-1.08, 0.12, 0], DRAGON_PINK, [0, 0, -0.24]),
          piecePrimitive("dragon-tail-tip", "piece_1x4", [-1.72, 0.28, 0], DRAGON_PINK, [0, 0, -0.52]),
          piecePrimitive("dragon-tail-fin", "piece_1x2", [-2.1, 0.46, 0.12], DRAGON_GREEN, [0, 0, 0.6]),
        ],
      },
      {
        groupId: "wings",
        assembledPosition: [-0.1, 1.34, 0],
        explodedOffset: [0, 2.8, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("wing-left-root", "hinge_plate", [0.04, 0.12, 0.56], DRAGON_GREEN),
          piecePrimitive("wing-left-main", "piece_2x6", [0.06, 0.16, 1.28], DRAGON_GREEN, [0.1, 0, 0.24]),
          piecePrimitive("wing-left-tip", "piece_1x4", [0.48, 0.3, 2.0], DRAGON_GREEN, [0.16, 0, 0.42]),
          piecePrimitive("wing-left-mid", "piece_1x4", [-0.24, 0.22, 1.58], DRAGON_GREEN, [0.1, 0, 0.18]),
          piecePrimitive("wing-right-root", "hinge_plate", [0.04, 0.12, -0.56], DRAGON_GREEN),
          piecePrimitive("wing-right-main", "piece_2x6", [0.06, 0.16, -1.28], DRAGON_GREEN, [-0.1, 0, -0.24]),
          piecePrimitive("wing-right-tip", "piece_1x4", [0.48, 0.3, -2.0], DRAGON_GREEN, [-0.16, 0, -0.42]),
          piecePrimitive("wing-right-mid", "piece_1x4", [-0.24, 0.22, -1.58], DRAGON_GREEN, [-0.1, 0, -0.18]),
        ],
      },
    ],
  },
  "building-castle-tower": {
    cameraPosition: [7.2, 5.4, 7.2],
    groups: [
      {
        groupId: "foundation",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, 0, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("tower-foundation-front", "piece_2x4", [0.82, 0.18, 0], TOWER_STONE),
          piecePrimitive("tower-foundation-back", "piece_2x4", [-0.82, 0.18, 0], TOWER_STONE),
          piecePrimitive("tower-foundation-left", "piece_1x6", [0, 0.36, 0.92], TOWER_STONE),
          piecePrimitive("tower-foundation-right", "piece_1x6", [0, 0.36, -0.92], TOWER_STONE),
          piecePrimitive("tower-foundation-core-front", "piece_2x2", [0.26, 0.52, 0], TOWER_STONE),
          piecePrimitive("tower-foundation-core-back", "piece_2x2", [-0.26, 0.52, 0], TOWER_STONE),
        ],
      },
      {
        groupId: "tower-walls",
        assembledPosition: [0, 1.02, 0],
        explodedOffset: [0, 2.6, 0],
        labelOffset: [0, 1.35, 0],
        parts: [
          piecePrimitive("tower-wall-front-low", "piece_2x4", [0.86, 0.18, 0], TOWER_STONE),
          piecePrimitive("tower-wall-back-low", "piece_2x4", [-0.86, 0.18, 0], TOWER_STONE),
          piecePrimitive("tower-wall-left-low", "piece_2x3", [0, 0.18, 0.92], TOWER_STONE, [0, Math.PI / 2, 0]),
          piecePrimitive("tower-wall-right-low", "piece_2x3", [0, 0.18, -0.92], TOWER_STONE, [0, Math.PI / 2, 0]),
          piecePrimitive("tower-wall-front-mid", "piece_2x4", [0.86, 0.54, 0], TOWER_STONE),
          piecePrimitive("tower-wall-back-mid", "piece_2x4", [-0.86, 0.54, 0], TOWER_STONE),
          piecePrimitive("tower-wall-left-mid", "piece_2x3", [0, 0.54, 0.92], TOWER_STONE, [0, Math.PI / 2, 0]),
          piecePrimitive("tower-wall-right-mid", "piece_2x3", [0, 0.54, -0.92], TOWER_STONE, [0, Math.PI / 2, 0]),
          piecePrimitive("tower-wall-front-high", "piece_2x4", [0.86, 0.9, 0], TOWER_STONE),
          piecePrimitive("tower-wall-back-high", "piece_2x4", [-0.86, 0.9, 0], TOWER_STONE),
          piecePrimitive("tower-window-left", "piece_1x2", [0.02, 0.64, 0.92], TOWER_GOLD),
          piecePrimitive("tower-window-right", "piece_1x2", [0.02, 0.64, -0.92], TOWER_GOLD),
        ],
      },
      {
        groupId: "lookout-top",
        assembledPosition: [0, 2.28, 0],
        explodedOffset: [0, 4.1, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("tower-top-floor-front", "piece_1x6", [0.44, 0.12, 0], TOWER_GOLD),
          piecePrimitive("tower-top-floor-back", "piece_1x6", [-0.44, 0.12, 0], TOWER_GOLD),
          piecePrimitive("tower-top-floor-left", "piece_1x4", [0, 0.12, 0.72], TOWER_GOLD),
          piecePrimitive("tower-top-floor-right", "piece_1x4", [0, 0.12, -0.72], TOWER_GOLD),
          piecePrimitive("tower-battlement-front-left", "piece_1x2", [0.86, 0.4, 0.46], TOWER_STONE),
          piecePrimitive("tower-battlement-front-right", "piece_1x2", [0.86, 0.4, -0.46], TOWER_STONE),
          piecePrimitive("tower-battlement-back-left", "piece_1x2", [-0.86, 0.4, 0.46], TOWER_STONE),
          piecePrimitive("tower-battlement-back-right", "piece_1x2", [-0.86, 0.4, -0.46], TOWER_STONE),
          piecePrimitive("tower-flag-post", "piece_1x1", [0.18, 0.72, 0], TOWER_GOLD),
          piecePrimitive("tower-flag-cap", "piece_1x1", [0.18, 1.04, 0], HOUSE_RED),
        ],
      },
    ],
  },
  "vehicle-cargo-truck": {
    cameraPosition: [7.4, 4.8, 7.1],
    groups: [
      {
        groupId: "wheel-frame",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, -2.6, 0],
        labelOffset: [0, 1.1, 0],
        parts: [
          piecePrimitive("truck-frame-main", "blue_2x6_plate", [0, 0.07, 0], TRUCK_BLUE),
          piecePrimitive("truck-frame-front", "gray_1x2_brick", [0.7, 0.25, 0.24], CAR_GRAY),
          piecePrimitive("truck-frame-back", "gray_1x2_brick", [-0.7, 0.25, -0.24], CAR_GRAY),
          piecePrimitive("truck-axle-front", "black_1x2_plate", [0.9, 0.45, 0], CAR_BLACK),
          piecePrimitive("truck-axle-back", "black_1x2_plate", [-0.9, 0.45, 0], CAR_BLACK),
          wheelPrimitive("truck-wheel-front-left", [1.0, 0.18, 0.62]),
          wheelPrimitive("truck-wheel-front-right", [1.0, 0.18, -0.62]),
          wheelPrimitive("truck-wheel-back-left", [-1.0, 0.18, 0.62]),
          wheelPrimitive("truck-wheel-back-right", [-1.0, 0.18, -0.62]),
        ],
      },
      {
        groupId: "cab-shell",
        assembledPosition: [0.3, 0.92, 0],
        explodedOffset: [0, 2.6, 0],
        labelOffset: [0, 1.2, 0],
        parts: [
          piecePrimitive("truck-cab-base", "blue_2x4_brick", [0.22, 0.18, 0], TRUCK_ORANGE),
          piecePrimitive("truck-cab-top", "red_2x3_brick", [0.12, 0.54, 0], TRUCK_ORANGE),
          piecePrimitive("truck-cab-roof", "green_1x4_plate", [0.06, 0.82, 0], TRUCK_BLUE),
          piecePrimitive("truck-cab-window", "white_1x4_tile", [0.72, 0.46, 0], HOUSE_WHITE),
        ],
      },
      {
        groupId: "cargo-bed",
        assembledPosition: [-0.92, 0.82, 0],
        explodedOffset: [-2.0, 1.5, 0],
        labelOffset: [0, 1.1, 0],
        parts: [
          piecePrimitive("truck-bed-floor", "blue_2x4_brick", [0, 0.18, 0], TRUCK_BLUE),
          piecePrimitive("truck-bed-left", "gray_1x6_plate", [0, 0.42, 0.38], TRUCK_ORANGE),
          piecePrimitive("truck-bed-right", "gray_1x6_plate", [0, 0.42, -0.38], TRUCK_ORANGE),
          piecePrimitive("truck-bed-tail", "black_1x2_plate", [-0.74, 0.42, 0], CAR_BLACK),
        ],
      },
    ],
  },
  "object-storage-tray": {
    cameraPosition: [6.6, 4.7, 7.4],
    groups: [
      {
        groupId: "tray-floor",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, 0, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("tray-floor-front-left", "piece_2x4", [0.72, 0.18, 0.42], TRAY_GREEN),
          piecePrimitive("tray-floor-front-right", "piece_2x4", [0.72, 0.18, -0.42], TRAY_GREEN),
          piecePrimitive("tray-floor-back-left", "piece_2x4", [-0.72, 0.18, 0.42], TRAY_GREEN),
          piecePrimitive("tray-floor-back-right", "piece_2x4", [-0.72, 0.18, -0.42], TRAY_GREEN),
          piecePrimitive("tray-floor-middle-left", "piece_1x6", [0, 0.36, 0.76], "#16a34a"),
          piecePrimitive("tray-floor-middle-right", "piece_1x6", [0, 0.36, -0.76], "#16a34a"),
          piecePrimitive("tray-floor-lock", "piece_1x4", [0, 0.5, 0], "#15803d"),
        ],
      },
      {
        groupId: "side-walls",
        assembledPosition: [0, 0.74, 0],
        explodedOffset: [0, 2.2, 0],
        labelOffset: [0, 1.12, 0],
        parts: [
          piecePrimitive("tray-wall-front-left", "piece_2x4", [0.78, 0.18, 0.92], TRAY_GREEN),
          piecePrimitive("tray-wall-front-right", "piece_2x4", [0.78, 0.18, -0.92], TRAY_GREEN),
          piecePrimitive("tray-wall-back-left", "piece_2x4", [-0.78, 0.18, 0.92], TRAY_GREEN),
          piecePrimitive("tray-wall-back-right", "piece_2x4", [-0.78, 0.18, -0.92], TRAY_GREEN),
          piecePrimitive("tray-wall-left", "piece_1x6", [0, 0.18, 1.24], "#22c55e"),
          piecePrimitive("tray-wall-right", "piece_1x6", [0, 0.18, -1.24], "#22c55e"),
          piecePrimitive("tray-corner-left-front", "piece_1x2", [1.12, 0.5, 0.88], "#4ade80"),
          piecePrimitive("tray-corner-right-front", "piece_1x2", [1.12, 0.5, -0.88], "#4ade80"),
          piecePrimitive("tray-corner-left-back", "piece_1x2", [-1.12, 0.5, 0.88], "#4ade80"),
          piecePrimitive("tray-corner-right-back", "piece_1x2", [-1.12, 0.5, -0.88], "#4ade80"),
        ],
      },
      {
        groupId: "front-back-lip",
        assembledPosition: [0, 1.26, 0],
        explodedOffset: [0, 3.4, 0],
        labelOffset: [0, 0.92, 0],
        parts: [
          piecePrimitive("tray-lip-front", "piece_1x6", [0.82, 0.12, 0], "#86efac"),
          piecePrimitive("tray-lip-back", "piece_1x6", [-0.82, 0.12, 0], "#86efac"),
          piecePrimitive("tray-inner-front", "piece_1x4", [0.44, 0.32, 0], "#bbf7d0"),
          piecePrimitive("tray-inner-back", "piece_1x4", [-0.44, 0.32, 0], "#bbf7d0"),
          piecePrimitive("tray-lock-left", "piece_1x2", [0, 0.28, 0.62], "#14532d"),
          piecePrimitive("tray-lock-right", "piece_1x2", [0, 0.28, -0.62], "#14532d"),
        ],
      },
    ],
  },
  "fantasy-robot-pal": {
    cameraPosition: [6.8, 4.9, 7.0],
    groups: [
      {
        groupId: "legs",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, -2.2, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("robot-hip-bar", "piece_1x4", [0.02, 0.22, 0], ROBOT_GRAY),
          piecePrimitive("robot-leg-left-low", "piece_2x2", [0.42, 0.18, 0.24], ROBOT_GRAY),
          piecePrimitive("robot-leg-left-high", "piece_2x2", [0.42, 0.54, 0.24], ROBOT_GRAY),
          piecePrimitive("robot-leg-right-low", "piece_2x2", [0.42, 0.18, -0.24], ROBOT_GRAY),
          piecePrimitive("robot-leg-right-high", "piece_2x2", [0.42, 0.54, -0.24], ROBOT_GRAY),
          piecePrimitive("robot-knee-left", "piece_1x2", [0.78, 0.92, 0.24], ROBOT_CYAN),
          piecePrimitive("robot-knee-right", "piece_1x2", [0.78, 0.92, -0.24], ROBOT_CYAN),
          piecePrimitive("robot-foot-left", "piece_1x2", [1.02, 0.18, 0.24], ROBOT_CYAN),
          piecePrimitive("robot-foot-right", "piece_1x2", [1.02, 0.18, -0.24], ROBOT_CYAN),
        ],
      },
      {
        groupId: "torso",
        assembledPosition: [0, 1.18, 0],
        explodedOffset: [0, 0, 0],
        labelOffset: [0, 1.16, 0],
        parts: [
          piecePrimitive("robot-torso-low", "piece_2x4", [0, 0.18, 0], ROBOT_CYAN),
          piecePrimitive("robot-torso-mid", "piece_2x4", [0, 0.54, 0], ROBOT_CYAN),
          piecePrimitive("robot-torso-upper-left", "piece_1x2", [0.34, 0.9, 0.24], ROBOT_CYAN),
          piecePrimitive("robot-torso-upper-right", "piece_1x2", [0.34, 0.9, -0.24], ROBOT_CYAN),
          piecePrimitive("robot-shoulder-bar", "piece_2x6", [-0.08, 1.08, 0], ROBOT_GRAY),
          piecePrimitive("robot-core", "piece_1x2", [0.56, 0.56, 0], CAR_BLACK),
          piecePrimitive("robot-core-top", "piece_1x2", [0.56, 0.88, 0], HOUSE_WHITE),
        ],
      },
      {
        groupId: "head-arms",
        assembledPosition: [0.18, 2.06, 0],
        explodedOffset: [2.2, 1.7, 0],
        labelOffset: [0, 1.08, 0],
        parts: [
          piecePrimitive("robot-head-low", "piece_2x2", [0.26, 0.46, 0], ROBOT_GRAY),
          piecePrimitive("robot-head-high", "piece_2x2", [0.26, 0.82, 0], CAR_BLACK),
          piecePrimitive("robot-eye-left", "piece_1x1", [0.62, 0.92, 0.12], HOUSE_WHITE),
          piecePrimitive("robot-eye-right", "piece_1x1", [0.62, 0.92, -0.12], HOUSE_WHITE),
          piecePrimitive("robot-antenna", "piece_1x1", [0.02, 1.16, 0], ROBOT_CYAN),
          piecePrimitive("robot-arm-left-main", "piece_1x6", [-0.62, 0.18, 0.88], ROBOT_CYAN, [0, 0, 0.08]),
          piecePrimitive("robot-arm-left-forearm", "piece_1x4", [-1.1, -0.04, 1.08], ROBOT_CYAN, [0, 0, -0.28]),
          piecePrimitive("robot-arm-right-main", "piece_1x6", [-0.62, 0.18, -0.88], ROBOT_CYAN, [0, 0, -0.08]),
          piecePrimitive("robot-arm-right-forearm", "piece_1x4", [-1.1, -0.04, -1.08], ROBOT_CYAN, [0, 0, 0.28]),
          piecePrimitive("robot-hand-left", "piece_connector", [-1.48, -0.18, 1.2], CAR_BLACK, [0, 0, Math.PI / 2]),
          piecePrimitive("robot-hand-right", "piece_connector", [-1.48, -0.18, -1.2], CAR_BLACK, [0, 0, Math.PI / 2]),
        ],
      },
    ],
  },
  "fantasy-sky-serpent": {
    cameraPosition: [7.4, 5.0, 7.2],
    groups: [
      {
        groupId: "body-coil",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, 0, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("serpent-body-front", "piece_2x4", [0.92, 0.18, 0], SERPENT_GREEN),
          piecePrimitive("serpent-body-mid-right", "piece_2x4", [0.18, 0.18, -0.68], SERPENT_GREEN),
          piecePrimitive("serpent-body-back", "piece_2x4", [-0.78, 0.18, -0.24], SERPENT_GREEN),
          piecePrimitive("serpent-body-mid-left", "piece_2x4", [-0.08, 0.18, 0.74], SERPENT_GREEN),
          piecePrimitive("serpent-spine-front", "piece_1x4", [0.92, 0.56, 0], SERPENT_DARK),
          piecePrimitive("serpent-spine-right", "piece_1x4", [0.18, 0.56, -0.68], SERPENT_DARK, [0, 0, -0.26]),
          piecePrimitive("serpent-spine-back", "piece_1x4", [-0.78, 0.56, -0.24], SERPENT_DARK),
          piecePrimitive("serpent-spine-left", "piece_1x4", [-0.08, 0.56, 0.74], SERPENT_DARK, [0, 0, 0.26]),
        ],
      },
      {
        groupId: "head-neck",
        assembledPosition: [0.78, 0.88, 0.16],
        explodedOffset: [1.9, 1.8, 0.8],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("serpent-neck-low", "piece_1x4", [0, 0.14, 0], SERPENT_GREEN, [0, 0, 0.38]),
          piecePrimitive("serpent-neck-high", "piece_1x4", [0.34, 0.42, 0], SERPENT_GREEN, [0, 0, 0.18]),
          piecePrimitive("serpent-head-core", "piece_2x2", [0.72, 0.62, 0], SERPENT_GREEN),
          piecePrimitive("serpent-snout", "slope_2x2", [1.12, 0.58, 0], SERPENT_DARK),
          piecePrimitive("serpent-eye-left", "piece_1x1", [0.98, 0.94, 0.18], HOUSE_WHITE),
          piecePrimitive("serpent-eye-right", "piece_1x1", [0.98, 0.94, -0.18], HOUSE_WHITE),
          piecePrimitive("serpent-crest-left", "piece_1x2", [0.54, 1.08, 0.24], SERPENT_GOLD),
          piecePrimitive("serpent-crest-right", "piece_1x2", [0.54, 1.08, -0.24], SERPENT_GOLD),
        ],
      },
      {
        groupId: "fins",
        assembledPosition: [-0.2, 0.84, 0],
        explodedOffset: [-1.8, 2.4, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("serpent-fin-left-front", "piece_connector", [0.52, 0.12, 0.82], SERPENT_GOLD, [0, 0, 0.38]),
          piecePrimitive("serpent-fin-left-mid", "piece_1x4", [-0.24, 0.14, 1.12], SERPENT_GOLD, [0, 0, 0.26]),
          piecePrimitive("serpent-fin-left-back", "piece_1x4", [-1.0, 0.14, 0.58], SERPENT_GOLD, [0, 0, -0.28]),
          piecePrimitive("serpent-fin-right-front", "piece_connector", [0.52, 0.12, -0.82], SERPENT_GOLD, [0, 0, -0.38]),
          piecePrimitive("serpent-fin-right-mid", "piece_1x4", [-0.24, 0.14, -1.12], SERPENT_GOLD, [0, 0, -0.26]),
          piecePrimitive("serpent-fin-right-back", "piece_1x4", [-1.0, 0.14, -0.58], SERPENT_GOLD, [0, 0, 0.28]),
          piecePrimitive("serpent-tail-top", "piece_1x4", [-1.52, 0.36, 0], SERPENT_DARK, [0, 0, -0.52]),
          piecePrimitive("serpent-tail-tip", "piece_1x2", [-1.98, 0.48, 0], SERPENT_GOLD),
        ],
      },
    ],
  },
  "vehicle-rocket-rover": {
    cameraPosition: [7.5, 4.9, 7.0],
    groups: [
      {
        groupId: "wheel-chassis",
        assembledPosition: [0, 0, 0],
        explodedOffset: [0, -2.8, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("rover-base-left", "piece_2x6", [0, 0.14, 0.38], ROVER_SILVER),
          piecePrimitive("rover-base-right", "piece_2x6", [0, 0.14, -0.38], ROVER_SILVER),
          piecePrimitive("rover-cross-front", "piece_1x4", [0.92, 0.36, 0], ROVER_DARK),
          piecePrimitive("rover-cross-back", "piece_1x4", [-0.92, 0.36, 0], ROVER_DARK),
          wheelPrimitive("rover-wheel-front-left", [1.16, 0.18, 0.86]),
          wheelPrimitive("rover-wheel-front-right", [1.16, 0.18, -0.86]),
          wheelPrimitive("rover-wheel-back-left", [-1.16, 0.18, 0.86]),
          wheelPrimitive("rover-wheel-back-right", [-1.16, 0.18, -0.86]),
        ],
      },
      {
        groupId: "cockpit-shell",
        assembledPosition: [0.2, 0.88, 0],
        explodedOffset: [0, 2.4, 0],
        labelOffset: [0, 1.1, 0],
        parts: [
          piecePrimitive("rover-body-low-left", "piece_2x4", [0.22, 0.18, 0.34], ROVER_BLUE),
          piecePrimitive("rover-body-low-right", "piece_2x4", [0.22, 0.18, -0.34], ROVER_BLUE),
          piecePrimitive("rover-body-mid", "piece_2x3", [-0.34, 0.54, 0], ROVER_BLUE),
          piecePrimitive("rover-cockpit", "piece_2x2", [0.64, 0.78, 0], HOUSE_WHITE),
          piecePrimitive("rover-canopy", "piece_1x2", [0.94, 1.04, 0], HOUSE_WHITE),
          piecePrimitive("rover-nose", "slope_2x2", [1.02, 0.36, 0], ROVER_RED),
          piecePrimitive("rover-side-left", "piece_1x4", [-0.12, 0.52, 0.78], ROVER_RED),
          piecePrimitive("rover-side-right", "piece_1x4", [-0.12, 0.52, -0.78], ROVER_RED),
        ],
      },
      {
        groupId: "booster-pack",
        assembledPosition: [-1.02, 0.92, 0],
        explodedOffset: [-2.0, 1.9, 0],
        labelOffset: [0, 1.0, 0],
        parts: [
          piecePrimitive("rover-engine-core", "piece_2x4", [0, 0.18, 0], ROVER_DARK),
          piecePrimitive("rover-engine-top", "piece_1x4", [0.08, 0.56, 0], ROVER_RED),
          piecePrimitive("rover-fin-left", "piece_1x4", [-0.1, 0.28, 0.72], ROVER_RED, [0, 0, 0.32]),
          piecePrimitive("rover-fin-right", "piece_1x4", [-0.1, 0.28, -0.72], ROVER_RED, [0, 0, -0.32]),
          piecePrimitive("rover-thruster-left", "piece_round", [-0.58, 0.12, 0.24], ROVER_SILVER),
          piecePrimitive("rover-thruster-right", "piece_round", [-0.58, 0.12, -0.24], ROVER_SILVER),
          piecePrimitive("rover-flame-left", "piece_1x1", [-0.9, 0.12, 0.24], TOWER_GOLD),
          piecePrimitive("rover-flame-right", "piece_1x1", [-0.9, 0.12, -0.24], TOWER_GOLD),
        ],
      },
    ],
  },
};

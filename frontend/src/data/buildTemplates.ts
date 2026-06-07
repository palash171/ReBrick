import { Category } from "../types";

export interface BuildTemplate {
  buildId: string;
  name: string;
  category: Category;
  description: string;
  requiredFamilies: Record<string, number>;
  tags: string[];
}

export const buildTemplates: BuildTemplate[] = [
  {
    buildId: "animal-bear",
    name: "Mini Bear",
    category: "animals",
    description: "A simple bear with a chunky body and four small legs.",
    requiredFamilies: {
      support_brick: 10,
      detail_plate: 4,
      small_brick: 2,
    },
    tags: ["animal", "cute", "display"],
  },
  {
    buildId: "vehicle-race-car",
    name: "Desk Race Car",
    category: "vehicles",
    description: "A tiny car using a low body and wheel pieces.",
    requiredFamilies: {
      support_brick: 6,
      detail_plate: 2,
      wheel_component: 4,
      long_plate: 2,
    },
    tags: ["vehicle", "car", "simple"],
  },
  {
    buildId: "object-phone-stand",
    name: "Phone Stand",
    category: "objects",
    description: "A functional angled stand for a phone or small device.",
    requiredFamilies: {
      support_brick: 10,
      long_plate: 4,
      connector_plate: 2,
    },
    tags: ["desk", "functional", "stand"],
  },
  {
    buildId: "object-pencil-holder",
    name: "Pencil Holder",
    category: "objects",
    description: "A square desk organizer with a hollow center.",
    requiredFamilies: {
      support_brick: 26,
      connector_plate: 8,
      long_plate: 10,
      detail_plate: 6,
    },
    tags: ["desk", "storage", "functional"],
  },
  {
    buildId: "building-micro-house",
    name: "Micro House",
    category: "buildings",
    description: "A tiny house with a roof line and front detail.",
    requiredFamilies: {
      support_brick: 12,
      detail_plate: 6,
      long_plate: 2,
    },
    tags: ["house", "display", "building"],
  },
  {
    buildId: "fantasy-dragon",
    name: "Tiny Dragon",
    category: "fantasy",
    description: "A simple fantasy creature with a small tail and wings.",
    requiredFamilies: {
      support_brick: 8,
      detail_plate: 6,
      long_plate: 2,
      connector_plate: 2,
    },
    tags: ["fantasy", "creature", "display"],
  },
  {
    buildId: "building-castle-tower",
    name: "Castle Tower",
    category: "buildings",
    description: "A taller display build with a layered base, tower walls, and a lookout top.",
    requiredFamilies: {
      support_brick: 24,
      detail_plate: 8,
      long_plate: 12,
      connector_plate: 8,
      small_brick: 2,
    },
    tags: ["castle", "tower", "display", "larger"],
  },
  {
    buildId: "vehicle-cargo-truck",
    name: "Cargo Truck",
    category: "vehicles",
    description: "A bigger vehicle with a front cab, wheel base, and rear cargo bed.",
    requiredFamilies: {
      support_brick: 16,
      detail_plate: 6,
      long_plate: 4,
      wheel_component: 4,
      connector_plate: 4,
    },
    tags: ["vehicle", "truck", "larger", "play"],
  },
  {
    buildId: "object-storage-tray",
    name: "Storage Tray",
    category: "objects",
    description: "A shallow desk tray that uses a wider footprint and low surrounding walls.",
    requiredFamilies: {
      support_brick: 20,
      detail_plate: 6,
      long_plate: 16,
      connector_plate: 10,
    },
    tags: ["desk", "tray", "storage", "larger"],
  },
  {
    buildId: "fantasy-robot-pal",
    name: "Robot Pal",
    category: "fantasy",
    description: "A blocky robot with a chest core, arm bars, and a larger head unit.",
    requiredFamilies: {
      support_brick: 18,
      detail_plate: 8,
      long_plate: 8,
      connector_plate: 4,
      small_brick: 4,
    },
    tags: ["robot", "character", "display", "larger"],
  },
  {
    buildId: "fantasy-sky-serpent",
    name: "Sky Serpent",
    category: "fantasy",
    description: "A longer fantasy creature with a coiled body, fins, and a raised head.",
    requiredFamilies: {
      support_brick: 18,
      detail_plate: 10,
      long_plate: 12,
      connector_plate: 8,
      small_brick: 4,
    },
    tags: ["fantasy", "serpent", "display", "larger"],
  },
  {
    buildId: "vehicle-rocket-rover",
    name: "Rocket Rover",
    category: "vehicles",
    description: "A chunky sci-fi rover with a long chassis, upright cockpit, and rear engine fins.",
    requiredFamilies: {
      support_brick: 20,
      detail_plate: 8,
      long_plate: 12,
      connector_plate: 6,
      wheel_component: 4,
      small_brick: 4,
    },
    tags: ["vehicle", "rover", "space", "larger"],
  },
];

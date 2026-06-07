from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class BuildTemplate:
    build_id: str
    name: str
    category: str
    description: str
    required_families: Dict[str, int]
    tags: List[str]


BUILD_CATALOG: List[BuildTemplate] = [
    BuildTemplate(
        build_id="animal-bear",
        name="Mini Bear",
        category="animals",
        description="A simple bear with a chunky body and four small legs.",
        required_families={
            "support_brick": 10,
            "detail_plate": 4,
            "small_brick": 2,
        },
        tags=["animal", "cute", "display"],
    ),
    BuildTemplate(
        build_id="vehicle-race-car",
        name="Desk Race Car",
        category="vehicles",
        description="A tiny car using a low body and wheel pieces.",
        required_families={
            "support_brick": 6,
            "detail_plate": 2,
            "wheel_component": 4,
            "long_plate": 2,
        },
        tags=["vehicle", "car", "simple"],
    ),
    BuildTemplate(
        build_id="object-phone-stand",
        name="Phone Stand",
        category="objects",
        description="A functional angled stand for a phone or small device.",
        required_families={
            "support_brick": 10,
            "long_plate": 4,
            "connector_plate": 2,
        },
        tags=["desk", "functional", "stand"],
    ),
    BuildTemplate(
        build_id="object-pencil-holder",
        name="Pencil Holder",
        category="objects",
        description="A square desk organizer with a hollow center.",
        required_families={
            "support_brick": 26,
            "connector_plate": 8,
            "long_plate": 10,
            "detail_plate": 6,
        },
        tags=["desk", "storage", "functional"],
    ),
    BuildTemplate(
        build_id="building-micro-house",
        name="Micro House",
        category="buildings",
        description="A tiny house with a roof line and front detail.",
        required_families={
            "support_brick": 18,
            "detail_plate": 8,
            "long_plate": 8,
            "connector_plate": 4,
        },
        tags=["house", "display", "building"],
    ),
    BuildTemplate(
        build_id="fantasy-dragon",
        name="Tiny Dragon",
        category="fantasy",
        description="A simple fantasy creature with a small tail and wings.",
        required_families={
            "support_brick": 14,
            "detail_plate": 10,
            "long_plate": 8,
            "connector_plate": 4,
            "small_brick": 2,
        },
        tags=["fantasy", "creature", "display"],
    ),
    BuildTemplate(
        build_id="building-castle-tower",
        name="Castle Tower",
        category="buildings",
        description="A taller display build with a layered base, tower walls, and a lookout top.",
        required_families={
            "support_brick": 24,
            "detail_plate": 8,
            "long_plate": 12,
            "connector_plate": 8,
            "small_brick": 2,
        },
        tags=["castle", "tower", "display", "larger"],
    ),
    BuildTemplate(
        build_id="vehicle-cargo-truck",
        name="Cargo Truck",
        category="vehicles",
        description="A bigger vehicle with a front cab, wheel base, and rear cargo bed.",
        required_families={
            "support_brick": 16,
            "detail_plate": 6,
            "long_plate": 4,
            "wheel_component": 4,
            "connector_plate": 4,
        },
        tags=["vehicle", "truck", "larger", "play"],
    ),
    BuildTemplate(
        build_id="object-storage-tray",
        name="Storage Tray",
        category="objects",
        description="A shallow desk tray that uses a wider footprint and low surrounding walls.",
        required_families={
            "support_brick": 20,
            "detail_plate": 6,
            "long_plate": 16,
            "connector_plate": 10,
        },
        tags=["desk", "tray", "storage", "larger"],
    ),
    BuildTemplate(
        build_id="fantasy-robot-pal",
        name="Robot Pal",
        category="fantasy",
        description="A blocky robot with a chest core, arm bars, and a larger head unit.",
        required_families={
            "support_brick": 18,
            "detail_plate": 8,
            "long_plate": 8,
            "connector_plate": 4,
            "small_brick": 4,
        },
        tags=["robot", "character", "display", "larger"],
    ),
    BuildTemplate(
        build_id="fantasy-sky-serpent",
        name="Sky Serpent",
        category="fantasy",
        description="A longer fantasy creature with a coiled body, fins, and a raised head.",
        required_families={
            "support_brick": 18,
            "detail_plate": 10,
            "long_plate": 12,
            "connector_plate": 8,
            "small_brick": 4,
        },
        tags=["fantasy", "serpent", "display", "larger"],
    ),
    BuildTemplate(
        build_id="vehicle-rocket-rover",
        name="Rocket Rover",
        category="vehicles",
        description="A chunky sci-fi rover with a long chassis, upright cockpit, and rear engine fins.",
        required_families={
            "support_brick": 20,
            "detail_plate": 8,
            "long_plate": 12,
            "connector_plate": 6,
            "wheel_component": 4,
            "small_brick": 4,
        },
        tags=["vehicle", "rover", "space", "larger"],
    ),
]


@dataclass(frozen=True)
class AssemblyGroup:
    group_id: str
    name: str
    summary: str
    required_families: Dict[str, int]
    connect_to: str | None
    direction: str | None


@dataclass(frozen=True)
class BuildBlueprint:
    build_id: str
    viewer_story: str
    assembly_groups: List[AssemblyGroup]


BUILD_BLUEPRINTS: Dict[str, BuildBlueprint] = {
    "animal-bear": BuildBlueprint(
        build_id="animal-bear",
        viewer_story="Exploded view separates the legs, body, and head so the user can see the main support groups first.",
        assembly_groups=[
            AssemblyGroup(
                group_id="legs",
                name="Legs",
                summary="Four small support points for the base of the bear.",
                required_families={"support_brick": 4},
                connect_to="body",
                direction="up",
            ),
            AssemblyGroup(
                group_id="body",
                name="Body",
                summary="The main structural block for the torso.",
                required_families={"support_brick": 4, "detail_plate": 2},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="head",
                name="Head",
                summary="A small front-facing detail group for the bear face.",
                required_families={"detail_plate": 2, "small_brick": 2},
                connect_to="body",
                direction="down",
            ),
        ],
    ),
    "vehicle-race-car": BuildBlueprint(
        build_id="vehicle-race-car",
        viewer_story="Exploded view separates the wheel system from the low-profile body so the user understands the moving and structural parts.",
        assembly_groups=[
            AssemblyGroup(
                group_id="wheel-base",
                name="Wheel Base",
                summary="Four wheel elements attached to the lower support frame.",
                required_families={"wheel_component": 4, "support_brick": 2},
                connect_to="body-shell",
                direction="up",
            ),
            AssemblyGroup(
                group_id="body-shell",
                name="Body Shell",
                summary="Low-profile plates and bricks that shape the car body.",
                required_families={"support_brick": 4, "detail_plate": 2, "long_plate": 2},
                connect_to=None,
                direction=None,
            ),
        ],
    ),
    "object-phone-stand": BuildBlueprint(
        build_id="object-phone-stand",
        viewer_story="Exploded view separates the base, angled support, and front stop to show how the stand carries load.",
        assembly_groups=[
            AssemblyGroup(
                group_id="base",
                name="Base",
                summary="The lower rectangle that keeps the stand stable on a desk.",
                required_families={"support_brick": 4, "long_plate": 2},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="angled-back",
                name="Angled Back",
                summary="Rear support wall that leans the phone backward.",
                required_families={"support_brick": 4, "long_plate": 2},
                connect_to="base",
                direction="down",
            ),
            AssemblyGroup(
                group_id="front-stop",
                name="Front Stop",
                summary="Small front lip that stops the phone from sliding.",
                required_families={"connector_plate": 2, "support_brick": 2},
                connect_to="base",
                direction="up",
            ),
        ],
    ),
    "object-pencil-holder": BuildBlueprint(
        build_id="object-pencil-holder",
        viewer_story="Exploded view separates the base, wall shell, and top rim so the user can read the hollow center and the stronger outer frame.",
        assembly_groups=[
            AssemblyGroup(
                group_id="base",
                name="Base",
                summary="Flat structural footprint for the desk organizer.",
                required_families={"support_brick": 4, "connector_plate": 4, "long_plate": 4},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="wall-ring",
                name="Wall Ring",
                summary="Surrounding brick wall that creates the storage cavity.",
                required_families={"support_brick": 18, "connector_plate": 2, "long_plate": 4},
                connect_to="base",
                direction="down",
            ),
            AssemblyGroup(
                group_id="top-rim",
                name="Top Rim",
                summary="Upper locking layer that makes the holder feel finished and rigid.",
                required_families={"support_brick": 4, "detail_plate": 6, "long_plate": 2, "connector_plate": 2},
                connect_to="base",
                direction="down",
            ),
        ],
    ),
    "building-micro-house": BuildBlueprint(
        build_id="building-micro-house",
        viewer_story="Exploded view separates the base, wall body, and roof profile so the user can understand the stacked structure.",
        assembly_groups=[
            AssemblyGroup(
                group_id="base",
                name="Base",
                summary="Lower footprint used to anchor the house.",
                required_families={"support_brick": 6, "long_plate": 4},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="walls",
                name="Walls",
                summary="Mid-structure that forms the house volume.",
                required_families={"support_brick": 8, "detail_plate": 4, "connector_plate": 2},
                connect_to="base",
                direction="down",
            ),
            AssemblyGroup(
                group_id="roof",
                name="Roof",
                summary="Top support layer that closes the house silhouette.",
                required_families={"support_brick": 4, "detail_plate": 4, "long_plate": 4, "connector_plate": 2},
                connect_to="walls",
                direction="down",
            ),
        ],
    ),
    "fantasy-dragon": BuildBlueprint(
        build_id="fantasy-dragon",
        viewer_story="Exploded view separates the main body, head, and wing assembly so the creature silhouette feels intentional.",
        assembly_groups=[
            AssemblyGroup(
                group_id="body",
                name="Body",
                summary="Main structural core of the creature.",
                required_families={"support_brick": 10, "detail_plate": 2, "small_brick": 2},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="head-tail",
                name="Head and Tail",
                summary="Front and rear detail accents for the creature profile.",
                required_families={"support_brick": 4, "long_plate": 4, "detail_plate": 2},
                connect_to="body",
                direction="forward",
            ),
            AssemblyGroup(
                group_id="wings",
                name="Wings",
                summary="Side detail groups that widen the creature silhouette.",
                required_families={"detail_plate": 6, "long_plate": 4, "connector_plate": 4},
                connect_to="body",
                direction="inward",
            ),
        ],
    ),
    "building-castle-tower": BuildBlueprint(
        build_id="building-castle-tower",
        viewer_story="Exploded view separates the footprint, tower walls, and lookout top so the user can understand the taller stacked structure.",
        assembly_groups=[
            AssemblyGroup(
                group_id="foundation",
                name="Foundation",
                summary="Wider lower footprint that stabilizes the tower.",
                required_families={"support_brick": 8, "long_plate": 6, "connector_plate": 2},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="tower-walls",
                name="Tower Walls",
                summary="Main middle shell that builds the height of the tower.",
                required_families={"support_brick": 12, "connector_plate": 4, "detail_plate": 4, "long_plate": 2},
                connect_to="foundation",
                direction="down",
            ),
            AssemblyGroup(
                group_id="lookout-top",
                name="Lookout Top",
                summary="Top rim and cap pieces that finish the tower silhouette.",
                required_families={"support_brick": 4, "detail_plate": 4, "long_plate": 4, "connector_plate": 2, "small_brick": 2},
                connect_to="tower-walls",
                direction="down",
            ),
        ],
    ),
    "vehicle-cargo-truck": BuildBlueprint(
        build_id="vehicle-cargo-truck",
        viewer_story="Exploded view separates the wheel frame, cab shell, and cargo bed so the larger vehicle reads clearly.",
        assembly_groups=[
            AssemblyGroup(
                group_id="wheel-frame",
                name="Wheel Frame",
                summary="Lower frame with the rolling support pieces.",
                required_families={"wheel_component": 4, "support_brick": 4, "connector_plate": 2},
                connect_to="cab-shell",
                direction="up",
            ),
            AssemblyGroup(
                group_id="cab-shell",
                name="Cab Shell",
                summary="Front driving section and upper body support.",
                required_families={"support_brick": 8, "detail_plate": 4, "long_plate": 2},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="cargo-bed",
                name="Cargo Bed",
                summary="Rear carrying section that completes the truck body.",
                required_families={"support_brick": 4, "detail_plate": 2, "long_plate": 2, "connector_plate": 2},
                connect_to="cab-shell",
                direction="forward",
            ),
        ],
    ),
    "object-storage-tray": BuildBlueprint(
        build_id="object-storage-tray",
        viewer_story="Exploded view separates the floor, side walls, and front lip so the tray feels buildable instead of decorative only.",
        assembly_groups=[
            AssemblyGroup(
                group_id="tray-floor",
                name="Tray Floor",
                summary="Flat base that defines the overall desk footprint.",
                required_families={"support_brick": 8, "long_plate": 8, "connector_plate": 2},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="side-walls",
                name="Side Walls",
                summary="Low outer walls that keep small items inside the tray.",
                required_families={"support_brick": 8, "connector_plate": 4, "detail_plate": 4, "long_plate": 2},
                connect_to="tray-floor",
                direction="down",
            ),
            AssemblyGroup(
                group_id="front-back-lip",
                name="Front and Back Lip",
                summary="Long edge pieces that lock the tray shape together.",
                required_families={"support_brick": 4, "long_plate": 6, "connector_plate": 4, "detail_plate": 2},
                connect_to="side-walls",
                direction="inward",
            ),
        ],
    ),
    "fantasy-robot-pal": BuildBlueprint(
        build_id="fantasy-robot-pal",
        viewer_story="Exploded view separates the legs, torso, and head-arms assembly so the robot reads like a proper character build.",
        assembly_groups=[
            AssemblyGroup(
                group_id="legs",
                name="Legs",
                summary="Lower support blocks that hold the robot upright.",
                required_families={"support_brick": 8, "detail_plate": 2},
                connect_to="torso",
                direction="up",
            ),
            AssemblyGroup(
                group_id="torso",
                name="Torso",
                summary="Main chest and back core for the robot body.",
                required_families={"support_brick": 6, "long_plate": 4, "connector_plate": 2},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="head-arms",
                name="Head and Arms",
                summary="Top character details including the head block and both arm bars.",
                required_families={"support_brick": 4, "detail_plate": 6, "long_plate": 4, "connector_plate": 2, "small_brick": 4},
                connect_to="torso",
                direction="down",
            ),
        ],
    ),
    "fantasy-sky-serpent": BuildBlueprint(
        build_id="fantasy-sky-serpent",
        viewer_story="Exploded view separates the body coil, raised head, and side fins so the longer creature silhouette still feels readable.",
        assembly_groups=[
            AssemblyGroup(
                group_id="body-coil",
                name="Body Coil",
                summary="Long lower body that gives the serpent its winding footprint.",
                required_families={"support_brick": 10, "long_plate": 6, "detail_plate": 2},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="head-neck",
                name="Head and Neck",
                summary="Raised front section that gives the creature a clear face and leading pose.",
                required_families={"support_brick": 4, "long_plate": 2, "small_brick": 4, "detail_plate": 2},
                connect_to="body-coil",
                direction="up",
            ),
            AssemblyGroup(
                group_id="fins",
                name="Fins",
                summary="Wide side fins and tail details that finish the fantasy silhouette.",
                required_families={"detail_plate": 6, "long_plate": 4, "connector_plate": 8, "support_brick": 4},
                connect_to="body-coil",
                direction="inward",
            ),
        ],
    ),
    "vehicle-rocket-rover": BuildBlueprint(
        build_id="vehicle-rocket-rover",
        viewer_story="Exploded view separates the wheel chassis, cockpit shell, and rear booster pack so the sci-fi shape stays easy to follow.",
        assembly_groups=[
            AssemblyGroup(
                group_id="wheel-chassis",
                name="Wheel Chassis",
                summary="Rolling lower frame with the long support rails and four wheels.",
                required_families={"wheel_component": 4, "support_brick": 6, "long_plate": 4, "connector_plate": 2},
                connect_to="cockpit-shell",
                direction="up",
            ),
            AssemblyGroup(
                group_id="cockpit-shell",
                name="Cockpit Shell",
                summary="Main body section with the driver pod and front profile.",
                required_families={"support_brick": 10, "detail_plate": 4, "long_plate": 4, "small_brick": 2},
                connect_to=None,
                direction=None,
            ),
            AssemblyGroup(
                group_id="booster-pack",
                name="Booster Pack",
                summary="Rear engine block and side fins that make the rover look space-ready.",
                required_families={"support_brick": 4, "detail_plate": 4, "long_plate": 4, "connector_plate": 4, "small_brick": 2},
                connect_to="cockpit-shell",
                direction="forward",
            ),
        ],
    ),
}

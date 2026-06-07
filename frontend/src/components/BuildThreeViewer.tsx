import { useEffect, useMemo, useRef } from "react";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

import { getPieceDefinition } from "../data/pieceCatalog";
import {
  Vector3Tuple,
  ViewerBuildPreset,
  ViewerGroupPreset,
  ViewerPrimitive,
  viewerPresetsByBuildId,
} from "../data/viewerPresets";
import { BuildDetail } from "../types";

interface BuildThreeViewerProps {
  buildDetail: BuildDetail;
  explodedView: boolean;
  activeStageIndex?: number;
}

interface GroupLayout {
  groupId: string;
  label: string;
  assembledPosition: Vector3Tuple;
  explodedPosition: Vector3Tuple;
  labelOffset: Vector3Tuple;
  primitives: ViewerPrimitive[];
}

const GROUP_COLORS = ["#22d3ee", "#818cf8", "#f472b6", "#34d399", "#fbbf24", "#fb7185"];
const STUD_RADIUS = 0.055;
const STUD_HEIGHT = 0.035;

function directionVector(direction: string | null, index: number): Vector3Tuple {
  switch (direction) {
    case "up":
      return [0, 1, 0];
    case "down":
      return [0, -1, 0];
    case "forward":
      return [0, 0, -1];
    case "inward":
      return index % 2 === 0 ? [-1, 0, 0] : [1, 0, 0];
    default:
      return [0, 0, 0];
  }
}

function buildGroupLayouts(buildDetail: BuildDetail): GroupLayout[] {
  const viewerPreset: ViewerBuildPreset | undefined = viewerPresetsByBuildId[buildDetail.buildId];

  return buildDetail.assemblyGroups.map((group, index) => {
    const groupPreset: ViewerGroupPreset | undefined = viewerPreset?.groups.find(
      (presetGroup) => presetGroup.groupId === group.groupId,
    );
    const totalPieces = Object.values(group.requiredFamilies).reduce(
      (runningTotal, quantity) => runningTotal + quantity,
      0,
    );
    const assembledPosition: Vector3Tuple =
      groupPreset?.assembledPosition ?? [(index % 2) * 0.4 - 0.2, index * 1.15 - 1, 0];
    const explodedPosition: Vector3Tuple = groupPreset
      ? [
          assembledPosition[0] + groupPreset.explodedOffset[0],
          assembledPosition[1] + groupPreset.explodedOffset[1],
          assembledPosition[2] + groupPreset.explodedOffset[2],
        ]
      : (() => {
          const direction = directionVector(group.direction, index);
          return [
            assembledPosition[0] - direction[0] * 2.8,
            assembledPosition[1] - direction[1] * 2.8,
            assembledPosition[2] - direction[2] * 2.8,
          ];
        })();

    return {
      groupId: group.groupId,
      label: group.name,
      assembledPosition,
      explodedPosition,
      labelOffset: groupPreset?.labelOffset ?? [0, 0.9, 0],
      primitives:
        groupPreset?.parts ?? [
          {
            primitiveId: `${group.groupId}-fallback`,
            shape: "box",
            position: [0, 0, 0],
            size: [
              1 + Math.min(totalPieces * 0.05, 1.2),
              0.45 + Math.min(totalPieces * 0.03, 0.8),
              0.8 + Math.min(totalPieces * 0.04, 1.1),
            ],
            color: GROUP_COLORS[index % GROUP_COLORS.length],
          },
        ],
    };
  });
}

function lerpTuple(from: Vector3Tuple, to: Vector3Tuple, amount: number): Vector3Tuple {
  return [
    THREE.MathUtils.lerp(from[0], to[0], amount),
    THREE.MathUtils.lerp(from[1], to[1], amount),
    THREE.MathUtils.lerp(from[2], to[2], amount),
  ];
}

function buildStudPositions(primitive: ViewerPrimitive): Vector3Tuple[] {
  const pieceDefinition = primitive.pieceId ? getPieceDefinition(primitive.pieceId) : undefined;

  if (
    primitive.shape !== "box" ||
    primitive.studless ||
    !pieceDefinition ||
    pieceDefinition.shape === "tile" ||
    pieceDefinition.shape === "technic" ||
    pieceDefinition.shape === "unknown"
  ) {
    return [];
  }

  const stepX = primitive.size[0] / pieceDefinition.studsX;
  const stepZ = primitive.size[2] / pieceDefinition.studsY;
  const startX = -primitive.size[0] / 2 + stepX / 2;
  const startZ = -primitive.size[2] / 2 + stepZ / 2;
  const studTop = primitive.size[1] / 2 + STUD_HEIGHT / 2;
  const studPositions: Vector3Tuple[] = [];

  for (let studX = 0; studX < pieceDefinition.studsX; studX += 1) {
    for (let studY = 0; studY < pieceDefinition.studsY; studY += 1) {
      studPositions.push([
        startX + studX * stepX,
        studTop,
        startZ + studY * stepZ,
      ]);
    }
  }

  return studPositions;
}

interface PrimitiveMeshProps {
  primitive: ViewerPrimitive;
  opacity: number;
}

function PrimitiveMesh({ primitive, opacity }: PrimitiveMeshProps) {
  const studPositions = useMemo(() => buildStudPositions(primitive), [primitive]);
  const pieceDefinition = primitive.pieceId ? getPieceDefinition(primitive.pieceId) : undefined;
  const isWheel = pieceDefinition?.shape === "wheel";

  return (
    <group position={primitive.position} rotation={primitive.rotation ?? [0, 0, 0]}>
      {primitive.shape === "cylinder" ? (
        <>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[primitive.size[0], primitive.size[1], primitive.size[2], 28]} />
            <meshStandardMaterial
              color={primitive.color}
              metalness={0.22}
              roughness={0.48}
              transparent
              opacity={opacity}
            />
          </mesh>
          {isWheel ? (
            <mesh castShadow receiveShadow>
              <cylinderGeometry
                args={[primitive.size[0] * 0.42, primitive.size[1] * 0.42, primitive.size[2] * 1.02, 24]}
              />
              <meshStandardMaterial
                color="#374151"
                metalness={0.24}
                roughness={0.38}
                transparent
                opacity={opacity}
              />
            </mesh>
          ) : null}
        </>
      ) : (
        <>
          <mesh castShadow receiveShadow>
            <boxGeometry args={primitive.size} />
            <meshStandardMaterial
              color={primitive.color}
              metalness={0.12}
              roughness={0.5}
              transparent
              opacity={opacity}
            />
          </mesh>
          {studPositions.map((studPosition, studIndex) => (
            <mesh key={`${primitive.primitiveId}-stud-${studIndex}`} castShadow receiveShadow position={studPosition}>
              <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 18]} />
              <meshStandardMaterial
                color={new THREE.Color(primitive.color).offsetHSL(0, 0, 0.08)}
                metalness={0.08}
                roughness={0.42}
                transparent
                opacity={opacity}
              />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

interface AssemblyGroupMeshProps {
  layout: GroupLayout;
  explodedView: boolean;
  emphasized?: boolean;
  faint?: boolean;
  showGuideLine?: boolean;
}

function AssemblyGroupMesh({
  layout,
  explodedView,
  emphasized = false,
  faint = false,
  showGuideLine = true,
}: AssemblyGroupMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const currentPositionRef = useRef<Vector3Tuple>(
    explodedView ? layout.explodedPosition : layout.assembledPosition,
  );
  const previousGroupIdRef = useRef(layout.groupId);

  useEffect(() => {
    if (previousGroupIdRef.current !== layout.groupId) {
      currentPositionRef.current = explodedView ? layout.explodedPosition : layout.assembledPosition;
      previousGroupIdRef.current = layout.groupId;
    }
  }, [explodedView, layout.assembledPosition, layout.explodedPosition, layout.groupId]);

  useFrame(() => {
    const targetPosition = explodedView ? layout.explodedPosition : layout.assembledPosition;
    const nextPosition = lerpTuple(currentPositionRef.current, targetPosition, 0.12);
    currentPositionRef.current = nextPosition;

    if (meshRef.current) {
      meshRef.current.position.set(nextPosition[0], nextPosition[1], nextPosition[2]);
    }
  });

  const primitiveOpacity = emphasized ? 1 : faint ? 0.34 : 0.9;

  const linePoints = useMemo(() => {
    return explodedView && showGuideLine
      ? [
          new THREE.Vector3(
            layout.explodedPosition[0],
            layout.explodedPosition[1],
            layout.explodedPosition[2],
          ),
          new THREE.Vector3(
            layout.assembledPosition[0],
            layout.assembledPosition[1],
            layout.assembledPosition[2],
          ),
        ]
      : [];
  }, [explodedView, layout.assembledPosition, layout.explodedPosition, showGuideLine]);

  return (
    <>
      <group ref={meshRef} position={currentPositionRef.current}>
        {layout.primitives.map((primitive) => (
          <PrimitiveMesh
            key={primitive.primitiveId}
            primitive={primitive}
            opacity={primitiveOpacity}
          />
        ))}
        {explodedView || emphasized ? (
          <Text
            position={layout.labelOffset}
            fontSize={0.22}
            color="#e2e8f0"
            anchorX="center"
            anchorY="middle"
            maxWidth={3}
          >
            {layout.label}
          </Text>
        ) : null}
      </group>
      {linePoints.length === 2 ? (
        <Line points={linePoints} color="#94a3b8" lineWidth={1.2} dashed={false} />
      ) : null}
    </>
  );
}

function ViewerScene({ buildDetail, explodedView, activeStageIndex }: BuildThreeViewerProps) {
  const layouts = useMemo(() => buildGroupLayouts(buildDetail), [buildDetail]);
  const isStageMode = typeof activeStageIndex === "number";
  const visibleLayouts = isStageMode
    ? layouts.filter((_layout, layoutIndex) => layoutIndex <= activeStageIndex)
    : layouts;

  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[6, 8, 6]} intensity={1.5} castShadow />
      <directionalLight position={[-4, 5, -4]} intensity={0.52} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <gridHelper args={[18, 18, "#1e293b", "#0f172a"]} position={[0, -2.38, 0]} />

      {visibleLayouts.map((layout) => {
        const sourceIndex = layouts.findIndex((candidateLayout) => candidateLayout.groupId === layout.groupId);
        const emphasized = isStageMode && sourceIndex === activeStageIndex;
        const faint = isStageMode && sourceIndex < activeStageIndex;
        const groupExplodedView = isStageMode ? (emphasized ? explodedView : false) : explodedView;

        return (
          <AssemblyGroupMesh
            key={layout.groupId}
            layout={layout}
            explodedView={groupExplodedView}
            emphasized={emphasized}
            faint={faint}
            showGuideLine={isStageMode ? emphasized : explodedView}
          />
        );
      })}

      <OrbitControls
        enablePan
        enableRotate
        enableZoom
        minDistance={4.5}
        maxDistance={16}
        target={[0, 1, 0]}
      />
    </>
  );
}

export function BuildThreeViewer({ buildDetail, explodedView, activeStageIndex }: BuildThreeViewerProps) {
  const cameraPosition = viewerPresetsByBuildId[buildDetail.buildId]?.cameraPosition ?? [6, 5.5, 7];

  return (
    <div className="h-[28rem] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
      <Canvas key={buildDetail.buildId} camera={{ position: cameraPosition, fov: 42 }} shadows>
        <ViewerScene
          buildDetail={buildDetail}
          explodedView={explodedView}
          activeStageIndex={activeStageIndex}
        />
      </Canvas>
    </div>
  );
}

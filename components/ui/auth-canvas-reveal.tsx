"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { cn } from "@/lib/utils";

type UniformValue = number[] | number[][] | number;

type Uniforms = {
  [key: string]: {
    value: UniformValue;
    type: string;
  };
};

interface ShaderProps {
  source: string;
  uniforms: Uniforms;
  maxFps?: number;
}

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[255, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={cn("relative h-full w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          animationSpeed={animationSpeed}
          colors={colors}
          dotSize={dotSize ?? 3}
          opacities={opacities}
          reverse={reverse}
          center={["x", "y"]}
        />
      </div>

      {showGradient ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
      ) : null}
    </div>
  );
};

interface DotMatrixProps {
  animationSpeed?: number;
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  center?: ("x" | "y")[];
  reverse?: boolean;
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  animationSpeed = 10,
  colors = [[255, 255, 255]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  center = ["x", "y"],
  reverse = false,
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];

    if (colors.length === 2) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[1],
      ];
    } else if (colors.length >= 3) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[2],
        colors[2],
      ];
    }

    return {
      u_animation_speed: {
        value: animationSpeed,
        type: "uniform1f",
      },
      u_colors: {
        value: colorsArray.map((color) => [
          color[0] / 255,
          color[1] / 255,
          color[2] / 255,
        ]),
        type: "uniform3fv",
      },
      u_opacities: {
        value: opacities,
        type: "uniform1fv",
      },
      u_total_size: {
        value: totalSize,
        type: "uniform1f",
      },
      u_dot_size: {
        value: dotSize,
        type: "uniform1f",
      },
      u_reverse: {
        value: reverse ? 1 : 0,
        type: "uniform1i",
      },
    };
  }, [animationSpeed, colors, dotSize, opacities, reverse, totalSize]);

  return (
    <Shader
      source={`
        precision mediump float;

        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_animation_speed;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;

        float random(vec2 xy) {
          return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }

        void main() {
          vec2 st = fragCoord.xy;

          ${
            center.includes("x")
              ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));"
              : ""
          }
          ${
            center.includes("y")
              ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));"
              : ""
          }

          float opacity = step(0.0, st.x) * step(0.0, st.y);
          vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

          float frequency = 5.0;
          float showOffset = random(st2);
          float rand = random(st2 * floor((u_time / frequency) + showOffset + frequency));

          opacity *= u_opacities[int(rand * 10.0)];
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

          vec3 color = u_colors[int(showOffset * 6.0)];
          vec2 centerGrid = u_resolution / 2.0 / u_total_size;
          float distFromCenter = distance(centerGrid, st2);
          float introOffset = distFromCenter * 0.01 + (random(st2) * 0.15);
          float maxGridDist = distance(centerGrid, vec2(0.0, 0.0));
          float outroOffset = (maxGridDist - distFromCenter) * 0.02 + (random(st2 + 42.0) * 0.2);

          float timingOffset = u_reverse == 1 ? outroOffset : introOffset;
          float timeValue = u_time * max(u_animation_speed, 0.01) * 0.15;

          if (u_reverse == 1) {
            opacity *= 1.0 - step(timingOffset, timeValue);
          } else {
            opacity *= step(timingOffset, timeValue);
          }

          fragColor = vec4(color, opacity);
          fragColor.rgb *= fragColor.a;
        }
      `}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

const ShaderMaterial = ({
  source,
  uniforms,
  maxFps = 60,
}: {
  source: string;
  maxFps?: number;
  uniforms: Uniforms;
}) => {
  const { size } = useThree();
  const meshRef = React.useRef<THREE.Mesh>(null);
  const lastFrameTimeRef = React.useRef(0);

  const getUniforms = React.useCallback(() => {
    const preparedUniforms: Record<string, { value: unknown; type?: string }> = {};

    for (const [uniformName, uniform] of Object.entries(uniforms)) {
      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1f" };
          break;
        case "uniform1i":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1i" };
          break;
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1fv" };
          break;
        case "uniform2f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector2().fromArray(uniform.value as number[]),
            type: "2f",
          };
          break;
        case "uniform3fv":
          preparedUniforms[uniformName] = {
            value: (uniform.value as number[][]).map((value) =>
              new THREE.Vector3().fromArray(value),
            ),
            type: "3fv",
          };
          break;
        default:
          preparedUniforms[uniformName] = { value: uniform.value };
      }
    }

    preparedUniforms.u_time = { value: 0, type: "1f" };
    preparedUniforms.u_resolution = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
      type: "2f",
    };

    return preparedUniforms;
  }, [size.height, size.width, uniforms]);

  const material = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;

          uniform vec2 u_resolution;
          out vec2 fragCoord;

          void main() {
            gl_Position = vec4(position.xy, 0.0, 1.0);
            fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: source,
        uniforms: getUniforms(),
        glslVersion: THREE.GLSL3,
        transparent: true,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
      }),
    [getUniforms, source],
  );

  React.useEffect(() => {
    const resolutionUniform = material.uniforms.u_resolution;

    if (resolutionUniform?.value instanceof THREE.Vector2) {
      resolutionUniform.value.set(size.width * 2, size.height * 2);
    }
  }, [material, size.height, size.width]);

  React.useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame(({ clock }) => {
    if (!meshRef.current) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    const minFrameTime = 1 / maxFps;

    if (elapsed - lastFrameTimeRef.current < minFrameTime) {
      return;
    }

    lastFrameTimeRef.current = elapsed;

    const shaderMaterial = meshRef.current.material as THREE.ShaderMaterial;
    shaderMaterial.uniforms.u_time.value = elapsed;

    const resolutionUniform = shaderMaterial.uniforms.u_resolution;

    if (resolutionUniform?.value instanceof THREE.Vector2) {
      resolutionUniform.value.set(size.width * 2, size.height * 2);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};

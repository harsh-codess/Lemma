"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Chrome,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import * as THREE from "three";

import LemmaLogo from "@/components/lemma-logo";
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

type AuthMode = "sign-in" | "sign-up";
type AuthStep = "email" | "code" | "success";
type PendingAction = "email" | "oauth" | "code" | "resend" | null;

interface AuthFlowProps {
  className?: string;
  mode?: AuthMode;
  afterAuthUrl?: string;
  ssoCallbackUrl?: string;
}

const EMPTY_CODE = ["", "", "", "", "", ""];
const CODE_LENGTH = EMPTY_CODE.length;

const SIGN_IN_FALLBACK_URL =
  process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/";
const SIGN_UP_FALLBACK_URL =
  process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/";

const copyByMode = {
  "sign-in": {
    title: "Welcome back",
    subtitle: "Pick up right where your paper left off.",
    socialLabel: "Sign in with Google",
    helper: "Use the email address connected to your Clerk account.",
    emailPlaceholder: "researcher@university.edu",
    resendLabel: "Resend code",
    backLabel: "Back",
    continueLabel: "Continue",
    successTitle: "You're in!",
    successSubtitle: "Taking you back to Lemma.",
    alternatePrompt: "Need an account?",
    alternateHref: "/sign-up",
    alternateLabel: "Create one",
  },
  "sign-up": {
    title: "Create your account",
    subtitle: "Start turning your research into a fundable company.",
    socialLabel: "Continue with Google",
    helper: "We will verify your email with a one-time code.",
    emailPlaceholder: "founder@lab.edu",
    resendLabel: "Send again",
    backLabel: "Back",
    continueLabel: "Create account",
    successTitle: "Account created",
    successSubtitle: "Your Lemma workspace is ready.",
    alternatePrompt: "Already have an account?",
    alternateHref: "/sign-in",
    alternateLabel: "Sign in",
  },
} as const;

const isEmailCodeFactor = (
  factor: unknown,
): factor is { strategy: "email_code"; emailAddressId: string } => {
  if (!factor || typeof factor !== "object") {
    return false;
  }

  const candidate = factor as { strategy?: unknown; emailAddressId?: unknown };

  return (
    candidate.strategy === "email_code" &&
    typeof candidate.emailAddressId === "string"
  );
};

const getEmailCodeFactor = (factors: unknown[] | null | undefined) => {
  const factor = factors?.find(isEmailCodeFactor) ?? null;

  return factor;
};

const getClerkErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "errors" in error &&
    Array.isArray((error as { errors?: unknown[] }).errors)
  ) {
    const [firstError] = (error as {
      errors?: Array<{ longMessage?: string; message?: string }>;
    }).errors ?? [];

    if (firstError?.longMessage) {
      return firstError.longMessage;
    }

    if (firstError?.message) {
      return firstError.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

const getAfterAuthUrl = (mode: AuthMode, afterAuthUrl?: string) => {
  if (afterAuthUrl) {
    return afterAuthUrl;
  }

  return mode === "sign-in" ? SIGN_IN_FALLBACK_URL : SIGN_UP_FALLBACK_URL;
};

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

const ErrorMessage = ({ message }: { message: string | null }) => {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      {message}
    </div>
  );
};

const TermsCopy = () => {
  return (
    <p className="mx-auto max-w-[420px] pt-10 text-center text-xs leading-5 text-white/40 text-balance">
      By continuing, you agree to the{" "}
      <Link
        href="/legal/msa"
        className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/70"
      >
        MSA
      </Link>
      ,{" "}
      <Link
        href="/legal/product-terms"
        className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/70"
      >
        Product Terms
      </Link>
      ,{" "}
      <Link
        href="/legal/privacy-notice"
        className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/70"
      >
        Privacy Notice
      </Link>
      , and{" "}
      <Link
        href="/legal/cookie-notice"
        className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/70"
      >
        Cookie Notice
      </Link>
      .
    </p>
  );
};

const mapMissingFieldsToMessage = (missingFields: string[]) => {
  const remainingFields = missingFields.filter((field) => field !== "emailAddress");

  if (!remainingFields.length) {
    return "We could not finish sign up yet. Please verify that email code again.";
  }

  return `Clerk still requires additional sign-up fields: ${remainingFields.join(
    ", ",
  )}. Update Clerk settings or extend this form before using this custom sign-up flow.`;
};

const AuthFlow = ({
  className,
  mode = "sign-in",
  afterAuthUrl,
  ssoCallbackUrl = "/sso-callback",
}: AuthFlowProps) => {
  const copy = copyByMode[mode];
  const router = useRouter();
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } =
    useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } =
    useSignUp();

  const [email, setEmail] = React.useState("");
  const [step, setStep] = React.useState<AuthStep>("email");
  const [code, setCode] = React.useState<string[]>(EMPTY_CODE);
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [initialCanvasVisible, setInitialCanvasVisible] = React.useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = React.useState(false);
  const codeInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const isLoaded = mode === "sign-in" ? isSignInLoaded : isSignUpLoaded;
  const isBusy = pendingAction !== null;
  const isCodeComplete = code.every((digit) => digit.length === 1);
  const resolvedAfterAuthUrl = getAfterAuthUrl(mode, afterAuthUrl);

  const prepareSignInCode = React.useCallback(
    async (targetEmail: string) => {
      if (!signIn) {
        throw new Error("Clerk sign-in is still loading.");
      }

      const signInAttempt = await signIn.create({ identifier: targetEmail.trim() });
      const emailCodeFactor = getEmailCodeFactor(
        signInAttempt.supportedFirstFactors ?? null,
      );

      if (!emailCodeFactor) {
        throw new Error(
          "Email code sign-in is not enabled in Clerk for this application.",
        );
      }

      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailCodeFactor.emailAddressId,
      });
    },
    [signIn],
  );

  const prepareSignUpCode = React.useCallback(
    async (targetEmail: string) => {
      if (!signUp) {
        throw new Error("Clerk sign-up is still loading.");
      }

      await signUp.create({ emailAddress: targetEmail.trim() });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    },
    [signUp],
  );

  const completeAuth = React.useCallback(
    async (createdSessionId: string) => {
      const setActive = mode === "sign-in" ? setSignInActive : setSignUpActive;

      if (!setActive) {
        throw new Error("Clerk session activation is not available yet.");
      }

      await setActive({ session: createdSessionId });
      setErrorMessage(null);
      setInitialCanvasVisible(false);
      setReverseCanvasVisible(true);
      setStep("success");

      window.setTimeout(() => {
        router.push(resolvedAfterAuthUrl);
      }, 900);
    },
    [mode, resolvedAfterAuthUrl, router, setSignInActive, setSignUpActive],
  );

  React.useEffect(() => {
    if (step !== "code") {
      return;
    }

    const timeout = window.setTimeout(() => {
      codeInputRefs.current[0]?.focus();
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [step]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || !email.trim()) {
      return;
    }

    setPendingAction("email");
    setErrorMessage(null);

    try {
      if (mode === "sign-in") {
        await prepareSignInCode(email);
      } else {
        await prepareSignUpCode(email);
      }

      setCode([...EMPTY_CODE]);
      setStep("code");
    } catch (error) {
      setErrorMessage(getClerkErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleGoogleAuth = async () => {
    if (!isLoaded) {
      return;
    }

    setPendingAction("oauth");
    setErrorMessage(null);

    try {
      if (mode === "sign-in") {
        await signIn?.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: ssoCallbackUrl,
          redirectUrlComplete: resolvedAfterAuthUrl,
        });
      } else {
        await signUp?.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: ssoCallbackUrl,
          redirectUrlComplete: resolvedAfterAuthUrl,
        });
      }
    } catch (error) {
      setErrorMessage(getClerkErrorMessage(error));
      setPendingAction(null);
    }
  };

  const verifyCode = React.useCallback(
    async (nextCode: string) => {
      if (!isLoaded || nextCode.length !== CODE_LENGTH) {
        return;
      }

      setPendingAction("code");
      setErrorMessage(null);

      try {
        if (mode === "sign-in") {
          const result = await signIn?.attemptFirstFactor({
            strategy: "email_code",
            code: nextCode,
          });

          if (result?.status === "complete" && result.createdSessionId) {
            await completeAuth(result.createdSessionId);
            return;
          }

          if (result?.status === "needs_second_factor") {
            throw new Error(
              "This account requires a second factor. Extend the custom flow if you want to support multi-factor sign-in.",
            );
          }

          throw new Error("The verification code could not complete sign-in.");
        }

        const result = await signUp?.attemptEmailAddressVerification({
          code: nextCode,
        });

        if (result?.status === "complete" && result.createdSessionId) {
          await completeAuth(result.createdSessionId);
          return;
        }

        if (result?.status === "missing_requirements") {
          throw new Error(mapMissingFieldsToMessage(result.missingFields));
        }

        throw new Error("The verification code could not complete sign-up.");
      } catch (error) {
        setErrorMessage(getClerkErrorMessage(error));
      } finally {
        setPendingAction(null);
      }
    },
    [completeAuth, isLoaded, mode, signIn, signUp],
  );

  const handleCodeChange = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...code];
    nextCode[index] = nextValue;
    setCode(nextCode);
    setErrorMessage(null);

    if (nextValue && index < CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }

    if (nextCode.every((digit) => digit.length === 1) && !isBusy) {
      void verifyCode(nextCode.join(""));
    }
  };

  const handleCodePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH)
      .split("");

    if (!pastedDigits.length) {
      return;
    }

    event.preventDefault();

    const nextCode = EMPTY_CODE.map((_, index) => pastedDigits[index] ?? "");
    setCode(nextCode);
    setErrorMessage(null);

    const lastFilledIndex = Math.min(pastedDigits.length, CODE_LENGTH) - 1;
    codeInputRefs.current[Math.max(lastFilledIndex, 0)]?.focus();

    if (nextCode.every((digit) => digit.length === 1) && !isBusy) {
      void verifyCode(nextCode.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !email.trim()) {
      return;
    }

    setPendingAction("resend");
    setErrorMessage(null);

      try {
        if (mode === "sign-in") {
        const emailCodeFactor = getEmailCodeFactor(
          signIn?.supportedFirstFactors ?? null,
        );

        if (emailCodeFactor && signIn) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
        } else {
          await prepareSignInCode(email);
        }
      } else {
        await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
      }
    } catch (error) {
      setErrorMessage(getClerkErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleBackClick = () => {
    setStep("email");
    setCode([...EMPTY_CODE]);
    setErrorMessage(null);
    setPendingAction(null);
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full flex-col overflow-hidden bg-black text-white",
        className,
      )}
    >
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible ? (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              reverse={false}
            />
          </div>
        ) : null}

        {reverseCanvasVisible ? (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-black"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              reverse
            />
          </div>
        ) : null}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute left-0 right-0 top-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12 pt-[calc(var(--header-height)+var(--header-top)+48px)] sm:px-10 sm:pt-[calc(var(--header-height)+var(--header-top)+56px)]">
            <div className="w-full max-w-sm">
              <AnimatePresence mode="wait">
                {step === "email" ? (
                  <motion.div
                    key={`${mode}-email-step`}
                    initial={{ opacity: 0, x: -80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-3">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                        <LemmaLogo
                          showWordmark={false}
                          iconClassName="h-11 w-11 rounded-[12px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <h1 className="text-[2.5rem] font-bold leading-[1.05] tracking-tight text-white">
                          {copy.title}
                        </h1>
                        <p className="text-lg font-light text-white/60">
                          {copy.subtitle}
                        </p>
                      </div>
                    </div>

                    <ErrorMessage message={errorMessage} />

                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={!isLoaded || isBusy}
                        className="flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingAction === "oauth" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Chrome className="h-4 w-4" />
                        )}
                        <span>{copy.socialLabel}</span>
                      </button>

                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-sm text-white/40">or</span>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>

                      <form onSubmit={handleEmailSubmit} className="space-y-3">
                        <div className="relative">
                          <input
                            type="email"
                            placeholder={copy.emailPlaceholder}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30"
                            autoComplete="email"
                            required
                            disabled={!isLoaded || isBusy}
                          />

                          <button
                            type="submit"
                            disabled={!isLoaded || isBusy}
                            className="group absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={
                              mode === "sign-in"
                                ? "Send sign-in code"
                                : "Send sign-up code"
                            }
                          >
                            {pendingAction === "email" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            )}
                          </button>
                        </div>

                        <p className="text-sm text-white/45">{copy.helper}</p>
                      </form>
                    </div>

                    <TermsCopy />

                    <p className="text-sm text-white/50">
                      {copy.alternatePrompt}{" "}
                      <Link
                        href={copy.alternateHref}
                        className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-white/80"
                      >
                        {copy.alternateLabel}
                      </Link>
                    </p>
                  </motion.div>
                ) : null}

                {step === "code" ? (
                  <motion.div
                    key={`${mode}-code-step`}
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 80 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-tight text-white">
                        Check your email
                      </h1>
                      <p className="text-lg font-light text-white/55">
                        We sent a 6-digit code to{" "}
                        <span className="text-white">{email}</span>
                      </p>
                    </div>

                    <ErrorMessage message={errorMessage} />

                    <div className="rounded-[32px] border border-white/10 bg-white/[0.02] px-5 py-4">
                      <div className="flex items-center justify-center">
                        {code.map((digit, index) => (
                          <div key={index} className="flex items-center">
                            <div className="relative">
                              <input
                                ref={(element) => {
                                  codeInputRefs.current[index] = element;
                                }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(event) =>
                                  handleCodeChange(index, event.target.value)
                                }
                                onKeyDown={(event) => handleKeyDown(index, event)}
                                onPaste={handleCodePaste}
                                className="w-8 bg-transparent text-center text-2xl text-white outline-none"
                                style={{ caretColor: "transparent" }}
                                disabled={isBusy}
                                aria-label={`Verification digit ${index + 1}`}
                              />

                              {!digit ? (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                  <span className="text-2xl text-white/30">0</span>
                                </div>
                              ) : null}
                            </div>

                            {index < CODE_LENGTH - 1 ? (
                              <span className="text-xl text-white/15">|</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-sm text-white/50 transition-colors hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleResendCode}
                      disabled={!isLoaded || isBusy}
                    >
                      {pendingAction === "resend" ? "Sending..." : copy.resendLabel}
                    </button>

                    <div className="flex w-full gap-3">
                      <motion.button
                        type="button"
                        onClick={handleBackClick}
                        className="w-[32%] rounded-full bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-white/90"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {copy.backLabel}
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={() => void verifyCode(code.join(""))}
                        className={cn(
                          "flex flex-1 items-center justify-center rounded-full border py-3 font-medium transition-all duration-300",
                          isCodeComplete
                            ? "border-transparent bg-white text-black hover:bg-white/90"
                            : "cursor-not-allowed border-white/10 bg-[#111] text-white/45",
                        )}
                        disabled={!isCodeComplete || isBusy}
                        whileHover={isCodeComplete ? { scale: 1.01 } : undefined}
                        whileTap={isCodeComplete ? { scale: 0.99 } : undefined}
                      >
                        {pendingAction === "code" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          copy.continueLabel
                        )}
                      </motion.button>
                    </div>

                    <div className="pt-16">
                      <TermsCopy />
                    </div>
                  </motion.div>
                ) : null}

                {step === "success" ? (
                  <motion.div
                    key={`${mode}-success-step`}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.05] tracking-tight text-white">
                        {copy.successTitle}
                      </h1>
                      <p className="text-[1.2rem] font-light text-white/55">
                        {copy.successSubtitle}
                      </p>
                    </div>

                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="py-10"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-white to-white/70">
                        <Check className="h-8 w-8 text-black" />
                      </div>
                    </motion.div>

                    <motion.button
                      type="button"
                      onClick={() => router.push(resolvedAfterAuthUrl)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="w-full rounded-full bg-white py-3 font-medium text-black transition-colors hover:bg-white/90"
                    >
                      Continue to dashboard
                    </motion.button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SignInPage = (props: Omit<AuthFlowProps, "mode">) => {
  return <AuthFlow {...props} mode="sign-in" />;
};

export const SignUpPage = (props: Omit<AuthFlowProps, "mode">) => {
  return <AuthFlow {...props} mode="sign-up" />;
};

export default AuthFlow;

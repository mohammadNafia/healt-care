"use client";

import {
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [SplineComponent, setSplineComponent] = useState<any>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const splineRef = useRef<any>(null);
  const sceneWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  // Section refs
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);

  // Animation refs for cleanup
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);

  // Check reduced motion on mount
  useEffect(() => {
    setIsReducedMotion(prefersReducedMotion());
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setIsReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Dynamically import Spline component (lazy loading)
  useEffect(() => {
    let isMounted = true;

    import("@splinetool/react-spline")
      .then((mod) => {
        if (isMounted) {
          setSplineComponent(() => mod.default);
          setLoadProgress(30);
        }
      })
      .catch((err) => {
        console.error("Failed to load Spline:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Spline scene load
  const onLoad = useCallback(
    (spline: any) => {
      splineRef.current = spline;
      setLoadProgress(100);

      // Delay to ensure scene is fully rendered
      setTimeout(() => {
        setIsLoading(false);
        // Small delay before initializing animations for smooth transition
        setTimeout(() => {
          if (!isReducedMotion) {
            initScrollAnimations();
          }
        }, 200);
      }, 500);
    },
    [isReducedMotion]
  );

  // Initialize GSAP ScrollTrigger animations with useLayoutEffect for performance
  const initScrollAnimations = useCallback(() => {
    if (!containerRef.current || !scrollContentRef.current || isReducedMotion)
      return;

    const container = containerRef.current;
    const content = scrollContentRef.current;

    // Kill existing animations
    scrollTriggersRef.current.forEach((trigger) => trigger.kill());
    scrollTriggersRef.current = [];
    if (masterTimelineRef.current) {
      masterTimelineRef.current.kill();
    }

    // Define sections array first
    const sections = [
      section1Ref.current,
      section2Ref.current,
      section3Ref.current,
      section4Ref.current,
    ].filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    // Set initial state with GPU-accelerated properties
    gsap.set(container, {
      x: 0,
      y: 0,
      scale: 1.2,
      rotation: 0,
      opacity: 1,
      force3D: true, // Force GPU acceleration
    });

    // Section 3 will remain fixed in place - no animation needed

    // Create master timeline for better synchronization and performance
    const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: content,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // Smooth, responsive scrubbing
        invalidateOnRefresh: true, // Recalculate on resize
        anticipatePin: 1, // Improve performance
      },
    });

    masterTimelineRef.current = masterTimeline;

    // Create a master ScrollTrigger that handles all 3D animations smoothly
    // This ensures continuous, smooth motion across all sections
    const masterScrollTrigger = ScrollTrigger.create({
      trigger: content,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
      onUpdate: (self) => {
        const scrollProgress = self.progress; // 0 to 1 across entire scroll

        let modelX = 0;
        let scale = 1.2;
        let rotation = 0;
        let opacity = 1;

        // Section 1: Hero - Centered (0% to 25%)
        if (scrollProgress <= 0.25) {
          const localProgress = scrollProgress / 0.25;
          modelX = 0;
          scale = 1.2 - localProgress * 0.15; // 1.2 to 1.05
          rotation = localProgress * 15; // 0 to 15
        }
        // Section 2: Text LEFT, 3D RIGHT (25% to 50%)
        else if (scrollProgress <= 0.5) {
          const localProgress = (scrollProgress - 0.25) / 0.25;
          modelX = localProgress * 32; // 0 to 32vw (right)
          scale = 1.05 - localProgress * 0.12; // 1.05 to 0.93
          rotation = 15 + localProgress * 35; // 15 to 50
        }
        // Section 3: Text RIGHT (FIXED), 3D LEFT (50% to 75%)
        else if (scrollProgress <= 0.75) {
          const localProgress = (scrollProgress - 0.5) / 0.25;
          // Move 3D model to left side and keep it there (opposite of right text)
          modelX = 32 - localProgress * 50; // Start at 32vw (right), move to -18vw (left) - enough space for right text
          scale = 0.93 + localProgress * 0.04; // 0.93 to 0.97
          rotation = 50 - localProgress * 50; // 50 to 0 (smoother rotation)
        }
        // Section 4: Centered CTA (75% to 100%)
        else {
          const localProgress = (scrollProgress - 0.75) / 0.25;
          modelX = -18 + localProgress * 18; // -18vw (left) to 0 (center) - smooth return
          scale = 0.97 - localProgress * 0.15; // 0.97 to 0.82
          rotation = 0 - localProgress * 0; // Stay at 0 (no rotation)
          opacity = 1 - localProgress * 0.2; // 1 to 0.8 (subtle fade)
        }

        gsap.to(container, {
          x: `${modelX}vw`,
          y: 0,
          scale: scale,
          rotation: rotation,
          opacity: opacity,
          duration: 0.1,
          ease: "none",
          force3D: true,
        });
      },
    });
    scrollTriggersRef.current.push(masterScrollTrigger);

    // Batch text fade-in animations for better performance
    const textElements = sections
      .map((section) => section.querySelector(".text-content") as HTMLElement)
      .filter(Boolean) as HTMLElement[];

    ScrollTrigger.batch(textElements, {
      onEnter: (elements) => {
        gsap.fromTo(
          elements,
          {
            opacity: 0,
            y: 40,
            scale: 0.95,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.2,
            ease: "power3.out",
            stagger: 0.1,
          }
        );
      },
      start: "top 85%",
      once: true, // Animate only once
    });

    // Refresh after setup
    ScrollTrigger.refresh();

    // Handle window resize
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isReducedMotion]);

  // Reinitialize animations when loading completes and motion preference changes
  useLayoutEffect(() => {
    if (!isLoading && !isReducedMotion) {
      initScrollAnimations();
    }

    return () => {
      scrollTriggersRef.current.forEach((trigger) => trigger.kill());
      scrollTriggersRef.current = [];
      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
      }
    };
  }, [isLoading, isReducedMotion, initScrollAnimations]);

  // Loading progress simulation
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 1.5;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold text-gray-900">
              SkinCare Awareness
            </div>
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Loading Screen */}
      {isLoading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
          role="status"
          aria-label="Loading 3D experience"
        >
          <div className="text-center">
            <div className="mb-8">
              <div
                className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-sans tracking-tight">
              Loading 3D Experience...
            </h2>
            <div className="w-80 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${loadProgress}%` }}
                role="progressbar"
                aria-valuenow={loadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-sm text-gray-600 mt-4 font-medium font-sans">
              {Math.round(loadProgress)}%
            </p>
          </div>
        </div>
      )}

      {/* Sticky 3D Scene Wrapper */}
      <div
        ref={sceneWrapperRef}
        className="fixed inset-0 w-full h-screen z-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full flex items-center justify-center spline-container"
          style={{
            willChange: isReducedMotion ? "auto" : "transform, opacity",
          }}
        >
          <div className="w-full h-full pointer-events-none">
            {SplineComponent && (
              <SplineComponent
                scene="https://prod.spline.design/JDHF0kHYoPoJublL/scene.splinecode"
                onLoad={onLoad}
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Layer */}
      <div ref={scrollContentRef} className="relative z-10 pointer-events-auto pt-16">
        {/* Section 1: Hero */}
        <section
          ref={section1Ref}
          className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20"
        >
          <div className="text-content max-w-5xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-10 md:p-16 lg:p-20 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-gray-900 mb-8 leading-[0.95] tracking-tight">
                Early Detection
                <br />
                <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">
                  Saves Lives
                </span>
              </h1>
              <p className="text-2xl md:text-3xl lg:text-4xl text-gray-800 font-light leading-relaxed max-w-3xl mx-auto">
                Your skin tells a story. We help you read it with precision and
                care.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Understanding DNA - Text LEFT */}
        <section
          ref={section2Ref}
          className="min-h-screen flex items-center justify-start py-20"
        >
          <div className="text-content max-w-2xl w-full px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-10 md:p-14 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 mb-8 leading-tight tracking-tight">
                Understanding
                <br />
                <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">
                  Your DNA
                </span>
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-700 leading-relaxed mb-10 font-light">
                Genetic factors play a crucial role in skin cancer risk.
                Understanding your DNA can help you take proactive steps toward
                prevention and early detection.
              </p>
              <ul className="space-y-5 text-gray-800">
                {[
                  "Family history assessment",
                  "Genetic predisposition analysis",
                  "Personalized risk evaluation",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start group">
                    <span className="text-blue-600 mr-4 font-bold text-xl mt-1 group-hover:scale-125 transition-transform duration-200">
                      •
                    </span>
                    <span className="text-lg md:text-xl font-light flex-1">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Prevention - Text RIGHT (FIXED) */}
        <section
          ref={section3Ref}
          className="min-h-screen flex items-center justify-end py-20 relative w-full"
        >
          <div className="text-content max-w-[600px] lg:max-w-[650px] xl:max-w-[680px] w-full mr-0 pr-3 sm:pr-4 md:pr-6 lg:pr-8 xl:pr-10 2xl:pr-12 pl-6 sm:pl-8 md:pl-10 lg:pl-12 xl:pl-16">
            <div className="backdrop-blur-2xl bg-white/65 rounded-3xl p-10 md:p-14 lg:p-16 shadow-2xl border-2 border-white/60 hover:border-white/80 transition-all duration-500 relative z-20">
              <h2 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-gray-900 mb-6 md:mb-8 leading-tight tracking-tight">
                Prevention
                <br />
                <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">
                  & Protection
                </span>
              </h2>
              <p className="text-base md:text-lg lg:text-xl xl:text-2xl text-gray-800 leading-relaxed mb-8 md:mb-10 font-light">
                Protect yourself with proven prevention strategies and regular
                monitoring.
              </p>
              <div className="space-y-5 md:space-y-6">
                {[
                  {
                    title: "Sun Protection",
                    description:
                      "Use SPF 30+ sunscreen daily, seek shade during peak hours, and wear protective clothing.",
                  },
                  {
                    title: "Regular Check-ups",
                    description:
                      "Schedule annual skin examinations with a dermatologist for early detection.",
                  },
                  {
                    title: "Self-Examination",
                    description:
                      "Perform monthly self-checks and monitor any changes in moles or skin lesions.",
                  },
                ].map((tip, idx) => (
                  <div
                    key={idx}
                    className="bg-white/70 backdrop-blur-lg rounded-xl md:rounded-2xl p-5 md:p-6 border border-white/60 hover:bg-white/85 hover:border-white/90 transition-all duration-300 hover:shadow-xl group transform hover:scale-[1.01]"
                  >
                    <h3 className="font-bold text-gray-900 mb-2 md:mb-3 text-lg md:text-xl lg:text-2xl group-hover:text-blue-600 transition-colors duration-200">
                      {tip.title}
                    </h3>
                    <p className="text-gray-800 font-light text-sm md:text-base lg:text-lg leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: CTA - Centered */}
        <section
          ref={section4Ref}
          className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20"
        >
          <div className="text-content max-w-5xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-white/50 rounded-3xl p-10 md:p-16 lg:p-20 shadow-2xl border border-white/40 hover:border-white/60 transition-all duration-500">
              <h2 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-gray-900 mb-8 leading-[0.95] tracking-tight">
                Book Your
                <br />
                <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">
                  Check-up Now
                </span>
              </h2>
              <p className="text-xl md:text-2xl lg:text-3xl text-gray-800 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
                Take the first step toward protecting your health. Early
                detection is your best defense.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  href="/dashboard"
                  className="group bg-blue-600 text-white px-10 py-5 rounded-2xl font-semibold text-xl hover:bg-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300"
                  aria-label="Go to dashboard"
                >
                  <span className="flex items-center gap-2">
                    Go to the Dashboard
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </Link>
                <button
                  onClick={scrollToTop}
                  className="bg-white/60 backdrop-blur-md text-gray-900 px-10 py-5 rounded-2xl font-semibold text-xl hover:bg-white/80 transition-all duration-300 border-2 border-white/50 hover:border-white/80 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
                  aria-label="Scroll to top"
                >
                  <span className="flex items-center gap-2">
                    Learn More
                    <svg
                      className="w-5 h-5 group-hover:-translate-y-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

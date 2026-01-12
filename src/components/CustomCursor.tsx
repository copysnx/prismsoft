import { useEffect, useState, useCallback, useRef } from "react";

interface TrailPoint {
  x: number;
  y: number;
  id: number;
  opacity: number;
  scale: number;
}

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const trailIdRef = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const newPosition = { x: e.clientX, y: e.clientY };
    setPosition(newPosition);
    setIsVisible(true);

    // Add new trail point
    trailIdRef.current += 1;
    setTrail((prev) => [
      ...prev.slice(-20), // Keep last 20 points
      {
        x: newPosition.x,
        y: newPosition.y,
        id: trailIdRef.current,
        opacity: 1,
        scale: 1,
      },
    ]);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsClicking(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsClicking(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, handleMouseDown, handleMouseUp]);

  // Fade out trail points
  useEffect(() => {
    const interval = setInterval(() => {
      setTrail((prev) =>
        prev
          .map((point) => ({
            ...point,
            opacity: point.opacity - 0.08,
            scale: point.scale + 0.03,
          }))
          .filter((point) => point.opacity > 0)
      );
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Detect hoverable elements
  useEffect(() => {
    const handleHoverDetection = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isHoverable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[role='button']") ||
        target.classList.contains("cursor-pointer") ||
        getComputedStyle(target).cursor === "pointer";

      setIsHovering(!!isHoverable);
    };

    document.addEventListener("mouseover", handleHoverDetection);

    return () => {
      document.removeEventListener("mouseover", handleHoverDetection);
    };
  }, []);

  // Hide on touch devices
  const isTouchDevice =
    typeof window !== "undefined" && "ontouchstart" in window;

  if (isTouchDevice) {
    return null;
  }

  return (
    <>
      {/* Hide default cursor globally */}
      <style>{`
        * {
          cursor: none !important;
        }
      `}</style>

      {/* Smoke trail */}
      {trail.map((point) => (
        <div
          key={point.id}
          className="fixed pointer-events-none z-[9997]"
          style={{
            left: point.x,
            top: point.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Main smoke particle */}
          <div
            className="rounded-full"
            style={{
              width: `${16 * point.scale}px`,
              height: `${16 * point.scale}px`,
              background: `radial-gradient(circle, rgba(168, 85, 247, ${point.opacity * 0.6}) 0%, rgba(192, 38, 211, ${point.opacity * 0.3}) 40%, transparent 70%)`,
              filter: `blur(${4 + point.scale * 2}px)`,
            }}
          />
        </div>
      ))}

      {/* Secondary smoke layer for depth */}
      {trail.filter((_, i) => i % 2 === 0).map((point) => (
        <div
          key={`smoke-${point.id}`}
          className="fixed pointer-events-none z-[9996]"
          style={{
            left: point.x + (Math.random() - 0.5) * 10,
            top: point.y + (Math.random() - 0.5) * 10,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: `${24 * point.scale}px`,
              height: `${24 * point.scale}px`,
              background: `radial-gradient(circle, rgba(139, 92, 246, ${point.opacity * 0.3}) 0%, rgba(217, 70, 239, ${point.opacity * 0.15}) 50%, transparent 70%)`,
              filter: `blur(${8 + point.scale * 3}px)`,
            }}
          />
        </div>
      ))}

      {/* Main cursor dot */}
      <div
        className="fixed pointer-events-none z-[9999] mix-blend-difference"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          className={`rounded-full bg-white transition-all duration-150 ease-out ${
            isClicking ? "scale-50" : "scale-100"
          }`}
          style={{
            width: isHovering ? "12px" : "8px",
            height: isHovering ? "12px" : "8px",
            boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
          }}
        />
      </div>

      {/* Glow around main cursor */}
      <div
        className="fixed pointer-events-none z-[9998]"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          className={`rounded-full transition-all duration-200 ease-out ${
            isClicking ? "scale-75" : "scale-100"
          }`}
          style={{
            width: isHovering ? "30px" : "20px",
            height: isHovering ? "30px" : "20px",
            background: `radial-gradient(circle, rgba(168, 85, 247, ${isHovering ? 0.5 : 0.3}) 0%, transparent 70%)`,
            filter: "blur(4px)",
          }}
        />
      </div>
    </>
  );
};

export default CustomCursor;

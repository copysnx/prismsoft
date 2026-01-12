import { useEffect, useState, useCallback } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [followerPosition, setFollowerPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);
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

  // Smooth follower animation
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      setFollowerPosition((prev) => ({
        x: prev.x + (position.x - prev.x) * 0.15,
        y: prev.y + (position.y - prev.y) * 0.15,
      }));
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [position]);

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
  const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

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
            width: isHovering ? "8px" : "6px",
            height: isHovering ? "8px" : "6px",
          }}
        />
      </div>

      {/* Follower circle */}
      <div
        className="fixed pointer-events-none z-[9998]"
        style={{
          left: followerPosition.x,
          top: followerPosition.y,
          transform: "translate(-50%, -50%)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          className={`rounded-full border-2 transition-all duration-300 ease-out ${
            isHovering 
              ? "border-purple-500 bg-purple-500/10 scale-150" 
              : "border-purple-400/60"
          } ${isClicking ? "scale-75" : ""}`}
          style={{
            width: "40px",
            height: "40px",
            boxShadow: isHovering 
              ? "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)" 
              : "0 0 10px rgba(168, 85, 247, 0.2)",
          }}
        />
      </div>

      {/* Trailing effect */}
      <div
        className="fixed pointer-events-none z-[9997]"
        style={{
          left: followerPosition.x,
          top: followerPosition.y,
          transform: "translate(-50%, -50%)",
          opacity: isVisible ? 0.3 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <div
          className={`rounded-full border transition-all duration-500 ease-out ${
            isHovering 
              ? "border-fuchsia-500/40 scale-200" 
              : "border-fuchsia-400/20"
          }`}
          style={{
            width: "60px",
            height: "60px",
          }}
        />
      </div>
    </>
  );
};

export default CustomCursor;

import React, { useRef, useEffect, HTMLAttributes, ReactNode } from 'react';

interface MovingTextProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  extraSpace?: number; // New prop to account for extra space
}

const MovingText: React.FC<MovingTextProps> = ({
  children,
  className,
  extraSpace = 0,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null); // Explicitly type the ref
  const textBoxRef = useRef<HTMLDivElement>(null); // Explicitly type the ref

  // Handler for mouse enter and touch start events
  const handleMouseEnterOrTouchStart = () => {
    const container = containerRef.current;
    const textBox = textBoxRef.current;

    if (container && textBox) {
      const textWidth = textBox.offsetWidth; // Get the width of the text box
      const containerWidth = container.offsetWidth; // Get the width of the container
      const translateVal = Math.min(containerWidth - textWidth - extraSpace, 0); // Calculate translation value with extra space
      const translateTime = -0.01 * translateVal + 's'; // Calculate translation time
      container.style.setProperty('--translate-duration', translateTime);
      container.style.setProperty('--translate-delay', '1s'); // Add 1s delay
      container.style.setProperty('--translate', `${translateVal}px`);
      textBox.classList.remove('back'); // Remove the back class if present
    }
  };

  // Handler for mouse leave and touch end events
  const handleMouseLeaveOrTouchEnd = () => {
    const container = containerRef.current;
    const textBox = textBoxRef.current;

    if (container && textBox) {
      textBox.classList.add('back'); // Add the back class
      // container.style.setProperty('--translate-duration', "0.15s");
      // container.style.setProperty('--translate', '0');
    }
  };

  // Effect to log the container width
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      console.log('Container width:', container.offsetWidth);
    }
  }, [containerRef.current]);

  return (
    <div
      ref={containerRef} // Attach the ref to the container
      onMouseEnter={handleMouseEnterOrTouchStart}
      onMouseLeave={handleMouseLeaveOrTouchEnd}
      onTouchStart={handleMouseEnterOrTouchStart}
      onTouchEnd={handleMouseLeaveOrTouchEnd}
      className={`moving-text-container ${className}`} // Apply the CSS class
      {...props} // Spread the rest of the props to the container
    >
      <div ref={textBoxRef} className="moving-text-box">
        {children}
      </div>{' '}
      {/* Render children inside the text box */}
    </div>
  );
};

export default MovingText;

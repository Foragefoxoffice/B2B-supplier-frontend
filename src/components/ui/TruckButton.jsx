import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import './TruckButton.scss';

const TruckButton = ({ onClick, disabled, className, children, successText = 'Order Placed' }) => {
    const buttonRef = useRef(null);
    const boxRef = useRef(null);
    const truckRef = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = (e) => {
        e.preventDefault();
        if (disabled || isAnimating || buttonRef.current.classList.contains('done')) return;
        
        setIsAnimating(true);
        const button = buttonRef.current;
        const box = boxRef.current;
        const truck = truckRef.current;
        
        button.classList.add('animation');

        gsap.to(button, {
            '--box-s': 1,
            '--box-o': 1,
            duration: 0.3,
            delay: 0.5
        });

        gsap.to(box, {
            x: 0,
            duration: 0.4,
            delay: 0.7
        });

        gsap.to(button, {
            '--hx': -5,
            '--bx': 50,
            duration: 0.18,
            delay: 0.92
        });

        gsap.to(box, {
            y: 0,
            duration: 0.1,
            delay: 1.15
        });

        gsap.set(button, {
            '--truck-y': 0,
            '--truck-y-n': -26
        });

        gsap.to(button, {
            '--truck-y': 1,
            '--truck-y-n': -25,
            duration: 0.2,
            delay: 1.25,
            onComplete() {
                const endX = button.offsetWidth - 72;
                gsap.timeline({
                    onComplete() {
                        button.classList.add('done');
                        setIsAnimating(false);
                        // Trigger the actual onClick action after animation finishes
                        if (onClick) onClick();
                    }
                }).to(truck, {
                    x: 0,
                    duration: 0.4
                }).to(truck, {
                    x: 40,
                    duration: 1
                }).to(truck, {
                    x: 20,
                    duration: 0.6
                }).to(truck, {
                    x: endX,
                    duration: 0.8
                });
                
                gsap.to(button, {
                    '--progress': 1,
                    duration: 3,
                    ease: "power2.in"
                });
            }
        });
    };

    return (
        <button 
            ref={buttonRef}
            className={`truck-button ${className || ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleClick}
            disabled={disabled}
        >
            <span className="default">{children}</span>
            <span className="success">
                {successText}
                <svg viewBox="0 0 12 10">
                    <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                </svg>
            </span>
            <div className="truck" ref={truckRef}>
                <div className="wheel"></div>
                <div className="back"></div>
                <div className="front"></div>
                <div className="box" ref={boxRef}></div>
            </div>
        </button>
    );
};

export default TruckButton;

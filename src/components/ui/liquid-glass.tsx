"use client";

import React from "react";
import Link from "next/link";

interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  onClick?: () => void;
}

export const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
  href,
  onClick,
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  const content = (
    <div
      className={`relative flex font-semibold overflow-hidden text-white cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
      onClick={onClick}
    >
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-inherit rounded-3xl"
        style={{ backdropFilter: "blur(3px)", filter: "url(#glass-distortion)", isolation: "isolate" }}
      />
      <div className="absolute inset-0 z-10 rounded-inherit" style={{ background: "rgba(255,255,255,0.18)" }} />
      <div
        className="absolute inset-0 z-20 rounded-inherit rounded-3xl overflow-hidden"
        style={{ boxShadow: "inset 2px 2px 1px 0 rgba(255,255,255,0.45), inset -1px -1px 1px 1px rgba(255,255,255,0.45)" }}
      />
      <div className="relative z-30">{children}</div>
    </div>
  );

  if (href) {
    const isInternal = href.startsWith('/');
    return isInternal
      ? <Link href={href} className="block">{content}</Link>
      : <a href={href} target="_blank" rel="noopener noreferrer" className="block">{content}</a>;
  }
  return content;
};

export const GlassButton: React.FC<{
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ children, href, onClick, className = "", disabled }) => (
  <GlassEffect
    href={!disabled ? href : undefined}
    onClick={!disabled ? onClick : undefined}
    className={`rounded-full px-6 py-3 hover:scale-105 active:scale-95 ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
  >
    <div className="transition-all duration-700" style={{ transitionTimingFunction: "cubic-bezier(0.175,0.885,0.32,2.2)" }}>
      {children}
    </div>
  </GlassEffect>
);

export const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
      <feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence" />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lightingColor="white" result="specLight">
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />
      <feDisplacementMap in="SourceGraphic" in2="softMap" scale="200" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

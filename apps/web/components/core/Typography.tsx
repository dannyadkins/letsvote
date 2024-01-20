"use client";

import React, { ReactNode } from "react";

export const Typography = {
  h1: ({ children, ...props }: { children?: ReactNode }) => (
    <h1 className="text-8xl" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: { children?: ReactNode }) => (
    <h2 className="text-6xl" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: { children?: ReactNode }) => (
    <h3 className="text-4xl" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: { children?: ReactNode }) => (
    <h4 className="text-2xl" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: { children?: ReactNode }) => (
    <h5 className="text-xl" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: { children?: ReactNode }) => (
    <h6 className="text-lg" {...props}>
      {children}
    </h6>
  ),
  caption: ({ children, ...props }: { children?: ReactNode }) => (
    <caption
      className="text-sm text-neutral-400 font-semibold uppercase"
      {...props}
    >
      {children}
    </caption>
  ),
  p: ({ children, ...props }: { children?: ReactNode }) => (
    <p className="text-base" {...props}>
      {children}
    </p>
  ),
};

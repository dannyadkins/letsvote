"use client";

import { useState, useEffect } from "react";

export function Header() {
  // a sticky header that turns into white bg when you scroll down, has high z index, has a logo, and has a list of links that collapse

  const links = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "Candidates",
      href: "/candidates",
    },
  ];

  const [scrolled, setScrolled] = useState(false);

  const handleScroll = () => {
    const offset = window.scrollY;
    if (offset > 300) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
  });

  let navbarClasses = [
    "sticky top-0 z-50 transition-all duration-200 ease-in-out",
  ];
  if (scrolled) {
    navbarClasses.push("bg-beige-50");
  }

  return (
    <div className={navbarClasses.join(" ")}>
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">LV</div>
        </div>
        <div className="hidden md:flex justify-end">
          <div className="ml-10 flex items-baseline space-x-4">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
        <div className="-mr-2 flex md:hidden">
          {/* Mobile menu button */}
          <button
            type="button"
            className="bg-beige-50 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            aria-controls="mobile-menu"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {/* Heroicon name: outline/menu */}
            <svg
              className="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#000000"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            {/* Heroicon name: outline/x */}
            <svg
              className="hidden h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#000000"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { GearIcon, GlobeIcon } from "@radix-ui/react-icons";
import { ConfigurationModal } from "@/components/organisms/ConfigurationModal/ConfigurationModal";
import { MotionDivWrapper } from "@/components/core/ClientMotion";
export function Header() {
  // a sticky header that turns into white bg when you scroll down, has high z index, has a logo, and has a list of links that collapse

  const links = [
    {
      name: "Candidates",
      href: "/under-construction",
    },
    {
      name: "Races",
      href: "/under-construction",
    },
    {
      name: "Voting",
      href: "/under-construction",
    },
  ];

  const [scrolled, setScrolled] = useState(false);

  const handleScroll = () => {
    const offset = window.scrollY;
    if (offset > 200) {
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
      <div className="flex items-center justify-between max-w-full mx-auto px-4 py-4 sm:px-6">
        <div className="flex items-center">
          <Link href="/">
            <MotionDivWrapper
              className="flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <GlobeIcon className="hover:animate-spin" />
            </MotionDivWrapper>
          </Link>
        </div>
        <div className="hidden md:flex justify-end items-center">
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
          <ConfigurationModal />
        </div>
      </div>
    </div>
  );
}

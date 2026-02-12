"use client";

import Link from "next/link";
import {useState} from "react";
import { Logo } from "./Logo";
import {LoginModal} from "./LoginModal";

export function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#E9ECEF] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-center px-4 sm:px-6 relative">
          <div className="absolute left-4 sm:left-6">
            <Logo />
          </div>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <Link href="/pages/queue" className="text-sm font-medium text-[#333333] hover:text-[#007bff]">
              Check Queue
            </Link>
            <Link href="/book" className="text-sm font-medium text-[#333333] hover:text-[#007bff]">
              Book Appointment
            </Link>
            <Link href="#about" className="text-sm font-medium text-[#333333] hover:text-[#007bff]">
              About
            </Link>
          </nav>
          <div className="absolute right-4 sm:right-6 flex items-center gap-3">
            <button
              onClick={()=> setIsModalOpen(true)}
              className="rounded-lg border border-[#CCCCCC] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5]"
            >
              Login
            </button>
          </div>
        </div>
      </header>
      <LoginModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}

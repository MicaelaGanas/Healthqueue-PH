"use client";

import {useEffect} from "react";
import Link from "next/link";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({isOpen, onClose}: LoginModalProps) {

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Close Button */}
          <div className="px-6 py-6">
            <div className="flex justify-between">
                <p className="font-bold text-4xl">Login</p>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 z-20"
                    aria-label="Close modal"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <p className="pt-2 font-small text-lg">Choose what user are you</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
                <Link href="/pages/patient-login">
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-400 cursor-pointer hover:bg-white">
                        <p className="text-center text-md">Patient</p>
                    </div>
                </Link>
                <Link href="/pages/employee-login">
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-400 cursor-pointer hover:bg-white ">
                        <p className="text-center text-md">Medical Staff</p>
                    </div>
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
}
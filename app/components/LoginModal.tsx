"use client";

import {useEffect} from "react";
import Link from "next/link";
import Image from "next/image";

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
      <div className="relative z-10 w-full max-w-3xl mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-white px-8 py-8 border-b border-gray-200">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Welcome to HealthQueue</h2>
            <p className="text-gray-600 text-lg">Please select your account type to continue</p>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Patient Card */}
              <Link href="/pages/patient-login" onClick={onClose}>
                <div className="group relative bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-gray-400 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Patient Icon */}
                    <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center border-4 border-gray-200 group-hover:border-gray-300 transition-all">
                      <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Patient</h3>
                      <p className="text-sm text-gray-600 mt-2">Book appointments & check queue status</p>
                    </div>
                    <div className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full text-sm font-medium group-hover:bg-blue-600 transition-colors">
                      Continue as Patient
                    </div>
                  </div>
                </div>
              </Link>

              {/* Medical Staff Card */}
              <Link href="/pages/employee-login" onClick={onClose}>
                <div className="group relative bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-gray-400 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Doctor Icon */}
                    <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center border-4 border-gray-200 group-hover:border-gray-300 transition-all">
                      <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Medical Staff</h3>
                      <p className="text-sm text-gray-600 mt-2">Manage patients & queue system</p>
                    </div>
                    <div className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full text-sm font-medium group-hover:bg-blue-600 transition-colors">
                      Continue as Staff
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
}
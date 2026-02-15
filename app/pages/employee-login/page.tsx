'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  const handleSignIn = () => {
    if (role === 'nurse') {
      router.push('/pages/nurse-dashboard');
      return;
    }
    if (role === 'doctor') {
      router.push('/pages/doctor-dashboard');
      return;
    }
    if (role === 'admin') {
      router.push('/pages/admin-dashboard');
      return;
    }
    // receptionist or other: stay on page or show message
    console.log('Employee ID:', employeeId, 'Password:', password, 'Role:', role);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-[80vh] bg-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          {/* Back to Home */}
          <div className="pt-8 px-4 sm:px-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="flex items-center justify-center px-10 pb-10 relative z-10">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
              {/* Building Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                <svg 
                    className="w-12 h-12 text-gray-600" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                >
                    <path 
                    fillRule="evenodd" 
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
                    clipRule="evenodd" 
                    />
                </svg>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-center mb-2">Staff Login</h1>
              <p className="text-gray-600 text-center mb-8">
                Access the hospital management system
              </p>

              <div className="space-y-4">
                {/* Employee ID Field */}
                <div>
                  <label 
                    htmlFor="employeeId" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Employee ID
                  </label>
                  <input
                    type="text"
                    id="employeeId"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g., EMP-2024-001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Role Dropdown */}
                <div>
                  <label 
                    htmlFor="role" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Select your Role</option>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="admin">Administrator</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                </div>

                {/* Sign In Button */}
                <button
                  onClick={handleSignIn}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors mt-6"
                >
                  Sign In
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-xs text-gray-500 mt-6">
                For authorized hospital personnel only. Contact IT support if you need access
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}

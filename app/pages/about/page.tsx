"use client";

import { useState } from "react";
import { Footer } from "../../components/Footer";

export default function AboutPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const features = [
    {
      title: "Reduce Congestion",
      description: "Optimization hospital processes to minimize long queues, wait times, and patient fatigue.",
      icon: "/icons/people-svgrepo-com.svg"
    },
    {
      title: "Early Diagnosis",
      description: "Enable timely access to healthcare services through organized queue management.",
      icon: "/icons/doctor-svgrepo-com.svg"
    },
    {
      title: "Preventive Care",
      description: "Empower patients with scheduled appointments and reduced barriers to healthcare.",
      icon: "/icons/heart-svgrepo-com.svg"
    },
    {
      title: "Patient Innovation",
      description: "Use AI and IoT technology to provide patient-centered healthcare solutions.",
      icon: "/icons/lightbulb-svgrepo-com.svg"
    }
  ];

  const systemFeatures = [
    "Automated queue management with AI-powered predictions",
    "Priority triage for emergency cases",
    "Accessible design for elderly and PWD patients",
    "QR code queue status for offline check-in",
    "Multi-language support (Filipino, English)",
    "Real-time hospital navigation guidance"
  ];

  const requirements = [
    {
      title: "Valid ID",
      description: "Government-issued ID (Philippine ID, Passport, Driver's License)"
    },
    {
      title: "PhilHealth Card",
      description: "For covered members (optional but recommended)"
    },
    {
      title: "Medical Records",
      description: "Previous test results or prescriptions if applicable"
    },
    {
      title: "Referral Letter",
      description: "If referred from another facility"
    }
  ];

  const faqs = [
    {
      question: "What is HealthQueue PH?",
      answer: "HealthQueue PH is an innovative queue management system designed to streamline hospital processes and improve patient experience."
    },
    {
      question: "How to use is HealthQueue PH?",
      answer: "Simply register with your valid ID, select your preferred doctor and time slot, and receive real-time updates about your queue status."
    },
    {
      question: "What is HealthQueue PH?",
      answer: "HealthQueue PH leverages AI and IoT technology to provide an efficient, patient-centered healthcare experience."
    }
  ];

  {features.map((feature, index) => (
    <div key={index} className="bg-gray-50 p-6 rounded-lg text-center hover:shadow-lg transition-shadow">
        <img src={feature.icon} alt={feature.title} className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#333333] mb-3">{feature.title}</h3>
        <p className="text-sm text-gray-600">{feature.description}</p>
    </div>
   ))}

  return (
    <>
      <div className="bg-white">
        {/* Hero Section */}
        <div className="bg-gray-50 py-16 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-4xl font-bold text-[#333333] mb-2">About HealthQueue</h1>
            <p className="text-gray-600">
              Make your diagnosis convenient and reassuring, welcome to HealthQueue PH
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg text-center hover:shadow-lg transition-shadow">
                <img src={feature.icon} alt={feature.title} className="w-12 h-12 mx-auto mb-4 object-contain" />
                <h3 className="text-lg font-semibold text-[#333333] mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Information Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-[#333333] mb-8">System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {systemFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Registration Requirements Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-[#333333] mb-8">Registration Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requirements.map((req, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-[#333333] mb-2">{req.title}</h3>
                <p className="text-sm text-gray-600">{req.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-[#333333] mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 mb-8">
              These are some of the most frequently asked questions about HealthQueue PH, see some of the questions below to be aware
            </p>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-medium text-[#333333] text-left">{faq.question}</h3>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform ${expandedFaq === index ? "transform rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 py-3 bg-gray-50">
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
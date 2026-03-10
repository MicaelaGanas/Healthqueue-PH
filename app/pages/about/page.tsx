"use client";

import { useState } from "react";
import Image from "next/image";
import { Footer } from "../../components/Footer";
import { FadeInSection } from "../../components/FadeInSection";

export default function AboutPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const features = [
    {
      title: "Reduce Congestion",
      description: "Optimize hospital processes to minimize long queues, wait times, and patient fatigue.",
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
      answer: "HealthQueue PH is an innovative queue management system designed to streamline hospital processes and improve patient experience through AI-powered technology."
    },
    {
      question: "How do I use HealthQueue PH?",
      answer: "Simply register with your valid ID, select your preferred doctor and time slot, and receive real-time updates about your queue status through our web platform."
    },
    {
      question: "Is HealthQueue PH free to use?",
      answer: "Yes, HealthQueue PH is free for all patients. You only pay for your actual medical services at the hospital."
    },
    {
      question: "Can I book appointments for my family members?",
      answer: "Yes, once registered, you can book appointments for family members by adding their information to your account."
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#e7f0ff] via-[#f5f8ff] to-white py-24 sm:py-28">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1920&h=600&fit=crop"
              alt="Hospital background"
              fill
              className="object-cover"
              unoptimized
              priority
            />
            <div className="absolute inset-0 bg-white/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#e7f0ff]/85 via-[#f5f8ff]/92 to-white" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <div className="inline-block mb-6 px-5 py-2 bg-white/80 backdrop-blur-sm border border-[#007bff]/10 text-[#1e293b] rounded-full text-sm font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              About Us
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-[#003566] mb-6 animate-fade-in-up" style={{ fontFamily: "var(--font-rosario), sans-serif", animationDelay: '0.4s' }}>About HealthQueue</h1>
            <p className="text-lg sm:text-xl text-[#4b5563] max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              Make your diagnosis convenient and reassuring. Welcome to HealthQueue PH — your partner in smarter healthcare.
            </p>
          </div>
        </div>

        {/* Mission & Image Section */}
        <FadeInSection>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop"
                alt="Hospital reception"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#003566]/15 via-transparent to-transparent" aria-hidden />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#0f172a] mb-6" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>Our Mission</h2>
              <p className="text-[#4b5563] leading-relaxed mb-4">
                HealthQueue PH was created to address one of the most pressing challenges in Philippine healthcare: long waiting times and inefficient queue management systems. We believe that every patient deserves timely, organized, and stress-free access to medical care.
              </p>
              <p className="text-[#4b5563] leading-relaxed mb-4">
                By leveraging cutting-edge technology including AI-powered predictions and IoT integration, we're transforming how hospitals manage patient flow and how patients experience healthcare services.
              </p>
              <p className="text-[#4b5563] leading-relaxed">
                Our platform empowers both patients and healthcare providers, creating a seamless ecosystem where quality healthcare is accessible, efficient, and patient-centered.
              </p>
            </div>
          </div>
        </div>
        </FadeInSection>

        {/* Features Section */}
        <FadeInSection>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0f172a] mb-4" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>Why Choose HealthQueue?</h2>
            <p className="text-[#6C757D] max-w-2xl mx-auto">
              We're committed to transforming your healthcare experience with cutting-edge technology and patient-first design.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[#BFDBFE] hover:shadow-[0_14px_40px_rgba(15,23,42,0.18)]"
              >
                <div className="w-16 h-16 bg-[#f1f5f9] rounded-xl flex items-center justify-center mb-6 text-[#007bff] transition-colors group-hover:bg-[#007bff]">
                  <img src={feature.icon} alt={feature.title} className="w-8 h-8 object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                </div>
                <h3 className="text-xl font-bold text-[#0f172a] mb-3" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>{feature.title}</h3>
                <p className="text-[#4b5563] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        </FadeInSection>

        {/* System Information Section */}
        <FadeInSection>
        <div className="bg-[#F5F8FF] py-16 sm:py-20 border-y border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0f172a] mb-4" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>Powerful Features</h2>
              <p className="text-[#6C757D] max-w-2xl mx-auto">
                Experience healthcare management like never before with our comprehensive feature set.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 bg-white/85 rounded-2xl p-5 border border-[#E2E8F0] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#BFDBFE] hover:shadow-[0_12px_36px_rgba(15,23,42,0.12)]">
                  <div className="flex-shrink-0 w-9 h-9 bg-[#e7f0ff] rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#007bff]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-[#334155] font-medium">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </FadeInSection>

        {/* Registration Requirements Section */}
        <FadeInSection>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0f172a] mb-4" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>Registration Requirements</h2>
            <p className="text-[#6C757D] max-w-2xl mx-auto">
              Get started quickly by preparing these essential documents for a smooth registration process.
            </p>
          </div>
          
          {/* Image showcase */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative h-[200px] rounded-xl overflow-hidden shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop"
                alt="Patient consultation"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="relative h-[200px] rounded-xl overflow-hidden shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=300&fit=crop"
                alt="Medical staff"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="relative h-[200px] rounded-xl overflow-hidden shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=300&fit=crop"
                alt="Hospital facility"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requirements.map((req, index) => (
              <div key={index} className="group bg-white border border-[#E2E8F0] p-8 rounded-2xl shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[#BFDBFE] hover:shadow-[0_14px_40px_rgba(15,23,42,0.18)]">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#f1f5f9] rounded-xl flex items-center justify-center text-[#007bff] group-hover:bg-[#007bff] transition-colors">
                    <svg className="w-6 h-6 text-[#007bff] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#0f172a] mb-2" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>{req.title}</h3>
                    <p className="text-[#4b5563] leading-relaxed">{req.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </FadeInSection>

        {/* FAQ Section */}
        <FadeInSection>
        <div className="bg-[#F5F8FF] py-16 sm:py-20 border-t border-[#E2E8F0]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0f172a] mb-4" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>Frequently Asked Questions</h2>
              <p className="text-[#6C757D]">
                Find answers to common questions about HealthQueue PH
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-[#BFDBFE] hover:shadow-[0_12px_36px_rgba(15,23,42,0.12)]">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-[#f8fafc] transition-colors"
                  >
                    <h3 className="font-semibold text-[#0f172a] pr-8">{faq.question}</h3>
                    <div className={`flex-shrink-0 w-8 h-8 bg-[#e7f0ff] rounded-full flex items-center justify-center transition-all ${expandedFaq === index ? "rotate-180 bg-[#007bff]" : ""}`}>
                      <svg
                        className={`w-5 h-5 transition-colors ${expandedFaq === index ? "text-white" : "text-[#007bff]"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-[#4b5563] leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        </FadeInSection>
      </div>
      <Footer />
    </>
  );
}
export function QueueStatus() {
  const navigationSteps = [
    { id: 1, title: "Registration", location: "Front Desk - Counter 3", status: "completed" as const },
    { id: 2, title: "Initial Check", location: "Triage Station - Station 2", status: "completed" as const },
    { id: 3, title: "General Consultation", location: "Waiting 3, 2nd Floor - Room 205", status: "current" as const },
    { id: 4, title: "Laboratory Tests (X-ray)", location: "Building B, 1st Floor - Radiology Lab", status: "pending" as const },
    { id: 5, title: "Pharmacy", location: "Building D, 1st Floor - Window 2", status: "pending" as const }
  ];

  return (
    <div className="bg-white rounded-b-lg shadow-sm p-8 space-y-6">
      {/* Queue Number Section */}
      <div className="bg-gray-50 p-8 rounded-lg">
        <p className="text-sm text-gray-600 3">Your Queue Number</p>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-5xl font-bold text-[#333333]">GC-099</h2>
            <p className="text-gray-600">General Consultation</p>
          </div>
          <div className="text-right">
            <div className="bg-gray-300 rounded-lg py-1 px-3 ml-auto w-fit">
                <p className="text-sm text-gray-600 font-semibold">Position # 12</p>
            </div>
            <p className="text-2xl font-bold text-[#007bff] mt-2">Estimate: 15 mins wait</p>
          </div>
        </div>
      </div>

      {/* Current Location and Next Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Location */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Location</p>
              <h3 className="text-xl font-semibold text-[#333333]">Waiting Area A</h3>
              <p className="text-sm text-gray-600 mt-1">Please wait until further notice</p>
            </div>
          </div>
        </div>

        {/* Next Destination */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.54,3.1,3.62,10.31A1.17,1.17,0,0,0,4,12.5l6.23,1.26L11.5,20a1.17,1.17,0,0,0,2.19.39L20.9,4.46A1,1,0,0,0,19.54,3.1Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Next Destination</p>
              <h3 className="text-xl font-semibold text-[#333333]">Room 205</h3>
              <p className="text-sm text-gray-600 mt-1">Building A, 2nd Floor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Guide */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#333333]">Navigation Guide</h3>
          <p className="text-sm text-gray-600">2/5 Steps</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: "40%" }}></div>
        </div>

        {/* Navigation Steps */}
        <div className="space-y-4">
          {navigationSteps.map((step) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {step.status === "completed" && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {step.status === "current" && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                )}
                {step.status === "pending" && (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex-shrink-0"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${step.status === "current" ? "text-blue-600" : "text-[#333333]"}`}>
                    {step.title}
                  </h4>
                  {step.status === "current" && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded">Current</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{step.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

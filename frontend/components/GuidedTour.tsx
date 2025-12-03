import React, { useState } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Globe, Camera, Rocket
} from 'lucide-react';

interface GuidedTourProps {
  onComplete: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  highlight: string;
}

const tourSteps: TourStep[] = [
  {
    title: "Choose Your Destination",
    description: "Travel anywhere in the universe across any time period. Use Manual mode for quick input, Terminal for natural language commands, or Orbital to pick coordinates on an interactive map.",
    icon: <Globe className="w-10 h-10" />,
    features: [
      "🌍 Earth locations (Paris, Tokyo, Pyramids of Giza)",
      "🚀 Space & planets (Mars Colony, Moon Base, Saturn Rings)",
      "🏛️ Historical sites (Ancient Rome, Medieval Castles)",
      "🔮 Future worlds (Year 3000, Cyberpunk Cities)",
    ],
    highlight: "Try: 'Eiffel Tower in 1920' or coordinates '35.6762, 139.6503' for Tokyo"
  },
  {
    title: "Add Your Photo",
    description: "Upload a selfie or take a photo to be placed into your destination! The AI will seamlessly integrate you into any location, era, or world you choose.",
    icon: <Camera className="w-10 h-10" />,
    features: [
      "📸 Upload from device or take a live photo",
      "🎭 Get inserted into historical scenes",
      "👽 Appear on alien planets",
      "🎨 Choose visual styles: Realistic, Cyberpunk, Oil Painting & more",
    ],
    highlight: "Click the profile icon next to 'Engage Teleport' to add your photo"
  },
  {
    title: "Explore & Download",
    description: "After teleporting, explore your AI-generated destination with audio narration, download high-resolution images, and revisit past journeys in your Temporal Archives.",
    icon: <Rocket className="w-10 h-10" />,
    features: [
      "🔊 AI audio guide describes your surroundings",
      "💾 Download 8K images to share with friends",
      "📚 All journeys saved in Temporal Archives",
      "🗺️ Open locations in Google Street View",
    ],
    highlight: "Your history is private and stored securely in your account"
  }
];

export const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleSkip}
      />
      
      <div className="relative max-w-xl w-full max-h-[90vh] bg-cyber-800 border border-cyber-500 rounded-2xl shadow-[0_0_100px_rgba(14,165,233,0.3)] overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
        <div className="sticky top-0 left-0 w-full h-1.5 bg-cyber-900 z-20">
          <div 
            className="h-full bg-gradient-to-r from-cyber-500 to-cyber-400 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        <button
          onClick={handleSkip}
          className="sticky top-2 right-4 float-right p-2 text-slate-500 hover:text-white transition-colors z-20 mr-2"
          aria-label="Skip tour"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 pt-4">
          <div className="text-center mb-2">
            <span className="text-xs font-mono text-cyber-500 tracking-widest">
              STEP {currentStep + 1} OF {tourSteps.length}
            </span>
          </div>

          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 bg-gradient-to-br from-cyber-500/30 to-cyber-accent/20 rounded-2xl flex items-center justify-center text-cyber-400 border border-cyber-500/50 shadow-[0_0_40px_rgba(14,165,233,0.3)] animate-pulse">
              {step.icon}
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3 font-mono tracking-wide">
            {step.title}
          </h2>

          <p className="text-slate-300 text-center leading-relaxed mb-5 text-sm sm:text-base">
            {step.description}
          </p>

          <div className="bg-black/40 border border-cyber-700/50 rounded-xl p-4 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {step.features.map((feature, index) => (
                <div 
                  key={index}
                  className="text-xs sm:text-sm text-slate-300 py-1.5 px-2 rounded bg-cyber-900/30 border border-cyber-800/50"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-cyber-500/10 border border-cyber-500/30 rounded-lg p-3 mb-6">
            <p className="text-xs text-cyber-300 font-mono flex items-start gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyber-400" />
              <span><strong className="text-cyber-400">TIP:</strong> {step.highlight}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-5">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-cyber-500 w-8' 
                    : index < currentStep 
                      ? 'bg-cyber-500/60 w-2' 
                      : 'bg-cyber-800 border border-cyber-700 w-2'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`flex-1 py-3 px-4 rounded-lg font-bold font-mono tracking-wide transition-all flex items-center justify-center gap-2 ${
                isFirstStep
                  ? 'bg-cyber-900/50 text-slate-600 cursor-not-allowed'
                  : 'bg-cyber-900 border border-cyber-700 text-white hover:border-cyber-500 hover:bg-cyber-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            <button
              onClick={handleNext}
              className="flex-[2] py-3 px-4 bg-gradient-to-r from-cyber-500 to-cyber-400 hover:from-cyber-400 hover:to-cyber-300 text-black font-bold font-mono tracking-wide rounded-lg transition-all shadow-[0_0_25px_rgba(14,165,233,0.5)] hover:shadow-[0_0_35px_rgba(14,165,233,0.7)] flex items-center justify-center gap-2"
            >
              {isLastStep ? (
                <>
                  <Rocket className="w-4 h-4" />
                  Start Time Travelling!
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

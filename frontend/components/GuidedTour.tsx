import React, { useState } from 'react';
import { 
  X, ChevronRight, ChevronLeft, MapPin, Terminal, Globe, 
  Camera, Send, Clock, History, Download, Volume2, Sparkles 
} from 'lucide-react';

interface GuidedTourProps {
  onComplete: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome, Time Traveller!",
    description: "You're about to experience any location across time using AI-powered visualization. This quick tour will show you how to navigate the Temporal Displacement Engine.",
    icon: <Sparkles className="w-8 h-8" />,
    tip: "You can restart this tour anytime from the settings."
  },
  {
    title: "Manual Mode",
    description: "In Manual mode, enter your destination coordinates (like 'Kyoto, Japan' or 'Mars Colony'), select a time period, and choose a visual style for your journey.",
    icon: <MapPin className="w-8 h-8" />,
    tip: "Try entering coordinates like '48.8584, 2.2945' for the Eiffel Tower!"
  },
  {
    title: "Terminal Mode",
    description: "Use natural language commands in Terminal mode. Just type something like 'Take me to Paris in the 1920s' and the AI will parse your request and initiate the teleport.",
    icon: <Terminal className="w-8 h-8" />,
    tip: "The AI understands complex requests like 'Show me Tokyo during cherry blossom season'."
  },
  {
    title: "Orbital Mode",
    description: "Click anywhere on the interactive map to select coordinates. You can also search for addresses, pincodes, or place names. The system will check Street View availability in real-time.",
    icon: <Globe className="w-8 h-8" />,
    tip: "Green indicator = Street View available, Yellow = AI will generate the view."
  },
  {
    title: "Traveler Identity",
    description: "Upload your photo or take a selfie to be inserted into the generated images! Click the profile icon next to the Engage Teleport button.",
    icon: <Camera className="w-8 h-8" />,
    tip: "Your photo will appear in the generated destination images."
  },
  {
    title: "Engage Teleport",
    description: "Once you've set your destination and time period, click 'Engage Teleport' to start your journey. The AI will generate a unique visualization of your destination.",
    icon: <Send className="w-8 h-8" />,
    tip: "Generation typically takes 10-30 seconds depending on complexity."
  },
  {
    title: "Audio Guide",
    description: "After arriving at your destination, click 'Play Audio Guide' to hear an AI-narrated description of your location. The voice describes what you see, hear, and smell.",
    icon: <Volume2 className="w-8 h-8" />,
    tip: "The audio is generated using Gemini's text-to-speech technology."
  },
  {
    title: "Download Images",
    description: "Love your generated image? Click the download button on the image to save it to your device. Share your time-travel adventures with friends!",
    icon: <Download className="w-8 h-8" />,
    tip: "Images are saved in high resolution (8K quality)."
  },
  {
    title: "Temporal Archives",
    description: "All your journeys are saved in the Temporal Archives. Click on any past journey to revisit it, or use it as inspiration for new adventures.",
    icon: <History className="w-8 h-8" />,
    tip: "Your history is private and stored securely in your account."
  },
  {
    title: "Ready for Adventure!",
    description: "You're all set to explore time and space! Start by selecting a destination in Manual, Terminal, or Orbital mode. Have an amazing journey, Time Traveller!",
    icon: <Sparkles className="w-8 h-8" />,
    tip: "Pro tip: Try combining Street View locations with different time periods for stunning results."
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
      
      <div className="relative max-w-lg w-full bg-cyber-800 border border-cyber-500 rounded-2xl shadow-[0_0_100px_rgba(14,165,233,0.3)] overflow-hidden animate-[fadeIn_0.3s_ease-out]">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyber-900">
          <div 
            className="h-full bg-gradient-to-r from-cyber-500 to-cyber-400 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors z-10"
          aria-label="Skip tour"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-cyber-500/20 rounded-2xl flex items-center justify-center text-cyber-400 border border-cyber-500/50 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
              {step.icon}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-4 font-mono tracking-wide">
            {step.title}
          </h2>

          <p className="text-slate-300 text-center leading-relaxed mb-6">
            {step.description}
          </p>

          {step.tip && (
            <div className="bg-cyber-900/50 border border-cyber-700 rounded-lg p-4 mb-6">
              <p className="text-xs text-cyber-400 font-mono flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span><strong>TIP:</strong> {step.tip}</span>
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mb-6">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-cyber-500 w-6' 
                    : index < currentStep 
                      ? 'bg-cyber-500/50' 
                      : 'bg-cyber-800 border border-cyber-700'
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
                  ? 'bg-cyber-900 text-slate-600 cursor-not-allowed'
                  : 'bg-cyber-900 border border-cyber-700 text-white hover:border-cyber-500'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            <button
              onClick={handleNext}
              className="flex-1 py-3 px-4 bg-cyber-500 hover:bg-cyber-400 text-black font-bold font-mono tracking-wide rounded-lg transition-all shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:shadow-[0_0_30px_rgba(14,165,233,0.6)] flex items-center justify-center gap-2"
            >
              {isLastStep ? "Start Exploring!" : "Next"}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-center text-xs text-slate-600 mt-4 font-mono">
            Step {currentStep + 1} of {tourSteps.length}
          </p>
        </div>
      </div>
    </div>
  );
};


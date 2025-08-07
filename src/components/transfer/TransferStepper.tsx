
import React from 'react';

type Step = {
  title: string;
  component: React.ComponentType<any>;
};

type TransferStepperProps = {
  steps: Step[];
  currentStep: number;
};

const TransferStepper = ({ steps, currentStep }: TransferStepperProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      {steps.map((step, index) => (
        <div
          key={step.title}
          className={`flex items-center ${
            index === steps.length - 1 ? "" : "flex-1"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              index <= currentStep
                ? "bg-emerald-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {index + 1}
          </div>
          <div
            className={`text-sm ml-2 transition-colors ${
              index <= currentStep ? "text-emerald-600" : "text-gray-500"
            }`}
          >
            {step.title}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`hidden md:block h-0.5 flex-1 mx-4 transition-colors ${
                index < currentStep ? "bg-emerald-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default TransferStepper;


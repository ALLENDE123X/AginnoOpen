"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 24, 
  className = "text-primary" 
}) => {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`h-${size} w-${size} animate-spin ${className}`} />
    </div>
  );
}; 
import { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { AIComment } from '../types';

interface UseAIReturn {
  apiStatus: { available: boolean; provider: string };
}

export const useAI = (): UseAIReturn => {
  const apiStatus = geminiService.getApiStatus();

  return {
    apiStatus
  };
};
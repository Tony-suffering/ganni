import { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { AIComment } from '../types';

interface UseAIReturn {
  generateDescription: (title: string, userComment: string, imageAIDescription?: string) => Promise<string>;
  generateComments: (title: string, userComment: string, aiDescription: string) => Promise<AIComment[]>;
  isGeneratingDescription: boolean;
  isGeneratingComments: boolean;
  apiStatus: { available: boolean; provider: string };
}

export const useAI = (): UseAIReturn => {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingComments, setIsGeneratingComments] = useState(false);

  const generateDescription = async (title: string, userComment: string, imageAIDescription?: string): Promise<string> => {
    setIsGeneratingDescription(true);
    try {
      const description = await geminiService.generateAIDescription(title, userComment, imageAIDescription);
      return description;
    } catch (error) {
      console.error('Failed to generate AI description:', error);
      throw error;
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const generateComments = async (
    title: string, 
    userComment: string, 
    aiDescription: string
  ): Promise<AIComment[]> => {
    setIsGeneratingComments(true);
    try {
      const comments = await geminiService.generateAIComments(title, userComment, aiDescription);
      return comments;
    } catch (error) {
      console.error('Failed to generate AI comments:', error);
      throw error;
    } finally {
      setIsGeneratingComments(false);
    }
  };

  const apiStatus = geminiService.getApiStatus();

  return {
    generateDescription,
    generateComments,
    isGeneratingDescription,
    isGeneratingComments,
    apiStatus
  };
};
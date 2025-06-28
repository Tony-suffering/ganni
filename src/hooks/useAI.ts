import { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { productRecommendationService } from '../services/productRecommendationService';
import { AIComment, ProductRecommendation } from '../types';

interface UseAIReturn {
  generateDescription: (title: string, userComment: string, imageAIDescription?: string) => Promise<string>;
  generateComments: (title: string, userComment: string, aiDescription: string) => Promise<AIComment[]>;
  generateCommentsWithProducts: (
    title: string, 
    userComment: string, 
    aiDescription: string, 
    productRecommendations?: ProductRecommendation
  ) => Promise<AIComment[]>;
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

  const generateCommentsWithProducts = async (
    title: string, 
    userComment: string, 
    aiDescription: string,
    productRecommendations?: ProductRecommendation
  ): Promise<AIComment[]> => {
    setIsGeneratingComments(true);
    try {
      // 通常のAIコメントを生成
      const comments = await geminiService.generateAIComments(title, userComment, aiDescription);
      
      // 商品推薦がある場合、1つのコメントに商品リンクを織り込む
      if (productRecommendations && productRecommendations.products.length > 0) {
        const productToMention = productRecommendations.products[0]; // 最初の商品を使用
        const originalComment = comments[0]; // 最初のコメントを選択
        
        try {
          const enhancedContent = await productRecommendationService.generateProductMentionComment(
            originalComment.content,
            productToMention,
            productRecommendations.context
          );
          
          // 商品リンクを含む新しいコメントで置き換え
          comments[0] = {
            ...originalComment,
            content: enhancedContent
          };
        } catch (productError) {
          console.error('Failed to enhance comment with product:', productError);
          // エラー時は元のコメントをそのまま使用
        }
      }
      
      return comments;
    } catch (error) {
      console.error('Failed to generate AI comments with products:', error);
      throw error;
    } finally {
      setIsGeneratingComments(false);
    }
  };

  const apiStatus = geminiService.getApiStatus();

  return {
    generateDescription,
    generateComments,
    generateCommentsWithProducts,
    isGeneratingDescription,
    isGeneratingComments,
    apiStatus
  };
};
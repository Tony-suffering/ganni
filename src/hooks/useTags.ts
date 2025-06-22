import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Tag } from '../types';

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .order('name');

      if (error) throw error;

      // データベースのスキーマに合わせてマッピング
      const formattedTags: Tag[] = (data || []).map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color || '#6366f1',
        category: 'その他' // デフォルト値
      }));

      setTags(formattedTags);
      setError(null);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError(err as Error);
      // エラーの場合はモックタグにフォールバック
      const { mockTags } = await import('../data/mockData');
      setTags(mockTags);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    refetch: fetchTags
  };
};
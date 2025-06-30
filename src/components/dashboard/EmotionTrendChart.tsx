import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Post } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EmotionTrendChartProps {
  posts: Post[];
}

export const EmotionTrendChart: React.FC<EmotionTrendChartProps> = ({ posts }) => {
  const [isReady, setIsReady] = React.useState(false);
  const chartKey = React.useMemo(() => Math.random().toString(36).substr(2, 9), [posts]);

  useEffect(() => {
    // コンポーネントがマウントされてからチャートを表示
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setIsReady(false);
    };
  }, [posts]);
  const generateMonthlyEmotionData = () => {
    const monthlyData: Record<string, { positive: number; energetic: number; calm: number; total: number }> = {};
    
    posts.forEach(post => {
      const date = new Date(post.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { positive: 0, energetic: 0, calm: 0, total: 0 };
      }
      
      const text = (post.title + ' ' + post.userComment).toLowerCase();
      
      const positiveWords = ['嬉しい', '楽しい', '素晴らしい', '最高', '感動', '幸せ', '美しい'];
      const energeticWords = ['興奮', 'エキサイト', '元気', 'パワー', '活動的', '刺激的'];
      const calmWords = ['静か', '落ち着く', 'リラックス', '平和', '穏やか', '癒し'];
      
      if (positiveWords.some(word => text.includes(word))) {
        monthlyData[monthKey].positive++;
      }
      if (energeticWords.some(word => text.includes(word))) {
        monthlyData[monthKey].energetic++;
      }
      if (calmWords.some(word => text.includes(word))) {
        monthlyData[monthKey].calm++;
      }
      
      monthlyData[monthKey].total++;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    
    return {
      labels: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return `${year}年${monthNum}月`;
      }),
      positive: sortedMonths.map(month => 
        monthlyData[month].total > 0 ? (monthlyData[month].positive / monthlyData[month].total) * 100 : 0
      ),
      energetic: sortedMonths.map(month => 
        monthlyData[month].total > 0 ? (monthlyData[month].energetic / monthlyData[month].total) * 100 : 0
      ),
      calm: sortedMonths.map(month => 
        monthlyData[month].total > 0 ? (monthlyData[month].calm / monthlyData[month].total) * 100 : 0
      )
    };
  };

  const emotionData = generateMonthlyEmotionData();

  const chartData = {
    labels: emotionData.labels,
    datasets: [
      {
        label: 'ポジティブ',
        data: emotionData.positive,
        borderColor: '#10B981',
        backgroundColor: '#10B98120',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'エネルギッシュ',
        data: emotionData.energetic,
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B20',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'おだやか',
        data: emotionData.calm,
        borderColor: '#6B7280',
        backgroundColor: '#6B728020',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: '感情トレンドの推移',
        font: {
          size: 16,
          weight: '600'
        },
        padding: 20
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '月',
          font: {
            size: 12
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '感情の割合 (%)',
          font: {
            size: 12
          }
        },
        beginAtZero: true,
        max: 100,
        grid: {
          color: '#E5E7EB'
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  if (posts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">感情トレンドの推移</h3>
        <div className="text-center text-gray-500 py-8">
          投稿データがありません
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="h-80">
        {isReady ? (
          <Line 
            data={chartData} 
            options={options}
            key={`emotion-${chartKey}`}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">チャートを読み込み中...</div>
          </div>
        )}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>月ごとの感情傾向を表示しています。投稿内容のキーワード分析に基づいています。</p>
      </div>
    </div>
  );
};
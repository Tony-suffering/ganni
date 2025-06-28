import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
  ChartOptions
} from 'chart.js';
import { Bar, PolarArea } from 'react-chartjs-2';
import { Post } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement
);

interface PostingTimeChartProps {
  posts: Post[];
}

export const PostingTimeChart: React.FC<PostingTimeChartProps> = ({ posts }) => {
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
  const generateTimeData = () => {
    const hourlyData = new Array(24).fill(0);
    const dayOfWeekData = new Array(7).fill(0);
    
    posts.forEach(post => {
      const date = new Date(post.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay(); // 0 = Sunday
      
      hourlyData[hour]++;
      dayOfWeekData[dayOfWeek]++;
    });

    return { hourlyData, dayOfWeekData };
  };

  const { hourlyData, dayOfWeekData } = generateTimeData();

  // 時間帯別グラフデータ
  const hourlyChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}時`),
    datasets: [
      {
        label: '投稿数',
        data: hourlyData,
        backgroundColor: (ctx: any) => {
          const hour = ctx.dataIndex;
          if (hour >= 6 && hour < 12) return '#FDE047'; // 朝: 黄色
          if (hour >= 12 && hour < 18) return '#FB923C'; // 昼: オレンジ
          if (hour >= 18 && hour < 22) return '#F87171'; // 夕: 赤
          return '#8B5CF6'; // 夜: 紫
        },
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  // 曜日別ポーラーエリアチャートデータ
  const dayOfWeekChartData = {
    labels: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    datasets: [
      {
        label: '投稿数',
        data: dayOfWeekData,
        backgroundColor: [
          '#EF444450', // 日曜: 赤系
          '#3B82F650', // 月曜: 青系
          '#10B98150', // 火曜: 緑系
          '#F59E0B50', // 水曜: 黄系
          '#8B5CF650', // 木曜: 紫系
          '#EC489950', // 金曜: ピンク系
          '#6B728050'  // 土曜: グレー系
        ],
        borderColor: [
          '#EF4444',
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EC4899',
          '#6B7280'
        ],
        borderWidth: 2,
      }
    ]
  };

  const hourlyOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: '時間帯別投稿パターン',
        font: {
          size: 16,
          weight: '600'
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const hour = context.dataIndex;
            const timeOfDay = 
              hour >= 6 && hour < 12 ? '朝' :
              hour >= 12 && hour < 18 ? '昼' :
              hour >= 18 && hour < 22 ? '夕方' : '夜';
            return `${timeOfDay}: ${context.parsed.y}件`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '時間帯',
          font: {
            size: 12
          }
        },
        grid: {
          display: false
        },
        ticks: {
          callback: function(value) {
            const hour = parseInt(value.toString());
            return hour % 4 === 0 ? `${hour}時` : '';
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '投稿数',
          font: {
            size: 12
          }
        },
        beginAtZero: true,
        grid: {
          color: '#E5E7EB'
        }
      }
    }
  };

  const dayOfWeekOptions: ChartOptions<'polarArea'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: '曜日別投稿パターン',
        font: {
          size: 16,
          weight: '600'
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.r}件`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: '#E5E7EB'
        },
        ticks: {
          display: false
        }
      }
    }
  };

  const getMostActiveTime = () => {
    const maxHour = hourlyData.indexOf(Math.max(...hourlyData));
    const maxDay = dayOfWeekData.indexOf(Math.max(...dayOfWeekData));
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    
    return {
      hour: maxHour,
      day: dayNames[maxDay],
      hourCount: hourlyData[maxHour],
      dayCount: dayOfWeekData[maxDay]
    };
  };

  const getTimePattern = () => {
    const morning = hourlyData.slice(6, 12).reduce((a, b) => a + b, 0);
    const afternoon = hourlyData.slice(12, 18).reduce((a, b) => a + b, 0);
    const evening = hourlyData.slice(18, 22).reduce((a, b) => a + b, 0);
    const night = [...hourlyData.slice(22), ...hourlyData.slice(0, 6)].reduce((a, b) => a + b, 0);
    
    const total = morning + afternoon + evening + night;
    if (total === 0) return { type: 'データなし', percentage: 0 };
    
    const patterns = [
      { type: '朝型', value: morning, color: 'text-yellow-600' },
      { type: '昼型', value: afternoon, color: 'text-orange-600' },
      { type: '夕方型', value: evening, color: 'text-red-600' },
      { type: '夜型', value: night, color: 'text-purple-600' }
    ];
    
    const dominant = patterns.reduce((max, current) => 
      current.value > max.value ? current : max
    );
    
    return {
      type: dominant.type,
      percentage: Math.round((dominant.value / total) * 100),
      color: dominant.color
    };
  };

  if (posts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">投稿時間パターン分析</h3>
        <div className="text-center text-gray-500 py-8">
          投稿データがありません
        </div>
      </div>
    );
  }

  const mostActive = getMostActiveTime();
  const timePattern = getTimePattern();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">投稿時間パターン分析</h3>
        
        {/* インサイト表示 */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">あなたの投稿パターン</h4>
            <p className="text-sm text-gray-600">
              最も活発な時間帯: <span className="font-semibold text-blue-600">{mostActive.hour}時台</span> ({mostActive.hourCount}件)
            </p>
            <p className="text-sm text-gray-600">
              最も活発な曜日: <span className="font-semibold text-blue-600">{mostActive.day}曜日</span> ({mostActive.dayCount}件)
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">ライフスタイル分析</h4>
            <p className="text-sm text-gray-600">
              あなたは <span className={`font-semibold ${timePattern.color}`}>{timePattern.type}人間</span> です
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {timePattern.percentage}%の投稿がこの時間帯に集中
            </p>
          </div>
        </div>
      </div>

      {/* チャート表示 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-80">
          {isReady ? (
            <Bar 
              data={hourlyChartData} 
              options={hourlyOptions}
              key={`bar-${chartKey}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">チャートを読み込み中...</div>
            </div>
          )}
        </div>
        
        <div className="h-80">
          {isReady ? (
            <PolarArea 
              data={dayOfWeekChartData} 
              options={dayOfWeekOptions}
              key={`polar-${chartKey}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">チャートを読み込み中...</div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>投稿時間の分析により、あなたの活動パターンやライフスタイルの傾向を表示しています。</p>
      </div>
    </div>
  );
};
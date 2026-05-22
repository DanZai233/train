import { useMemo } from 'react';
import { WorkoutRecord, UserSettings } from '../types';
import { subDays, format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const INTENSITY_MAP: Record<string, number> = {
  '低 (放松)': 1,
  '中等 (微微出汗)': 2,
  '高 (大汗淋漓)': 3,
  '极限 (耗尽全力)': 4
};

interface TrendsTabProps {
  records: WorkoutRecord[];
  settings: UserSettings;
}

export function TrendsTab({ records, settings }: TrendsTabProps) {
  const chartData = useMemo(() => {
    const data = [];
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date);
      const end = endOfDay(date);
      
      const dayRecords = records.filter(r => 
        r.recordType !== 'rest' && isWithinInterval(r.timestamp, { start, end })
      );
      
      const totalMins = dayRecords.reduce((acc, r) => acc + r.durationMins, 0);
      
      let intensityScore = null;
      if (dayRecords.length > 0) {
        const scores = dayRecords.filter(r => r.intensity).map(r => INTENSITY_MAP[r.intensity!] || 0);
        if (scores.length > 0) {
          intensityScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
        }
      }
      
      data.push({
        name: format(date, 'MM/dd'),
        mins: totalMins,
        intensity: intensityScore
      });
    }
    return data;
  }, [records]);

  const totalMins7Days = chartData.reduce((acc, day) => acc + day.mins, 0);

  const formatIntensityTooltip = (value: number) => {
    if (value >= 3.5) return ['极限', '平均强度'];
    if (value >= 2.5) return ['高', '平均强度'];
    if (value >= 1.5) return ['中等', '平均强度'];
    return ['低', '平均强度'];
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-6 pb-20">
      <h2 className="text-2xl font-black text-text-main mb-6 px-1">运动趋势</h2>
      
      <div className="bg-card-bg p-6 rounded-[2rem] shadow-sm border border-brand-light mb-6">
        <h3 className="text-sm font-bold text-text-muted mb-1">过去 7 天总时长</h3>
        <p className="text-4xl font-black text-brand-main mb-6">{totalMins7Days} <span className="text-lg font-medium text-text-muted">分钟</span></p>
        
        <div className="h-48 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--brand-light)" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 600 }}
              />
              <Tooltip 
                cursor={{ fill: 'var(--brand-light)', opacity: 0.5 }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                formatter={(value: number) => [`${value} 分钟`, '时长']}
              />
              <ReferenceLine y={settings.dailyGoalMins} stroke="var(--brand-main)" strokeDasharray="3 3" opacity={0.5} />
              <Bar dataKey="mins" fill="var(--brand-main)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card-bg p-6 rounded-[2rem] shadow-sm border border-brand-light mb-6">
        <h3 className="text-sm font-bold text-text-muted mb-6">过去 7 天平均强度</h3>
        
        <div className="h-40 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--brand-light)" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                domain={[0, 4]}
                ticks={[1, 2, 3, 4]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 600 }}
                tickFormatter={(val) => {
                  if (val === 1) return '低';
                  if (val === 2) return '中等';
                  if (val === 3) return '高';
                  if (val === 4) return '极限';
                  return '';
                }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                formatter={(value: number) => formatIntensityTooltip(value)}
              />
              <Line 
                type="monotone" 
                dataKey="intensity" 
                stroke="var(--brand-dark)" 
                strokeWidth={3} 
                dot={{ r: 4, fill: 'var(--brand-main)', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--brand-dark)' }}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-brand-main/5 p-6 rounded-[2rem] border border-brand-main/10 flex flex-col justify-center items-center text-center">
        <p className="text-sm font-bold text-text-muted mb-1">坚持就是胜利</p>
        <p className="text-base font-black text-brand-dark">只要坚持练，汗水就不会白流！</p>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { WorkoutRecord, UserSettings } from '../types';
import { subDays, format, startOfDay, endOfDay, isWithinInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, getDate } from 'date-fns';
import { zhCN } from 'date-fns/locale';
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
  const [selectedDay, setSelectedDay] = useState<any>(null);

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

  const calendarData = useMemo(() => {
    const data = [];
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    for (const date of days) {
      const start = startOfDay(date);
      const end = endOfDay(date);
      
      const dayRecords = records.filter(r => 
        isWithinInterval(r.timestamp, { start, end })
      );
      
      const totalMins = dayRecords.filter(r => r.recordType !== 'rest').reduce((acc, r) => acc + r.durationMins, 0);
      const isRest = dayRecords.some(r => r.recordType === 'rest');
      
      data.push({
        date,
        day: getDate(date),
        totalMins,
        isRest,
        records: dayRecords,
        isCurrentMonth: isSameMonth(date, today),
        isToday: isToday(date)
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

  const getHeatmapStyle = (mins: number, isRest: boolean) => {
    if (mins === 0 && isRest) {
      return { border: '2px solid var(--brand-main)', backgroundColor: 'transparent', color: 'var(--text-main)' };
    }
    if (mins === 0) {
      return { backgroundColor: 'var(--brand-light)', color: 'var(--text-muted)' };
    }
    
    let opacity = 0.4;
    if (mins >= 60) opacity = 1;
    else if (mins >= 30) opacity = 0.8;
    else if (mins >= 15) opacity = 0.6;
    
    return { backgroundColor: `color-mix(in srgb, var(--brand-main) ${opacity * 100}%, transparent)`, color: 'white' };
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-6 pb-20">
      <h2 className="text-2xl font-black text-text-main mb-6 px-1">运动趋势</h2>
      
      <div className="bg-card-bg p-6 rounded-[2rem] shadow-sm border border-brand-light mb-6">
        <h3 className="text-sm font-bold text-text-muted mb-6">本月活跃度图谱</h3>
        
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-black text-text-muted">
          <div>一</div>
          <div>二</div>
          <div>三</div>
          <div>四</div>
          <div>五</div>
          <div>六</div>
          <div>日</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarData.map((day, i) => (
            <div 
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`aspect-square rounded-xl cursor-pointer flex justify-center items-center text-xs font-bold transition-all hover:scale-110 active:scale-95 
                ${selectedDay?.date.getTime() === day.date.getTime() ? 'ring-2 ring-brand-main ring-offset-2 ring-offset-card-bg scale-110 z-10 relative shadow-md' : ''}
                ${!day.isCurrentMonth ? 'opacity-30' : ''}`}
              style={getHeatmapStyle(day.totalMins, day.isRest)}
              title={`${format(day.date, 'MM/dd')} - ${day.totalMins} 分钟`}
            >
              <span className={`${day.isToday ? 'bg-text-main text-app-bg px-1.5 py-0.5 rounded-md shadow-sm' : ''}`}>
                {day.day}
              </span>
            </div>
          ))}
        </div>

        {selectedDay && (
          <div className="mt-6 p-4 bg-app-bg rounded-2xl border border-brand-light animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-text-main">{format(selectedDay.date, 'M月d日')}</h4>
              <span className="text-xs font-black text-brand-main bg-brand-main/10 px-2 py-1 rounded-md">
                {selectedDay.totalMins > 0 ? `共 ${selectedDay.totalMins} 分钟` : (selectedDay.isRest ? '休息日' : '无记录')}
              </span>
            </div>
            
            {selectedDay.records.length > 0 ? (
              <div className="space-y-2">
                {selectedDay.records.map((r: any) => (
                  <div key={r.id} className="flex justify-between items-center text-sm p-3 bg-brand-light/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-main">{r.type}</span>
                      {r.intensity && <span className="text-[10px] font-bold text-text-muted bg-white/70 px-2 py-0.5 rounded-full">{r.intensity.split(' ')[0]}</span>}
                      {r.mood && <span className="text-[10px] font-bold text-text-muted bg-white/70 px-2 py-0.5 rounded-full">{r.mood.split(' ')[0]}</span>}
                    </div>
                    <span className="font-bold text-text-muted text-xs">
                      {r.recordType === 'rest' ? '休息' : `${r.durationMins}分`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-text-muted text-center py-4 bg-brand-light/20 rounded-xl">这天没有留下记录哦</p>
            )}
          </div>
        )}
      </div>

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

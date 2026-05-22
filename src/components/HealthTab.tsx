import { WorkoutRecord, UserSettings } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Activity, Flame, ShieldCheck, Dumbbell, History, Medal, Trophy, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface HealthTabProps {
  records: WorkoutRecord[];
  settings: UserSettings;
}

export function HealthTab({ records, settings }: HealthTabProps) {
  const workoutRecords = records.filter(r => r.recordType !== 'rest');
  const totalMins = workoutRecords.reduce((acc, r) => {
    let raw = r.durationMins ?? (r as any).duration ?? (r as any).time ?? (r as any).mins;
    let mins = typeof raw === 'number' ? raw : parseInt(raw as any, 10);
    if (Number.isNaN(mins) || !mins) mins = 0;
    return acc + mins;
  }, 0);
  const totalWorkouts = workoutRecords.length;

  const getFavoriteType = () => {
    if (workoutRecords.length === 0) return '无';
    const typeCounts: Record<string, number> = {};
    workoutRecords.forEach(r => {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });
    return Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b);
  };

  const caloriesApprox = Math.round(totalMins * 8); // ~8 calories per minute average

  const achievements = [
    { id: 'first_blood', name: '新手上路', desc: '完成第 1 次训练', icon: <Star size={24} />, unlocked: totalWorkouts >= 1 },
    { id: 'apprentice', name: '渐入佳境', desc: '累计完成 10 次训练', icon: <Medal size={24} />, unlocked: totalWorkouts >= 10 },
    { id: 'veteran', name: '百炼成钢', desc: '累计完成 50 次训练', icon: <ShieldCheck size={24} />, unlocked: totalWorkouts >= 50 },
    { id: 'marathon', name: '汗水狂魔', desc: '累计训练时长超过 1000 分钟', icon: <Flame size={24} />, unlocked: totalMins >= 1000 },
    { id: 'champion', name: '健身宗师', desc: '累计消耗万卡', icon: <Trophy size={24} />, unlocked: caloriesApprox >= 10000 },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-6 pb-20">
      <h2 className="text-2xl font-black text-text-main mb-6 px-1">体能状态</h2>

      <div className="bg-brand-dark p-6 rounded-[2rem] text-white shadow-xl shadow-brand-dark/20 mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Dumbbell size={160} />
        </div>
        <h3 className="text-sm font-bold text-white/70 mb-1 relative z-10">累计消耗估算 (千卡)</h3>
        <p className="text-5xl font-black mb-4 relative z-10 flex items-baseline gap-1">
          {caloriesApprox > 0 ? caloriesApprox : 0}
          <Flame size={32} className="text-orange-400" />
        </p>
        <p className="text-sm font-medium text-white/80 relative z-10">
          相当于燃烧了约 {Math.round((caloriesApprox > 0 ? caloriesApprox : 0) / 7700 * 10) / 10} 公斤纯脂肪！
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard icon={<History size={24} />} value={totalWorkouts} unit="次" label="累计训练" />
        <StatCard icon={<Activity size={24} />} value={totalMins} unit="分" label="累计时长" />
      </div>

      <div className="bg-card-bg p-6 rounded-[2rem] border border-brand-light shadow-sm mb-6">
        <h3 className="text-base font-black text-text-main mb-4 flex items-center gap-2">
          <ShieldCheck size={20} className="text-brand-main" /> 最爱项目
        </h3>
        <div className="text-2xl font-black text-brand-dark">
          {getFavoriteType()}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-black text-text-main mb-4 px-1">荣誉徽章</h3>
        <div className="grid grid-cols-1 gap-3">
          {achievements.map((ach) => (
            <motion.div 
              key={ach.id} 
              className={`flex items-center p-4 rounded-2xl border ${ach.unlocked ? 'bg-card-bg border-brand-main/30 shadow-sm' : 'bg-app-bg border-brand-light opacity-60 grayscale'}`}
              whileHover={ach.unlocked ? { scale: 1.02 } : {}}
            >
              <div className={`p-3 rounded-xl mr-4 ${ach.unlocked ? 'bg-brand-main/10 text-brand-main' : 'bg-brand-light text-text-muted'}`}>
                {ach.icon}
              </div>
              <div className="flex-1">
                <p className={`font-black ${ach.unlocked ? 'text-text-main' : 'text-text-muted'}`}>{ach.name}</p>
                <p className="text-xs font-bold text-text-muted mt-1">{ach.desc}</p>
              </div>
              {ach.unlocked && (
                 <div className="text-xs font-black text-brand-main bg-brand-main/10 px-2 py-1 rounded-md">
                   已解锁
                 </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, unit, label }: { icon: React.ReactNode, value: number, unit: string, label: string }) {
  return (
    <div className="bg-card-bg p-5 rounded-3xl border border-brand-light flex flex-col items-start shadow-sm">
      <div className="text-brand-main mb-3 bg-brand-light p-2 rounded-xl">{icon}</div>
      <p className="text-2xl font-black text-text-main shrink-0 leading-none mb-1">
        {value} <span className="text-sm font-bold text-text-muted ml-0.5">{unit}</span>
      </p>
      <p className="text-xs font-bold text-text-muted">{label}</p>
    </div>
  );
}

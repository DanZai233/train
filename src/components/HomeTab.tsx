import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkoutRecord, UserSettings } from '../types';
import { isSameDay, formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Dumbbell, Activity, Calendar, Zap, Play, Target, Sparkles, X, Trash2 } from 'lucide-react';

// WORKOUT_TYPES computed dynamically based on settings
const MOODS = ['😌 轻松', '🥵 疲惫', '💪 充满力量', '🎯 专注', '😊 愉快'];
const INTENSITIES = ['低 (放松)', '中等 (微微出汗)', '高 (大汗淋漓)', '极限 (耗尽全力)'];

interface HomeTabProps {
  records: WorkoutRecord[];
  settings: UserSettings;
  onAddRecord: (durationMins: number, type: string, mood?: string, intensity?: string, recordType?: 'workout' | 'rest') => void;
  onDeleteRecord: (id: string) => void;
}

export function HomeTab({ records, settings, onAddRecord, onDeleteRecord }: HomeTabProps) {
  const currentWorkoutTypes = useMemo(() => {
    let types = ['跑步', '骑行'];
    if (settings.locationPreference === 'gym') {
      if (settings.equipmentPreference === 'equipment') {
        types = ['力量训练', '固定器械', '哑铃/杠铃', '椭圆机', '划船机', ...types];
      } else {
        types = ['自重训练', '有氧操', '瑜伽', '动感单车', ...types];
      }
    } else if (settings.locationPreference === 'home') {
      if (settings.equipmentPreference === 'equipment') {
        types = ['哑铃/壶铃', '阻力带', '动感单车', '跑步机', '健身环', ...types];
      } else {
        types = ['徒手健身', 'HIIT', '瑜伽', '跳绳', '核心训练', ...types];
      }
    } else { // outdoor
      if (settings.equipmentPreference === 'equipment') {
        types = ['户外骑行', '越野跑', '飞盘', '羽毛球', '网球', ...types];
      } else {
        types = ['长跑', '散步', '爬坡', '户外徒手', '太极', ...types];
      }
    }
    return [...new Set([...types, '其他'])];
  }, [settings.locationPreference, settings.equipmentPreference]);

  const [showInput, setShowInput] = useState(false);
  const [showResistAnim, setShowResistAnim] = useState(false);
  
  const [workoutType, setWorkoutType] = useState(currentWorkoutTypes[0]);
  const [duration, setDuration] = useState(30);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [selectedIntensity, setSelectedIntensity] = useState(INTENSITIES[1]);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [shareToSquare, setShareToSquare] = useState(true);

  useEffect(() => {
    if (!currentWorkoutTypes.includes(workoutType)) {
      setWorkoutType(currentWorkoutTypes[0]);
    }
  }, [currentWorkoutTypes, workoutType]);

  const todayRecords = records.filter(r => isSameDay(r.timestamp, new Date()));
  const todayWorkoutRecords = todayRecords.filter(r => r.recordType !== 'rest');
  const todayMins = todayWorkoutRecords.reduce((acc, r) => acc + r.durationMins, 0);
  const restCount = todayRecords.filter(r => r.recordType === 'rest').length;
  
  const lastRecord = records.length > 0 ? records[records.length - 1] : null;
  const timeSinceLast = lastRecord 
    ? formatDistanceToNow(lastRecord.timestamp, { locale: zhCN, addSuffix: true }) 
    : '很久以前';

  const progress = Math.min((todayMins / settings.dailyGoalMins) * 100, 100);
  const isOverGoal = todayMins >= settings.dailyGoalMins;

  const sharePost = async (postData: any) => {
    if (!shareToSquare) return;
    try {
      await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: settings.username || '神秘健身者',
          ...postData,
          timestamp: Date.now()
        })
      });
    } catch (e) {
      console.error('Failed to share to square', e);
    }
  };

  const handleRecord = () => {
    onAddRecord(duration, workoutType, selectedMood, selectedIntensity, 'workout');
    sharePost({
      recordType: 'workout',
      type: workoutType,
      durationMins: duration,
      mood: selectedMood,
      intensity: selectedIntensity,
      content: `完成了 ${duration} 分钟的${workoutType}！感觉${selectedMood.split(' ')[1] || '不错'}。`
    });
    setShowInput(false);
    setDuration(30);
    setSelectedMood(MOODS[0]);
    setSelectedIntensity(INTENSITIES[1]);
  };

  const handleRest = () => {
    onAddRecord(0, '休息日', undefined, undefined, 'rest');
    sharePost({
      recordType: 'rest',
      type: '休息日',
      durationMins: 0,
      content: '今天选择休息，是为了走得更远！'
    });
    setShowResistAnim(true);
    setTimeout(() => setShowResistAnim(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6 space-y-8 max-w-lg mx-auto w-full pb-20 relative">
      
      {/* Header Info */}
      <div className="text-center space-y-2 z-10 mt-2">
        <h2 className="text-xl font-bold text-text-main">今日运动量</h2>
        <div className="text-5xl font-black flex items-baseline justify-center">
          <span className={isOverGoal ? 'text-brand-main' : 'text-text-main'}>{todayMins}</span>
          <span className="text-2xl text-text-muted font-medium ml-1">/ {settings.dailyGoalMins} 分钟</span>
        </div>
        {restCount > 0 && (
          <div className="mt-2 inline-block bg-brand-main/10 text-brand-main px-3 py-1 rounded-full text-xs font-bold">
            💆 今天已安排 {restCount} 次休息
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-8 bg-brand-light rounded-full overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`absolute top-0 left-0 h-full rounded-full transition-colors ${
            isOverGoal ? 'bg-brand-main' : 'bg-brand-main/80'
          }`}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold mix-blend-difference text-white">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Action Button */}
      <div className="flex flex-col items-center justify-center py-6 relative">
        <AnimatePresence mode="wait">
          {!showInput ? (
            <motion.div
              key="btn"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-8 w-full mt-4"
            >
              <div className="relative">
                  <AnimatePresence>
                      {showResistAnim && (
                          <motion.div
                             initial={{ opacity: 0, y: 0, scale: 0.5 }}
                             animate={{ opacity: 1, y: -80, scale: 1.2 }}
                             exit={{ opacity: 0 }}
                             className="absolute left-1/2 -ml-16 top-0 w-32 text-center text-brand-main font-black text-xl z-50 drop-shadow-md pointer-events-none whitespace-nowrap"
                          >
                             +1 恢复力
                          </motion.div>
                      )}
                  </AnimatePresence>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowInput(true)}
                    className="w-56 h-56 rounded-full bg-gradient-to-tr from-brand-dark to-brand-main text-white shadow-2xl flex flex-col items-center justify-center space-y-4 shadow-brand-dark/30 relative z-10"
                  >
                    <Play fill="white" size={64} className="drop-shadow-md ml-2 text-white outline-white stroke-white" />
                    <span className="text-3xl font-black tracking-widest text-white">练了</span>
                  </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRest}
                className="px-8 py-3.5 rounded-full bg-brand-light/50 border-2 border-brand-main/20 text-brand-main font-bold shadow-sm flex items-center space-x-2 active:bg-brand-main/10 transition-colors"
              >
                <Zap size={20} />
                <span>今天休息，让肌肉生长吧！</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card-bg p-6 rounded-[2rem] shadow-2xl w-full border border-brand-light flex flex-col items-center z-20"
            >
              <div className="flex justify-between w-full items-center mb-6">
                 <h3 className="text-xl font-black text-text-main">记录训练</h3>
                 <button onClick={() => setShowInput(false)} className="bg-brand-light p-2 rounded-full text-text-muted hover:text-text-main"><X size={20}/></button>
              </div>

              <div className="w-full mb-6">
                <p className="text-sm font-bold text-text-muted mb-3 px-1">项目</p>
                <div className="flex flex-wrap gap-2">
                  {currentWorkoutTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setWorkoutType(type)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                        workoutType === type
                          ? 'border-brand-main bg-brand-main text-white shadow-md'
                          : 'border-brand-light bg-brand-light text-text-muted hover:bg-brand-light/70'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full mb-6">
                <p className="text-sm font-bold text-text-muted mb-3 px-1">时长 (分钟)</p>
                <div className="flex items-center space-x-6 justify-center">
                  <button 
                    onClick={() => setDuration(Math.max(5, duration - 5))}
                    className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center text-3xl font-bold text-text-main hover:bg-black/5 active:scale-95 transition-transform"
                  >-</button>
                  <span className="text-5xl font-black text-text-main w-20 text-center">{duration}</span>
                  <button 
                    onClick={() => setDuration(duration + 5)}
                    className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center text-3xl font-bold text-text-main hover:bg-black/5 active:scale-95 transition-transform"
                  >+</button>
                </div>
              </div>

              <div className="w-full mb-6">
                <p className="text-sm font-bold text-text-muted mb-3 px-1">强度</p>
                <div className="flex flex-wrap gap-2">
                  {INTENSITIES.map(i => (
                    <button
                      key={i}
                      onClick={() => setSelectedIntensity(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        selectedIntensity === i 
                          ? 'border-brand-main bg-brand-main/10 text-brand-main' 
                          : 'border-transparent bg-brand-light text-text-muted hover:bg-brand-light/70'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full mb-8">
                <p className="text-sm font-bold text-text-muted mb-3 px-1">感觉</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setSelectedMood(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        selectedMood === m 
                          ? 'border-brand-main bg-brand-main/10 text-brand-main' 
                          : 'border-transparent bg-brand-light text-text-muted hover:bg-brand-light/70'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex w-full mt-auto flex-col space-y-4">
                <label className="flex items-center space-x-3 bg-app-bg px-4 py-3 rounded-xl border border-brand-light cursor-pointer select-none">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${shareToSquare ? 'bg-brand-main border-brand-main' : 'bg-transparent border-brand-light'}`}>
                    {shareToSquare && <span className="w-2.5 h-2.5 bg-white rounded-sm"></span>}
                  </div>
                  <span className="text-sm font-bold text-text-main flex-1">分享到锻炼广场</span>
                  <input 
                    type="checkbox"
                    className="hidden"
                    checked={shareToSquare}
                    onChange={(e) => setShareToSquare(e.target.checked)}
                  />
                </label>
                <button 
                  onClick={handleRecord}
                  className="w-full py-4 rounded-2xl bg-brand-dark text-white text-lg font-black active:scale-[0.98] transition-transform shadow-lg shadow-brand-dark/30"
                >保存记录</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-brand-main/5 border border-brand-main/10 p-5 rounded-3xl flex flex-col items-center justify-center text-center space-y-2">
          <Calendar size={28} className="text-brand-main mb-1" />
          <p className="text-xs text-text-muted font-bold opacity-80">上次运动</p>
          <p className="text-sm font-black text-brand-dark">{timeSinceLast}</p>
        </div>
        <div className="bg-brand-main/5 border border-brand-main/10 p-5 rounded-3xl flex flex-col items-center justify-center text-center space-y-2">
          <Target size={28} className="text-brand-main mb-1" />
          <p className="text-xs text-text-muted font-bold opacity-80">距离目标</p>
          <p className="text-sm font-black text-brand-dark">
            {isOverGoal ? '已达标' : `差 ${settings.dailyGoalMins - todayMins} 分钟`}
          </p>
        </div>
      </div>

      {/* Today's Timeline */}
      {todayRecords.length > 0 && (
        <div className="mt-6 pb-4">
          <h4 className="text-base font-black text-text-main mb-4 px-1">今日流水账</h4>
          <div className="space-y-3 relative">
            <AnimatePresence mode="popLayout" initial={false}>
              {[...todayRecords]
                .sort((a,b) => b.timestamp - a.timestamp)
                .slice(0, isTimelineExpanded ? undefined : 5)
                .map(r => (
                <motion.div
                  key={r.id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)', transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, opacity: { duration: 0.2 } }}
                  className={`flex items-center justify-between p-4 rounded-[1.5rem] border shadow-sm ${r.recordType === 'rest' ? 'bg-brand-main/5 border-brand-main/20' : 'bg-card-bg border-brand-light'}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl ${r.recordType === 'rest' ? 'bg-brand-main/10 text-brand-main' : 'bg-brand-light text-brand-main'}`}>
                       {r.recordType === 'rest' ? <Zap size={24} /> : <Dumbbell size={24} />}
                    </div>
                    <div>
                      <p className={`text-base font-black ${r.recordType === 'rest' ? 'text-brand-main' : 'text-text-main'}`}>
                        {r.recordType === 'rest' ? '安排了休息' : `${r.type} ${r.durationMins} 分`}
                      </p>
                      {(r.mood || r.intensity) && r.recordType !== 'rest' && (
                        <p className="text-xs text-text-muted mt-1 font-bold">
                          {r.intensity} · {r.mood}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <span className="text-[11px] text-text-muted font-black tracking-wider bg-app-bg px-2 py-1 rounded-md border border-brand-light mb-2">
                      {format(r.timestamp, 'HH:mm')}
                    </span>
                    <button 
                      onClick={() => { if(confirm('确定要删除这条记录吗？')) onDeleteRecord(r.id); }}
                      className="text-text-muted/40 hover:text-red-500 bg-brand-light/50 hover:bg-red-50 p-1.5 rounded-lg active:scale-95 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {todayRecords.length > 5 && !isTimelineExpanded && (
            <button
              onClick={() => setIsTimelineExpanded(true)}
              className="w-full mt-4 py-3 text-sm font-bold text-text-muted bg-brand-light/50 rounded-xl hover:bg-brand-light transition-colors"
            >
              展开更多 ({todayRecords.length - 5})
            </button>
          )}
          {todayRecords.length > 5 && isTimelineExpanded && (
            <button
              onClick={() => setIsTimelineExpanded(false)}
              className="w-full mt-4 py-3 text-sm font-bold text-text-muted bg-brand-light/50 rounded-xl hover:bg-brand-light transition-colors"
            >
              收起
            </button>
          )}
        </div>
      )}
    </div>
  );
}

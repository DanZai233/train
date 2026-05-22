import { useRef } from 'react';
import { UserSettings, WorkoutRecord } from '../types';
import { Settings, RefreshCw, Trash2, Palette, Goal, Weight, MapPin, Dumbbell, Download, Upload } from 'lucide-react';
import { format } from 'date-fns';

interface SettingsTabProps {
  records: WorkoutRecord[];
  settings: UserSettings;
  updateSettings: (s: Partial<UserSettings>) => void;
  resetData: () => void;
  importData: (records: WorkoutRecord[], settings: UserSettings) => void;
}

const THEMES = [
  { id: 'graphite', name: '极简黑白' },
  { id: 'matcha', name: '活力抹茶' },
  { id: 'ocean', name: '深海蓝' },
  { id: 'peach', name: '蜜桃粉' },
  { id: 'lavender', name: '薰衣草' },
];

const LOCATIONS = [
  { id: 'gym', name: '健身房' },
  { id: 'home', name: '家里' },
  { id: 'outdoor', name: '户外' }
];

const EQUIPMENTS = [
  { id: 'equipment', name: '偏器材' },
  { id: 'bodyweight', name: '偏徒手' }
];

export function SettingsTab({ records, settings, updateSettings, resetData, importData }: SettingsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (confirm('确定要清空所有记录和设置吗？此操作不可恢复。')) {
      resetData();
      alert('已清空所有数据！');
    }
  };

  const handleExport = () => {
    const data = { records, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lianleme-pro-backup-${format(new Date(), 'yyyyMMdd-HHmm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && Array.isArray(data.records) && data.settings) {
          if (confirm('导入数据将覆盖当前所有记录和设置，确定要继续吗？')) {
            importData(data.records, data.settings);
            alert('数据导入成功！');
          }
        } else {
          alert('数据格式不正确，导入失败。');
        }
      } catch (error) {
        alert('文件解析失败，请确保选择了正确的备份文件。');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-6 pb-20 space-y-6">
      <h2 className="text-2xl font-black text-text-main px-1">设置</h2>

      <div className="bg-card-bg p-6 rounded-[2rem] shadow-sm border border-brand-light space-y-6">
        <div className="flex items-center space-x-3 text-text-main mb-4 border-b border-brand-light pb-4">
          <div className="bg-brand-light p-2 rounded-xl text-brand-main">
            <Goal size={20} />
          </div>
          <h3 className="font-bold text-lg">运动目标</h3>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-text-muted">每日运动目标 (分钟)</label>
          <input
            type="number"
            min="1"
            value={settings.dailyGoalMins}
            onChange={e => updateSettings({ dailyGoalMins: parseInt(e.target.value) || 30 })}
            className="w-full bg-app-bg border border-brand-light rounded-xl px-4 py-3 font-bold text-text-main outline-none focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 transition-all"
          />
        </div>

        <div className="flex space-x-4">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-bold text-text-muted">当前体重 (kg)</label>
            <input
              type="number"
              min="1"
              value={settings.weight}
              onChange={e => updateSettings({ weight: parseFloat(e.target.value) || 70 })}
              className="w-full bg-app-bg border border-brand-light rounded-xl px-4 py-3 font-bold text-text-main outline-none focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 transition-all"
            />
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-sm font-bold text-text-muted">目标体重 (kg)</label>
            <input
              type="number"
              min="1"
              value={settings.targetWeight}
              onChange={e => updateSettings({ targetWeight: parseFloat(e.target.value) || 65 })}
              className="w-full bg-app-bg border border-brand-light rounded-xl px-4 py-3 font-bold text-text-main outline-none focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-card-bg p-6 rounded-[2rem] shadow-sm border border-brand-light space-y-6">
        <div className="flex items-center space-x-3 text-text-main mb-4 border-b border-brand-light pb-4">
          <div className="bg-brand-light p-2 rounded-xl text-brand-main">
            <MapPin size={20} />
          </div>
          <h3 className="font-bold text-lg">训练偏好</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-muted">常去场景</label>
            <div className="flex space-x-2">
              {LOCATIONS.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => updateSettings({ locationPreference: loc.id as any })}
                  className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all border ${
                    settings.locationPreference === loc.id
                      ? 'border-brand-main bg-brand-main/10 text-brand-main'
                      : 'border-brand-light bg-app-bg text-text-muted hover:bg-brand-light/50'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-text-muted">训练方式</label>
            <div className="flex space-x-2">
              {EQUIPMENTS.map(eq => (
                <button
                  key={eq.id}
                  onClick={() => updateSettings({ equipmentPreference: eq.id as any })}
                  className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all border ${
                    settings.equipmentPreference === eq.id
                      ? 'border-brand-main bg-brand-main/10 text-brand-main'
                      : 'border-brand-light bg-app-bg text-text-muted hover:bg-brand-light/50'
                  }`}
                >
                  {eq.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card-bg p-6 rounded-[2rem] shadow-sm border border-brand-light space-y-6">
        <div className="flex items-center space-x-3 text-text-main mb-4 border-b border-brand-light pb-4">
          <div className="bg-brand-light p-2 rounded-xl text-brand-main">
            <Palette size={20} />
          </div>
          <h3 className="font-bold text-lg">主题外观</h3>
        </div>

        <div className="space-y-3">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => updateSettings({ theme: theme.id as any })}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                settings.theme === theme.id 
                  ? 'border-brand-main bg-brand-main/5 font-black text-brand-main' 
                  : 'border-brand-light bg-card-bg font-bold text-text-main hover:bg-brand-light/50'
              }`}
            >
              <span>{theme.name}</span>
              {settings.theme === theme.id && <div className="w-3 h-3 rounded-full bg-brand-main" />}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card-bg p-6 rounded-[2rem] shadow-sm border border-red-100 space-y-4">
         <div className="flex items-center space-x-3 text-red-600 mb-2">
          <div className="bg-red-50 p-2 rounded-xl">
            <Trash2 size={20} />
          </div>
          <h3 className="font-bold text-lg">危险区域</h3>
        </div>
        <p className="text-sm font-medium text-text-muted">这将会清空你所有的运动记录，且不可恢复。</p>
        <button 
          onClick={handleReset}
          className="w-full py-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 active:scale-95 transition-all"
        >
          清空所有数据
        </button>
      </div>

      <div className="bg-card-bg p-6 rounded-[2rem] shadow-sm border border-brand-light space-y-4 mb-6">
        <h3 className="font-bold text-lg text-text-main border-b border-brand-light pb-2 mb-2">数据备份</h3>
        <p className="text-sm font-medium text-text-muted mb-4">导出你的运动数据以备不时之需，或者在新设备上导入。</p>
        <div className="flex space-x-3">
          <button 
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-brand-light rounded-xl text-text-main font-bold hover:bg-brand-light/50 active:scale-95 transition-all"
          >
            <Download size={18} />
            导出数据
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-brand-light rounded-xl text-text-main font-bold hover:bg-brand-light/50 active:scale-95 transition-all"
          >
            <Upload size={18} />
            导入数据
          </button>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
        </div>
      </div>

      <div className="text-center py-6">
        <p className="text-xs font-bold text-text-muted">练了么 PRO V1.0</p>
        <p className="text-[10px] font-medium text-text-muted/50 mt-1">完全离线运行 · 数据安全</p>
      </div>
    </div>
  );
}

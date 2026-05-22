import { useState, useEffect } from 'react';
import { CommunityPost } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Globe, RefreshCw, MessageSquare, Flame, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CommunityTab() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/community/posts');
      if (!res.ok) {
        throw new Error('网络请求失败');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        setError(data.error || '获取数据失败');
      }
    } catch (err: any) {
      setError(err.message || '获取数据失败，请检查网络或后端连接');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6 pb-20 bg-app-bg">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-black text-text-main flex items-center gap-2">
          <Globe className="text-brand-main" /> 锻炼广场
        </h2>
        <button 
          onClick={fetchPosts}
          disabled={loading}
          className="p-2 bg-brand-light text-brand-main rounded-xl hover:bg-brand-main/20 active:scale-95 transition-all"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex flex-col items-center justify-center text-center space-y-3">
          <AlertCircle className="text-red-400" size={32} />
          <p className="text-sm font-bold text-red-600">{error}</p>
          <p className="text-xs font-medium text-red-500/70">您可能需要配置 MONGODB_URI 环境变量</p>
          <button 
            onClick={fetchPosts}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl font-bold text-sm active:scale-95 transition-transform"
          >
            重试
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {posts.length === 0 && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-text-muted space-y-4"
              >
                <MessageSquare size={48} className="mx-auto opacity-20" />
                <p className="font-bold">广场空空如也，快去分享你的第一次锻炼吧！</p>
              </motion.div>
            )}
            
            {posts.map(post => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card-bg p-5 rounded-3xl shadow-sm border border-brand-light"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-brand-main/10 flex items-center justify-center text-brand-main font-black">
                      {post.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main text-sm">{post.username}</h4>
                      <p className="text-[10px] text-text-muted font-medium">
                        {formatDistanceToNow(post.createdAt, { locale: zhCN, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {post.recordType === 'workout' ? (
                    <div className="bg-brand-main/10 text-brand-main font-black text-xs px-2 py-1 rounded-md flex items-center gap-1">
                      <Flame size={12} /> {post.durationMins} 分钟
                    </div>
                  ) : (
                    <div className="bg-brand-main/10 text-brand-main font-black text-xs px-2 py-1 rounded-md flex items-center gap-1">
                      休息日
                    </div>
                  )}
                </div>
                
                <p className="text-sm font-medium text-text-main bg-app-bg p-3 rounded-2xl mb-3">
                  {post.content || (post.recordType === 'workout' ? `完成了 ${post.durationMins} 分钟的${post.type}！` : '今天选择休息，是为了走得更远！')}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-bold text-text-muted bg-brand-light px-2 py-1 rounded-md">
                    #{post.type}
                  </span>
                  {post.mood && (
                    <span className="text-xs font-bold text-text-muted bg-brand-light px-2 py-1 rounded-md">
                      {post.mood}
                    </span>
                  )}
                  {post.intensity && (
                    <span className="text-xs font-bold text-text-muted bg-brand-light px-2 py-1 rounded-md">
                      强度: {post.intensity}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && posts.length > 0 && (
            <div className="text-center text-text-muted text-sm font-bold animate-pulse py-4">
              刷新中...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

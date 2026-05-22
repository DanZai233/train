import { useState, useEffect } from 'react';
import { UserSettings, CommunityPost } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Globe, RefreshCw, MessageSquare, Flame, AlertCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommunityTabProps {
  settings: UserSettings;
}

export function CommunityTab({ settings }: CommunityTabProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activePostForComments, setActivePostForComments] = useState<CommunityPost | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentingId, setCommentingId] = useState<string | null>(null);

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

  const handleSubmitComment = async (postId: string) => {
    if (!newComment.trim()) return;
    
    setCommentingId(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: settings.username || '神秘健身者',
          content: newComment.trim(),
        }),
      });

      if (!res.ok) throw new Error('评论失败');
      const addedComment = await res.json();
      
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          return { ...p, comments: [...(p.comments || []), addedComment] };
        }
        return p;
      }));
      
      if (activePostForComments && activePostForComments._id === postId) {
        setActivePostForComments(prev => prev ? {
          ...prev, 
          comments: [...(prev.comments || []), addedComment]
        } : null);
      }
      
      setNewComment('');
    } catch (err: any) {
      alert(err.message || '评论失败，请重试');
    } finally {
      setCommentingId(null);
    }
  };

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

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-brand-light/50">
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
                  
                  <button 
                    onClick={() => setActivePostForComments(post)}
                    className="flex items-center gap-1.5 text-text-muted hover:text-brand-main bg-brand-light/30 hover:bg-brand-main/10 px-3 py-1.5 rounded-lg transition-colors font-bold text-sm"
                  >
                    <MessageSquare size={16} />
                    <span>{post.comments?.length || 0}</span>
                  </button>
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

      {/* Comment Drawer Overlay */}
      <AnimatePresence>
        {activePostForComments && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end"
            onClick={() => setActivePostForComments(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card-bg w-full h-[80vh] rounded-t-[2rem] flex flex-col shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-6 pb-4 border-b border-brand-light">
                <h3 className="font-black text-lg text-text-main">
                  来自 {activePostForComments.username} 的动态
                </h3>
                <button 
                  onClick={() => setActivePostForComments(null)}
                  className="p-2 bg-brand-light rounded-full text-text-muted hover:text-text-main active:scale-95 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activePostForComments.comments && activePostForComments.comments.length > 0 ? (
                  activePostForComments.comments.map(comment => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-main/10 flex items-center justify-center text-brand-main font-black shrink-0 text-sm">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 bg-app-bg p-3 rounded-2xl rounded-tl-none border border-brand-light">
                        <div className="flex justify-between items-end mb-1">
                          <span className="font-bold text-text-main text-sm">{comment.username}</span>
                          <span className="text-[10px] text-text-muted font-medium">
                            {formatDistanceToNow(comment.createdAt, { locale: zhCN, addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-text-main font-medium leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-text-muted">
                    <MessageSquare size={32} className="mx-auto opacity-20 mb-3" />
                    <p className="font-bold text-sm">还没有人评论，快来鼓励一下吧！</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-brand-light bg-card-bg/80 backdrop-blur-md pb-8">
                <div className="flex items-center space-x-2 bg-app-bg border border-brand-light rounded-2xl p-2 focus-within:border-brand-main focus-within:ring-2 focus-within:ring-brand-main/20 transition-all">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="写下鼓励的话语..."
                    className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm font-bold text-text-main"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && activePostForComments._id) {
                        handleSubmitComment(activePostForComments._id);
                      }
                    }}
                  />
                  <button
                    disabled={!newComment.trim() || commentingId === activePostForComments._id}
                    onClick={() => activePostForComments._id && handleSubmitComment(activePostForComments._id)}
                    className="p-2.5 bg-brand-main text-white rounded-xl disabled:opacity-50 disabled:active:scale-100 hover:bg-brand-dark active:scale-95 transition-all"
                  >
                    {commentingId === activePostForComments._id ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

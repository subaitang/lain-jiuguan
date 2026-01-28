
import React, { useState } from 'react';
import { AppSettings, SocialPost, SocialComment, PersonaSettings, StrangerData } from '../types';
import { NaviWindow } from './NaviWindow';
import { Heart, MessageCircle, Send, Plus, User, Trash2, RefreshCw, UserPlus } from 'lucide-react';
import { audio } from '../services/audioEngine';
import { t } from '../utils/translations';
import { generatePersonaFromInput } from '../services/geminiService';
import { generateSocialComment, generateSocialFeedRefresh } from '../services/socialEngine';

interface SocialFeedProps {
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({
    settings,
    onUpdateSettings,
    onClose,
    isMinimized,
    isMaximized,
    onMinimize,
    onMaximize
}) => {
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [processingStranger, setProcessingStranger] = useState<string | null>(null);

    const posts = settings.socialPosts || [];
    const lang = settings.user.language;

    const handleLike = (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const userId = settings.user.username;
        const alreadyLiked = post.likedBy?.includes(userId);
        
        let newLikes = post.likes;
        let newLikedBy = post.likedBy || [];

        if (alreadyLiked) {
            newLikes--;
            newLikedBy = newLikedBy.filter(id => id !== userId);
        } else {
            newLikes++;
            newLikedBy = [...newLikedBy, userId];
        }

        const updatedPosts = posts.map(p => 
            p.id === postId ? { ...p, likes: newLikes, likedBy: newLikedBy } : p
        );
        onUpdateSettings({ ...settings, socialPosts: updatedPosts });
        audio.playTypingSound(50);
    };

    const handlePost = () => {
        if (!newPostContent.trim()) return;

        const newPost: SocialPost = {
            id: Date.now().toString(),
            personaId: settings.user.username, // User posting
            content: newPostContent,
            timestamp: Date.now(),
            likes: 0,
            likedBy: [],
            comments: []
        };

        onUpdateSettings({ 
            ...settings, 
            socialPosts: [newPost, ...posts] 
        });
        setNewPostContent('');
        setIsPosting(false);
        audio.playSendSound();
    };

    const handleRefreshFeed = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        audio.playLoadTick();
        
        const newPosts = await generateSocialFeedRefresh(settings);
        
        onUpdateSettings({
            ...settings,
            socialPosts: [...newPosts, ...posts]
        });
        
        setIsRefreshing(false);
        audio.playConfirmSound();
    };

    const handleAddStranger = async (stranger: StrangerData, postId: string) => {
        if (processingStranger) return;
        setProcessingStranger(postId);
        audio.playSendSound();

        // Generate full persona
        const apiConfig = (settings.personaConfig && settings.personaConfig.apiKey) ? settings.personaConfig : settings.api;
        const prompt = `Create a persona for: ${stranger.name} (${stranger.handle}). ${stranger.prompt}`;
        
        const newPersona = await generatePersonaFromInput(prompt, apiConfig);
        
        if (newPersona) {
            // Add to library
            const updatedLibrary = [...settings.characterLibrary, newPersona];
            
            // Update the post to point to the real persona ID now
            const updatedPosts = posts.map(p => {
                if (p.id === postId) {
                    // Remove strangerData so it looks like a normal post
                    const { strangerData, ...rest } = p;
                    return { ...rest, personaId: newPersona.id };
                }
                return p;
            });

            onUpdateSettings({
                ...settings,
                characterLibrary: updatedLibrary,
                socialPosts: updatedPosts
            });
            audio.playBootSound();
        }
        
        setProcessingStranger(null);
    };

    const handleComment = async (postId: string) => {
        const text = commentInputs[postId];
        if (!text?.trim()) return;

        const updatedPosts = posts.map(p => {
            if (p.id === postId) {
                const newComment: SocialComment = {
                    id: Date.now().toString(),
                    userId: settings.user.username,
                    content: text,
                    timestamp: Date.now()
                };
                return { ...p, comments: [...(p.comments || []), newComment] };
            }
            return p;
        });
        
        onUpdateSettings({ ...settings, socialPosts: updatedPosts });
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        audio.playSendSound();

        // Simulate AI Reply to Comment (Simple)
        const post = posts.find(p => p.id === postId);
        if (post && post.personaId !== settings.user.username && !post.strangerData) {
            const authorPersona = settings.characterLibrary.find(c => c.id === post.personaId);
            if (authorPersona && settings.modules.autonomous) {
                 setTimeout(async () => {
                     const reply = await generateSocialComment(authorPersona, text, settings.user.username, settings);
                     if (reply) {
                         const replyComment: SocialComment = {
                             id: (Date.now() + 100).toString(),
                             userId: authorPersona.id,
                             content: reply,
                             timestamp: Date.now()
                         };
                         const finalPosts = updatedPosts.map(p => 
                            p.id === postId ? { ...p, comments: [...(p.comments || []), replyComment] } : p
                         );
                         onUpdateSettings({ ...settings, socialPosts: finalPosts });
                         audio.playReceiveSound();
                     }
                 }, 3000);
            }
        }
    };

    const handleDeletePost = (postId: string) => {
        if (confirm(t('social_del', lang))) {
            const updatedPosts = posts.filter(p => p.id !== postId);
            onUpdateSettings({ ...settings, socialPosts: updatedPosts });
        }
    };

    const getAvatar = (id: string, stranger?: StrangerData) => {
        if (stranger) return null; // Strangers have default placeholder for now
        if (id === settings.user.username) return settings.user.avatar;
        const p = settings.characterLibrary.find(c => c.id === id);
        return p?.avatar;
    };

    const getName = (id: string, stranger?: StrangerData) => {
        if (stranger) return stranger.name;
        if (id === settings.user.username) return settings.user.username;
        const p = settings.characterLibrary.find(c => c.id === id);
        return p?.name || "Unknown";
    };

    return (
        <NaviWindow
            title={t('social_title', lang)}
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="h-full"
        >
            <div className="flex flex-col h-full bg-black/90 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">
                
                {/* Header / Post Creator */}
                <div className="p-3 border-b border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/5">
                    {isPosting ? (
                        <div className="flex flex-col gap-2 animate-in slide-in-from-top-2">
                            <textarea 
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder={t('social_placeholder', lang)}
                                className="w-full bg-black border border-[color:var(--lain-cyan)] p-2 text-sm focus:outline-none win98-bevel-pressed resize-none h-20"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsPosting(false)} className="px-3 py-1 border border-transparent hover:text-white text-xs">{t('social_cancel', lang)}</button>
                                <button onClick={handlePost} className="px-4 py-1 bg-[color:var(--lain-cyan)] text-black font-bold win98-bevel active:win98-bevel-pressed text-xs flex items-center gap-1">
                                    <Send size={12}/> {t('social_post', lang)}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsPosting(true)}
                                className="flex-1 py-2 border border-dashed border-[color:var(--lain-cyan)]/50 hover:bg-[color:var(--lain-cyan)]/10 text-xs tracking-widest flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> {t('social_new', lang)}
                            </button>
                            <button 
                                onClick={handleRefreshFeed}
                                disabled={isRefreshing}
                                className="px-3 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors"
                                title={t('social_refresh', lang)}
                            >
                                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                    {posts.length === 0 && (
                        <div className="text-center opacity-50 py-10">{t('social_no_data', lang)}</div>
                    )}

                    {posts.map(post => {
                        const isLiked = post.likedBy?.includes(settings.user.username);
                        const isStranger = !!post.strangerData;
                        
                        return (
                            <div key={post.id} className={`border ${isStranger ? 'border-dashed border-white/30' : 'border-[color:var(--lain-cyan)]/30'} bg-black/50 p-4 relative group`}>
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div 
                                        className={`w-10 h-10 border ${isStranger ? 'border-white/50 border-dashed cursor-pointer hover:bg-white/10' : 'border-[color:var(--lain-cyan)]'} flex items-center justify-center overflow-hidden bg-black relative`}
                                        onClick={() => isStranger && post.strangerData && handleAddStranger(post.strangerData, post.id)}
                                        title={isStranger ? t('social_add_stranger', lang) : ''}
                                    >
                                        {getAvatar(post.personaId, post.strangerData) ? (
                                            <img src={getAvatar(post.personaId, post.strangerData)!} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} className={isStranger ? 'text-white/50' : 'text-[color:var(--lain-cyan)] opacity-50'} />
                                        )}
                                        
                                        {isStranger && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 transition-opacity">
                                                {processingStranger === post.id ? <RefreshCw className="animate-spin text-white" size={16}/> : <UserPlus className="text-white" size={16}/>}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-sm tracking-wide">{getName(post.personaId, post.strangerData)}</div>
                                            {post.strangerData && <span className="text-[9px] bg-white/20 px-1 rounded text-white/70">NEW</span>}
                                        </div>
                                        <div className="text-[10px] opacity-60 font-mono">
                                            {post.strangerData ? post.strangerData.handle : new Date(post.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    {!isStranger && (
                                        <button 
                                            onClick={() => handleDeletePost(post.id)}
                                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                {processingStranger === post.id ? (
                                    <div className="text-xs animate-pulse opacity-70 italic py-4">{t('social_generating_node', lang)}</div>
                                ) : (
                                    <>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4 opacity-90">{post.content}</p>
                                        {post.image && (
                                            <div className="mb-4 border border-[color:var(--lain-cyan)]/20">
                                                <img src={post.image} className="w-full max-h-60 object-cover" />
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Actions (Only for non-strangers or if user added them) */}
                                {!isStranger && (
                                    <>
                                        <div className="flex items-center gap-6 text-xs opacity-70 border-t border-[color:var(--lain-cyan)]/20 pt-2 mb-3">
                                            <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 hover:text-white transition-colors">
                                                <Heart size={14} className={isLiked ? "fill-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)]" : ""} />
                                                <span>{post.likes}</span>
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <MessageCircle size={14} />
                                                <span>{(post.comments || []).length}</span>
                                            </div>
                                            
                                            {post.likedBy && post.likedBy.length > 0 && (
                                                <div className="ml-auto text-[9px] opacity-60">
                                                    {t('social_liked_by', lang)}: {post.likedBy.length > 3 ? `${post.likedBy.length} users` : post.likedBy.map(id => getName(id)).join(', ')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Comments Section */}
                                        <div className="bg-black/30 border-t border-[color:var(--lain-cyan)]/10 pt-2">
                                            <div className="space-y-2 mb-2">
                                                {(post.comments || []).map(comment => (
                                                    <div key={comment.id} className="text-xs flex gap-2">
                                                        <span className="font-bold opacity-80 shrink-0">{getName(comment.userId)}:</span>
                                                        <span className="opacity-60">{comment.content}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input 
                                                    value={commentInputs[post.id] || ''}
                                                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                                                    placeholder={t('social_comment', lang)}
                                                    className="flex-1 bg-black border border-[color:var(--lain-cyan)]/30 text-xs p-1 focus:outline-none focus:border-[color:var(--lain-cyan)]"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                                                />
                                                <button onClick={() => handleComment(post.id)} className="p-1 hover:text-white"><Send size={12}/></button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </NaviWindow>
    );
};

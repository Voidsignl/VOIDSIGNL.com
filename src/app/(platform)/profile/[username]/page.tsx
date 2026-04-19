'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { getLevelFromXP, getXPProgress } from '@/types'
import type { Profile, Post, Clip, Game, UserGame } from '@/types'
import Link from 'next/link'
import {
  User, Edit3, Save, X, Heart, MessageCircle, Eye, Film, Trophy,
  Newspaper, Users, UserPlus, UserCheck, UserX, Shield, Star,
  Calendar, Gamepad2, Monitor, Clock, ChevronDown, ExternalLink,
  Settings, Globe, Lock, Play
} from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'

type ProfileTab = 'posts' | 'clips' | 'games'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const username = params.username as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isOwn, setIsOwn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Stats
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [postCount, setPostCount] = useState(0)
  const [clipCount, setClipCount] = useState(0)

  // Social state
  const [isFollowing, setIsFollowing] = useState(false)
  const [buddyStatus, setBuddyStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none')

  // Content tabs
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [clips, setClips] = useState<Clip[]>([])
  const [userGames, setUserGames] = useState<(UserGame & { game: Game })[]>([])
  const [loadingContent, setLoadingContent] = useState(false)

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editAvailability, setEditAvailability] = useState('')
  const [editGamertags, setEditGamertags] = useState<Record<string, string>>({})
  const [editSocials, setEditSocials] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  
  // Personalization
  const [editAccentColor, setEditAccentColor] = useState('#6B3FE0')
  const [editNameColor, setEditNameColor] = useState('')
  const [editProfileTheme, setEditProfileTheme] = useState('default')
  const [editBioFont, setEditBioFont] = useState('default')
  const [editShowXpBar, setEditShowXpBar] = useState(true)
  const [editProfileEffect, setEditProfileEffect] = useState('none')

  useEffect(() => {
    loadProfile()
  }, [username])

  useEffect(() => {
    if (profile) loadTabContent()
  }, [activeTab, profile])

  async function loadProfile() {
    setLoading(true)
    setNotFound(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !profileData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const p = profileData as Profile
    setProfile(p)
    setIsOwn(user?.id === p.id)

    // Load stats
    const [followers, following, pCount, cCount] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', p.id),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', p.id),
      supabase.from('clips').select('*', { count: 'exact', head: true }).eq('user_id', p.id),
    ])
    setFollowerCount(followers.count || 0)
    setFollowingCount(following.count || 0)
    setPostCount(pCount.count || 0)
    setClipCount(cCount.count || 0)

    // Load social state for other users
    if (user && user.id !== p.id) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', p.id)
        .maybeSingle()
      setIsFollowing(!!followData)

      const { data: buddySent } = await supabase
        .from('buddy_requests')
        .select('status')
        .eq('sender_id', user.id)
        .eq('receiver_id', p.id)
        .maybeSingle()

      const { data: buddyReceived } = await supabase
        .from('buddy_requests')
        .select('status')
        .eq('sender_id', p.id)
        .eq('receiver_id', user.id)
        .maybeSingle()

      if (buddySent?.status === 'accepted' || buddyReceived?.status === 'accepted') {
        setBuddyStatus('accepted')
      } else if (buddySent?.status === 'pending') {
        setBuddyStatus('pending_sent')
      } else if (buddyReceived?.status === 'pending') {
        setBuddyStatus('pending_received')
      } else {
        setBuddyStatus('none')
      }
    }

    // Load games
    const { data: gamesData } = await supabase
      .from('user_games')
      .select('*, game:games(*)')
      .eq('user_id', p.id)
      .order('is_main', { ascending: false })
    if (gamesData) setUserGames(gamesData as any)

    setLoading(false)
  }

  async function loadTabContent() {
    if (!profile) return
    setLoadingContent(true)

    if (activeTab === 'posts') {
      const { data } = await supabase
        .from('posts')
        .select('*, profile:profiles(*), game:games(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setPosts(data as unknown as Post[])
    } else if (activeTab === 'clips') {
      const { data } = await supabase
        .from('clips')
        .select('*, profile:profiles(*), game:games(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setClips(data as unknown as Clip[])
    }

    setLoadingContent(false)
  }

  async function toggleFollow() {
    if (!currentUserId || !profile) return
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', profile.id)
      setIsFollowing(false)
      setFollowerCount(prev => prev - 1)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profile.id })
      setIsFollowing(true)
      setFollowerCount(prev => prev + 1)
    }
  }

  async function sendBuddyRequest() {
    if (!currentUserId || !profile) return
    const { error } = await supabase.from('buddy_requests').insert({ sender_id: currentUserId, receiver_id: profile.id })
    if (error) {
      console.error('Buddy request error:', error)
      return
    }
    setBuddyStatus('pending_sent')
  }

  async function acceptBuddyRequest() {
    if (!currentUserId || !profile) return
    const { error } = await supabase
      .from('buddy_requests')
      .update({ status: 'accepted' })
      .eq('sender_id', profile.id)
      .eq('receiver_id', currentUserId)
    if (error) {
      console.error('Buddy accept error:', error)
      return
    }
    setBuddyStatus('accepted')
  }

  function startEditing() {
    if (!profile) return
    setEditDisplayName(profile.display_name || '')
    setEditBio(profile.bio || '')
    setEditStatus(profile.status_text || '')
    setEditAvailability(profile.availability || '')
    setEditGamertags(profile.gamertags || {})
    setEditSocials(profile.socials || {})
    setEditAccentColor((profile as any).accent_color || '#6B3FE0')
    setEditNameColor((profile as any).name_color || '')
    setEditProfileTheme((profile as any).profile_theme || 'default')
    setEditBioFont((profile as any).bio_font || 'default')
    setEditShowXpBar((profile as any).show_xp_bar !== false)
    setEditProfileEffect((profile as any).profile_effect || 'none')
    setEditing(true)
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editDisplayName.trim() || profile.username,
        bio: editBio.trim() || null,
        status_text: editStatus.trim() || null,
        availability: editAvailability || null,
        gamertags: editGamertags,
        socials: editSocials,
        accent_color: editAccentColor || '#6B3FE0',
        name_color: editNameColor.trim() || null,
        profile_theme: editProfileTheme,
        bio_font: editBioFont,
        show_xp_bar: editShowXpBar,
        profile_effect: editProfileEffect === 'none' ? null : editProfileEffect,
      })
      .eq('id', profile.id)

    if (!error) {
      setProfile(prev => prev ? {
        ...prev,
        display_name: editDisplayName.trim() || prev.username,
        bio: editBio.trim() || null,
        status_text: editStatus.trim() || null,
        availability: editAvailability || null,
        gamertags: editGamertags,
        socials: editSocials,
        accent_color: editAccentColor || '#6B3FE0',
        name_color: editNameColor.trim() || null,
        profile_theme: editProfileTheme,
        bio_font: editBioFont,
        show_xp_bar: editShowXpBar,
        profile_effect: editProfileEffect === 'none' ? null : editProfileEffect,
      } as any : null)
      setEditing(false)
    }
    setSaving(false)
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  function getVideoThumbnail(url: string) {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-dim text-sm animate-pulse">Loading profile...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <User size={36} className="text-text-dim opacity-40" />
        <p className="text-text-dim text-sm">User not found</p>
        <Link href="/feed" className="text-cyan text-sm hover:underline">Back to feed</Link>
      </div>
    )
  }

  if (!profile) return null

  const level = getLevelFromXP(profile.xp)
  const xpProgress = getXPProgress(profile.xp)
  const memberSince = new Date(profile.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' })
  
  // Personalization
  const accentColor = (profile as any).accent_color || '#6B3FE0'
  const nameColor = (profile as any).name_color || null
  const profileTheme = (profile as any).profile_theme || 'default'
  const bioFont = (profile as any).bio_font || 'default'
  const showXpBar = (profile as any).show_xp_bar !== false
  const profileEffect = (profile as any).profile_effect || null
  
  const bioFontClass = bioFont === 'mono' ? 'font-mono' : bioFont === 'serif' ? 'font-serif' : bioFont === 'handwritten' ? 'italic' : ''
  
  const themeStyles: Record<string, string> = {
    default: '',
    minimal: 'border-0 bg-transparent shadow-none',
    neon: `shadow-[0_0_20px_${accentColor}20]`,
    gradient: '',
    glass: 'bg-white/[0.03] backdrop-blur-xl',
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Profile Header */}
      <div className={`vs-card mb-5 overflow-hidden relative ${themeStyles[profileTheme] || ''}`}
        style={profileTheme === 'neon' ? { boxShadow: `0 0 20px ${accentColor}20, inset 0 0 20px ${accentColor}08` } : {}}>
        
        {/* Profile effects */}
        {profileEffect === 'glow' && (
          <div className="absolute inset-0 pointer-events-none z-0" style={{ background: `radial-gradient(ellipse at 30% 20%, ${accentColor}15 0%, transparent 60%)` }} />
        )}
        {profileEffect === 'scanlines' && (
          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }} />
        )}
        {profileEffect === 'grid' && (
          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(${accentColor}40 1px, transparent 1px), linear-gradient(90deg, ${accentColor}40 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        )}
        
        {/* Banner */}
        {isOwn ? (
          <ImageUpload
            bucket="banners"
            userId={profile.id}
            currentUrl={profile.banner_url}
            onUpload={(url) => setProfile(prev => prev ? { ...prev, banner_url: url } : null)}
            type="banner"
          />
        ) : (
          <div className="h-28 bg-gradient-to-br from-purple/20 via-surface-2 to-cyan/10 relative">
            {profile.banner_url && (
              <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
          </div>
        )}

        <div className="px-5 pb-5 -mt-10 relative">
          <div className="flex items-end gap-4 mb-4">
            {/* Avatar */}
            {isOwn ? (
              <div className="relative">
                <ImageUpload
                  bucket="avatars"
                  userId={profile.id}
                  currentUrl={profile.avatar_url}
                  onUpload={(url) => setProfile(prev => prev ? { ...prev, avatar_url: url } : null)}
                  type="avatar"
                />
                {profile.is_founding_member && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple flex items-center justify-center z-10">
                    <Star size={10} className="text-white" fill="white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-purple/30 border-4 border-surface flex items-center justify-center text-2xl font-bold text-purple shrink-0 relative overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()
                )}
                {profile.is_founding_member && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple flex items-center justify-center">
                    <Star size={10} className="text-white" fill="white" />
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold" style={nameColor ? { color: nameColor } : {}}>{profile.display_name || profile.username}</h1>
                {/* Online status */}
                {!isOwn && (profile as any).last_seen_at && (
                  Date.now() - new Date((profile as any).last_seen_at).getTime() < 5 * 60 * 1000 ? (
                    <span className="flex items-center gap-1 text-[9px] text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online
                    </span>
                  ) : (
                    <span className="text-[9px] text-text-dim">
                      Last seen {(() => {
                        const diff = Date.now() - new Date((profile as any).last_seen_at).getTime()
                        if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
                        if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
                        return `${Math.floor(diff / 86400_000)}d ago`
                      })()}
                    </span>
                  )
                )}
                {profile.is_founding_member && (
                  <span className="vs-badge vs-badge-purple text-[9px]">
                    <Star size={8} /> Founder
                  </span>
                )}
                {profile.is_verified && (
                  <span className="vs-badge vs-badge-cyan text-[9px]">
                    <Shield size={8} /> Verified
                  </span>
                )}
                {profile.is_coach && (
                  <span className="vs-badge text-[9px] bg-success/15 text-success">Coach</span>
                )}
              </div>
              <p className="text-sm text-text-dim">@{profile.username}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isOwn ? (
                !editing ? (
                  <button onClick={startEditing} className="vs-btn vs-btn-ghost text-xs">
                    <Edit3 size={13} /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="vs-btn vs-btn-ghost text-xs">
                      <X size={13} /> Cancel
                    </button>
                    <button onClick={saveProfile} disabled={saving} className="vs-btn vs-btn-primary text-xs">
                      {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Save size={13} /> Save</>}
                    </button>
                  </div>
                )
              ) : currentUserId && (
                <>
                  <button
                    onClick={toggleFollow}
                    className={`vs-btn text-xs ${isFollowing ? 'vs-btn-ghost' : 'vs-btn-primary'}`}
                  >
                    {isFollowing ? <><UserCheck size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
                  </button>
                  {buddyStatus === 'none' && (
                    <button onClick={sendBuddyRequest} className="vs-btn vs-btn-cyan text-xs">
                      <Users size={13} /> Add Buddy
                    </button>
                  )}
                  {buddyStatus === 'pending_sent' && (
                    <span className="vs-btn vs-btn-ghost text-xs cursor-default opacity-60">
                      <Clock size={13} /> Request Sent
                    </span>
                  )}
                  {buddyStatus === 'pending_received' && (
                    <button onClick={acceptBuddyRequest} className="vs-btn vs-btn-primary text-xs">
                      <UserCheck size={13} /> Accept Buddy
                    </button>
                  )}
                  {buddyStatus === 'accepted' && (
                    <span className="vs-badge vs-badge-cyan text-xs py-1.5 px-3">
                      <Users size={12} /> Buddies
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bio / Status */}
          {!editing ? (
            <div className="space-y-2">
              {profile.bio && <p className={`text-sm text-text/80 leading-relaxed ${bioFontClass}`}>{profile.bio}</p>}
              <div className="flex items-center gap-4 text-xs text-text-dim flex-wrap">
                {profile.status_text && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success" /> {profile.status_text}
                  </span>
                )}
                {profile.availability && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {profile.availability}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> Joined {memberSince}
                </span>
                {profile.platforms.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Monitor size={11} /> {profile.platforms.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              <div>
                <label className="vs-label block mb-1">DISPLAY NAME</label>
                <input
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  className="vs-input text-sm"
                  maxLength={32}
                />
              </div>
              <div>
                <label className="vs-label block mb-1">BIO</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="vs-input text-sm resize-none min-h-[60px]"
                  maxLength={250}
                  placeholder="Tell the community about yourself..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="vs-label block mb-1">STATUS</label>
                  <input
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="vs-input text-sm"
                    placeholder="What are you up to?"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="vs-label block mb-1">AVAILABILITY</label>
                  <select
                    value={editAvailability}
                    onChange={e => setEditAvailability(e.target.value)}
                    className="vs-input text-sm appearance-none"
                  >
                    <option value="">Not set</option>
                    <option value="Online">Online</option>
                    <option value="Away">Away</option>
                    <option value="In Game">In Game</option>
                    <option value="LFG">LFG</option>
                    <option value="Do Not Disturb">Do Not Disturb</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              {/* Gamertags */}
              <div>
                <label className="vs-label block mb-1">GAMERTAGS</label>
                <div className="space-y-2">
                  {['PSN', 'Xbox Live', 'Steam', 'Riot ID', 'Epic Games', 'Battle.net'].map(platform => (
                    <div key={platform} className="flex items-center gap-2">
                      <span className="text-xs text-text-dim w-20 shrink-0">{platform}</span>
                      <input
                        value={editGamertags[platform] || ''}
                        onChange={e => setEditGamertags(prev => ({ ...prev, [platform]: e.target.value }))}
                        className="vs-input text-xs py-1.5 flex-1"
                        placeholder={`Your ${platform} tag`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Socials */}
              <div>
                <label className="vs-label block mb-1">SOCIALS</label>
                <div className="space-y-2">
                  {['Discord', 'Twitter', 'Twitch', 'YouTube', 'TikTok'].map(social => (
                    <div key={social} className="flex items-center gap-2">
                      <span className="text-xs text-text-dim w-20 shrink-0">{social}</span>
                      <input
                        value={editSocials[social] || ''}
                        onChange={e => setEditSocials(prev => ({ ...prev, [social]: e.target.value }))}
                        className="vs-input text-xs py-1.5 flex-1"
                        placeholder={`Your ${social}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalize */}
              <div className="col-span-full border-t border-border pt-4 mt-2">
                <label className="vs-label block mb-3">PERSONALIZE YOUR PROFILE</label>
                
                {/* Accent color */}
                <div className="mb-4">
                  <p className="text-xs text-text-dim mb-2">Accent Color</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['#6B3FE0', '#00C8F0', '#E8593C', '#22C55E', '#EAB308', '#EC4899', '#F97316', '#8B5CF6', '#06B6D4', '#FFFFFF'].map(color => (
                      <button key={color} onClick={() => setEditAccentColor(color)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${editAccentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }} />
                    ))}
                    <input type="color" value={editAccentColor} onChange={e => setEditAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" title="Custom color" />
                  </div>
                </div>

                {/* Name color */}
                <div className="mb-4">
                  <p className="text-xs text-text-dim mb-2">Name Color</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setEditNameColor('')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] border transition-all ${!editNameColor ? 'border-white bg-white/10 text-white' : 'border-border text-text-dim'}`}>
                      Default
                    </button>
                    {['#6B3FE0', '#00C8F0', '#E8593C', '#22C55E', '#EAB308', '#EC4899', '#F97316', '#FF6B6B', '#00FFB2', '#FFD700'].map(color => (
                      <button key={color} onClick={() => setEditNameColor(color)}
                        className={`w-7 h-7 rounded-lg border-2 transition-all ${editNameColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }} />
                    ))}
                    <input type="color" value={editNameColor || '#ffffff'} onChange={e => setEditNameColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent" title="Custom color" />
                  </div>
                </div>

                {/* Profile theme */}
                <div className="mb-4">
                  <p className="text-xs text-text-dim mb-2">Profile Theme</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: 'default', label: 'Default' },
                      { id: 'minimal', label: 'Minimal' },
                      { id: 'neon', label: 'Neon' },
                      { id: 'glass', label: 'Glass' },
                    ].map(theme => (
                      <button key={theme.id} onClick={() => setEditProfileTheme(theme.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] border transition-all ${editProfileTheme === theme.id ? 'border-purple bg-purple/15 text-purple' : 'border-border text-text-dim hover:border-border-hover'}`}>
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile effect */}
                <div className="mb-4">
                  <p className="text-xs text-text-dim mb-2">Background Effect</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'glow', label: 'Glow' },
                      { id: 'scanlines', label: 'Scanlines' },
                      { id: 'grid', label: 'Grid' },
                    ].map(fx => (
                      <button key={fx.id} onClick={() => setEditProfileEffect(fx.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] border transition-all ${editProfileEffect === fx.id ? 'border-cyan bg-cyan/15 text-cyan' : 'border-border text-text-dim hover:border-border-hover'}`}>
                        {fx.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio font */}
                <div className="mb-4">
                  <p className="text-xs text-text-dim mb-2">Bio Font</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: 'default', label: 'Default', cls: '' },
                      { id: 'mono', label: 'Monospace', cls: 'font-mono' },
                      { id: 'serif', label: 'Serif', cls: 'font-serif' },
                      { id: 'handwritten', label: 'Handwritten', cls: 'italic' },
                    ].map(f => (
                      <button key={f.id} onClick={() => setEditBioFont(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] border transition-all ${f.cls} ${editBioFont === f.id ? 'border-purple bg-purple/15 text-purple' : 'border-border text-text-dim hover:border-border-hover'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show XP bar toggle */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-dim">Show XP bar on profile</p>
                  <button onClick={() => setEditShowXpBar(!editShowXpBar)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${editShowXpBar ? 'bg-purple' : 'bg-surface-2'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${editShowXpBar ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 md:gap-5 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-medium text-purple">{level.name}</p>
              <p className="text-[10px] text-text-dim tracking-wide">LEVEL {level.level}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-medium">{profile.xp.toLocaleString()}</p>
              <p className="text-[10px] text-text-dim tracking-wide">XP</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-medium">{followerCount}</p>
              <p className="text-[10px] text-text-dim tracking-wide">FOLLOWERS</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-medium">{followingCount}</p>
              <p className="text-[10px] text-text-dim tracking-wide">FOLLOWING</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-medium">{postCount}</p>
              <p className="text-[10px] text-text-dim tracking-wide">POSTS</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-medium">{clipCount}</p>
              <p className="text-[10px] text-text-dim tracking-wide">CLIPS</p>
            </div>
            {/* XP progress */}
            <div className="flex-1">
              <div className="h-1.5 bg-void rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${xpProgress.percentage}%`, backgroundColor: accentColor }} />
              </div>
              <p className="text-[9px] text-text-dim mt-1 text-right">{profile.xp}/{xpProgress.next} XP</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
        {/* Main content */}
        <div>
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-4">
            {[
              { id: 'posts' as ProfileTab, label: 'Posts', icon: Newspaper, count: postCount },
              { id: 'clips' as ProfileTab, label: 'Clips', icon: Film, count: clipCount },
              { id: 'games' as ProfileTab, label: 'Games', icon: Gamepad2, count: userGames.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple/15 text-purple'
                    : 'text-text-dim hover:bg-surface hover:text-text-muted'
                }`}
              >
                <tab.icon size={13} /> {tab.label}
                {tab.count > 0 && <span className="text-[10px] opacity-60">({tab.count})</span>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {loadingContent ? (
            <div className="vs-card animate-pulse py-12 text-center">
              <div className="w-5 h-5 border-2 border-purple border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : activeTab === 'posts' ? (
            posts.length === 0 ? (
              <div className="vs-card text-center py-12">
                <Newspaper size={28} className="mx-auto text-text-dim opacity-40 mb-2" />
                <p className="text-sm text-text-dim">No posts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post.id} className="vs-card">
                    <div className="flex items-center gap-2 mb-2 text-xs text-text-dim">
                      <span>{timeAgo(post.created_at)}</span>
                      {(post.game as any)?.name && (
                        <>
                          <span className="text-border">·</span>
                          <span className="vs-badge vs-badge-purple text-[9px]">{(post.game as any).name}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-text/85 leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
                    {post.image_url && (
                      <div className="rounded-lg overflow-hidden mt-3 bg-surface-2 border border-border">
                        <img src={post.image_url} alt="" className="w-full max-h-[300px] object-cover" />
                      </div>
                    )}
                    <div className="flex gap-4 mt-3 text-xs text-text-dim">
                      <span className="flex items-center gap-1"><Heart size={12} /> {post.like_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comment_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'clips' ? (
            clips.length === 0 ? (
              <div className="vs-card text-center py-12">
                <Film size={28} className="mx-auto text-text-dim opacity-40 mb-2" />
                <p className="text-sm text-text-dim">No clips yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {clips.map(clip => (
                  <Link key={clip.id} href="/clips" className="vs-card group hover:border-border-hover transition-all">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-surface-2 mb-2">
                      {clip.thumbnail_url || getVideoThumbnail(clip.video_url) ? (
                        <img
                          src={clip.thumbnail_url || getVideoThumbnail(clip.video_url)!}
                          alt={clip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={20} className="text-text-dim" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-purple/90 flex items-center justify-center">
                          <Play size={14} fill="white" className="text-white ml-0.5" />
                        </div>
                      </div>
                      {clip.is_cotw && (
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-purple/90 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                          <Trophy size={8} /> COTW
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs font-medium truncate group-hover:text-purple transition-colors">{clip.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-text-dim mt-1">
                      <span className="flex items-center gap-0.5"><Heart size={9} /> {clip.like_count}</span>
                      <span className="flex items-center gap-0.5"><Eye size={9} /> {clip.view_count}</span>
                      <span>{timeAgo(clip.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            // Games tab
            userGames.length === 0 ? (
              <div className="vs-card text-center py-12">
                <Gamepad2 size={28} className="mx-auto text-text-dim opacity-40 mb-2" />
                <p className="text-sm text-text-dim">No games added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userGames.map(ug => (
                  <div key={ug.id} className="vs-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
                        <Gamepad2 size={18} className="text-text-dim" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ug.game?.name}</p>
                        {/* Show gamertag if available */}
                        {profile.gamertags && Object.entries(profile.gamertags).find(([, v]) => v) && (
                          <p className="text-[10px] text-text-dim">
                            {Object.entries(profile.gamertags).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                    {ug.is_main && (
                      <span className="vs-badge vs-badge-purple text-[9px]">MAIN</span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Gamertags card */}
          {!editing && profile.gamertags && Object.values(profile.gamertags).some(v => v) && (
            <div className="vs-card">
              <p className="vs-label mb-3">GAMERTAGS</p>
              <div className="space-y-2">
                {Object.entries(profile.gamertags)
                  .filter(([, v]) => v)
                  .map(([platform, tag]) => (
                    <div key={platform} className="flex items-center justify-between text-sm">
                      <span className="text-text-dim text-xs">{platform}</span>
                      <span className="font-mono text-xs">{tag}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Socials card */}
          {!editing && profile.socials && Object.values(profile.socials).some(v => v) && (
            <div className="vs-card">
              <p className="vs-label mb-3">SOCIALS</p>
              <div className="space-y-2">
                {Object.entries(profile.socials)
                  .filter(([, v]) => v)
                  .map(([platform, handle]) => (
                    <div key={platform} className="flex items-center justify-between text-sm">
                      <span className="text-text-dim text-xs">{platform}</span>
                      <span className="text-cyan text-xs">{handle}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Games quick list */}
          {userGames.length > 0 && (
            <div className="vs-card">
              <p className="vs-label mb-3">GAMES ({userGames.length})</p>
              <div className="space-y-1.5">
                {userGames.map(ug => (
                  <div key={ug.id} className="flex items-center justify-between text-sm">
                    <span>{ug.game?.name}</span>
                    {ug.is_main && <span className="text-[9px] text-purple bg-purple/10 px-2 py-0.5 rounded">MAIN</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level card */}
          <div className="vs-card">
            <p className="vs-label mb-3">RANK</p>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple">{level.name}</p>
              <p className="text-xs text-text-dim mt-1">Level {level.level} · {profile.xp.toLocaleString()} XP</p>
              <div className="h-1.5 bg-void rounded-full overflow-hidden mt-3">
                <div className="h-full rounded-full transition-all" style={{ width: `${xpProgress.percentage}%`, backgroundColor: accentColor }} />
              </div>
              <p className="text-[9px] text-text-dim mt-1">{xpProgress.next - profile.xp} XP to next level</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

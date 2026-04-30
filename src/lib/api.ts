import { supabase } from './supabase';

export type QuestType =
  | 'grocery' | 'farmers_market' | 'bookstore' | 'ikea' | 'thrift' | 'hardware'
  | 'pharmacy' | 'record_store' | 'plant_nursery' | 'wine_shop' | 'art_supply' | 'pet_store'
  | 'coffee' | 'tea' | 'brunch' | 'lunch' | 'food_market' | 'boba' | 'ice_cream'
  | 'gym' | 'yoga' | 'run' | 'hike'
  | 'museum' | 'gallery' | 'cinema' | 'trivia'
  | 'dinner' | 'happy_hour' | 'party'
  | 'post_office' | 'other';

export interface DbUser {
  id: string;
  display_name: string | null;
  instagram_handle: string | null;
  avatar_url: string | null;
  personality_data: { personalityBlurb?: string; interestTags?: string[] } | null;
}

export interface DbQuest {
  id: string;
  user_id: string;
  quest_type: QuestType;
  location_label: string | null;
  scheduled_time: string;
  note: string | null;
  status: string;
  created_at: string;
  users: DbUser | null;
}

export interface DbWave {
  id: string;
  sender_id: string;
  receiver_id: string;
  quest_id: string;
  icebreaker: string | null;
  matched: boolean;
  seen: boolean;
  created_at: string;
  sender: DbUser | null;
  quest: { quest_type: QuestType; location_label: string | null; scheduled_time: string } | null;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.session) setSessionCookie();
  return data.session;
}

export async function signUpWithPassword(email: string, password: string) {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : '/auth/callback';
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  if (data.session) setSessionCookie();
  return data.session;
}

export async function signInWithOtp(email: string) {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : '/auth/callback';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}


export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  if (data.session) setSessionCookie();
  return data.session;
}

function setSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'sq-session=1; path=/; max-age=31536000; samesite=lax';
  }
}

export async function signInAnonymously() {
  const { data } = await supabase.auth.getSession();
  if (data.session) { setSessionCookie(); return data.session; }
  const { data: d2 } = await supabase.auth.signInAnonymously();
  if (d2.session) setSessionCookie();
  return d2.session;
}

export async function ensureUserRecord(userId: string) {
  const { data } = await supabase.from('users').select('id').eq('id', userId).single();
  if (!data) await supabase.from('users').upsert({ id: userId, display_name: 'you' });
}

export async function fetchFeedQuests(userId: string): Promise<DbQuest[]> {
  const { data } = await supabase
    .from('quests')
    .select('*, users(id, display_name, instagram_handle, avatar_url, personality_data)')
    .eq('status', 'active')
    .neq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  return (data ?? []) as DbQuest[];
}

export async function postQuest({
  userId, questType, latitude, longitude, locationLabel, scheduledTime, note,
}: {
  userId: string; questType: QuestType; latitude: number; longitude: number;
  locationLabel: string; scheduledTime: Date; note: string;
}) {
  const { data, error } = await supabase.from('quests').insert({
    user_id: userId,
    quest_type: questType,
    location: `POINT(${longitude} ${latitude})`,
    location_label: locationLabel,
    scheduled_time: scheduledTime.toISOString(),
    duration_minutes: 60,
    note: note || null,
    status: 'active',
  }).select().single();
  if (error) throw error;
  return data;
}

export async function fetchWaves(userId: string): Promise<DbWave[]> {
  const { data } = await supabase
    .from('waves')
    .select(`*, sender:users!waves_sender_id_fkey(id,display_name,instagram_handle,avatar_url,personality_data), quest:quests!waves_quest_id_fkey(quest_type,location_label,scheduled_time)`)
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as DbWave[];
}

export async function sendWave(senderId: string, receiverId: string, questId: string, icebreaker?: string) {
  const { error } = await supabase.from('waves').insert({ sender_id: senderId, receiver_id: receiverId, quest_id: questId, icebreaker: icebreaker || null });
  if (error) throw error;
}

export async function acceptWave(waveId: string) {
  const { error } = await supabase.from('waves').update({ matched: true, seen: true }).eq('id', waveId);
  if (error) throw error;
}

export async function fetchCurrentUser(userId: string): Promise<DbUser | null> {
  const { data } = await supabase
    .from('users').select('id, display_name, instagram_handle, avatar_url, personality_data')
    .eq('id', userId).single();
  return data as DbUser | null;
}

export function formatScheduledTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return `today ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `tomorrow ${time}`;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` ${time}`;
}

export function composeTimeToDate(day: string, hour: number, minute: number): Date {
  const date = new Date();
  if (day === 'tomorrow') date.setDate(date.getDate() + 1);
  else if (day === 'this_week') {
    const daysUntilSat = (6 - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntilSat);
  }
  date.setHours(hour, minute, 0, 0);
  return date;
}

export const QUEST_TYPE_LABELS: Record<string, string> = {
  grocery: 'grocery', farmers_market: 'farmers market', bookstore: 'bookstore',
  ikea: 'ikea', coffee: 'coffee', gym: 'gym', hardware: 'hardware store',
  thrift: 'thrift store', other: 'other',
};

export const ALL_QUEST_TYPES: QuestType[] = [
  'grocery', 'farmers_market', 'bookstore', 'ikea',
  'coffee', 'gym', 'hardware', 'thrift', 'other',
];

export interface MatchedQuest {
  id: string;
  quest_id: string;
  user_id: string;
  quest_type: QuestType;
  location_label: string | null;
  scheduled_time: string;
  note: string | null;
  distance_miles: number;
  similarity: number;
  match_percent: number;
  users: DbUser | null;
}

type RpcRow = {
  quest_id: string;
  user_id: string;
  location_label: string | null;
  scheduled_time: string;
  note: string | null;
  distance_miles: number;
  similarity: number;
  match_percent: number;
};

export async function fetchMatchedQuests(
  userId: string,
  lat: number,
  lng: number,
  questType?: QuestType,
): Promise<MatchedQuest[]> {
  const location = `SRID=4326;POINT(${lng} ${lat})`;
  const now = new Date().toISOString();
  const types = questType ? [questType] : ALL_QUEST_TYPES;

  const results = await Promise.all(
    types.map(t =>
      supabase.rpc('match_quests', {
        p_user_id: userId,
        p_quest_type: t,
        p_location: location,
        p_scheduled_time: now,
        p_time_window_h: 24,
        p_limit: 20,
      }),
    ),
  );

  const rows: Array<RpcRow & { quest_type: QuestType }> = [];
  results.forEach((r, i) => {
    (r.data ?? []).forEach((row: RpcRow) => {
      rows.push({ ...row, quest_type: types[i] });
    });
  });

  if (rows.length === 0) return [];

  const seen = new Set<string>();
  const unique = rows
    .sort((a, b) => b.match_percent - a.match_percent)
    .filter(r => {
      if (seen.has(r.quest_id)) return false;
      seen.add(r.quest_id);
      return true;
    });

  const userIds = [...new Set(unique.map(r => r.user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, instagram_handle, avatar_url, personality_data')
    .in('id', userIds);
  const userMap = new Map((users ?? []).map((u: DbUser) => [u.id, u]));

  return unique.map(r => ({
    id: r.quest_id,
    quest_id: r.quest_id,
    user_id: r.user_id,
    quest_type: r.quest_type,
    location_label: r.location_label,
    scheduled_time: r.scheduled_time,
    note: r.note,
    distance_miles: r.distance_miles,
    similarity: r.similarity,
    match_percent: r.match_percent,
    users: userMap.get(r.user_id) ?? null,
  }));
}

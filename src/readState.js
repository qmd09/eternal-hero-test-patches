import { supabase } from './supabase'

const TABLE = 'read_state'

// Get last read timestamp for a topic
export async function getLastRead(username, topicId) {
  try {
    const { data } = await supabase
      .from(TABLE)
      .select('last_read_at')
      .eq('username', username)
      .eq('topic_id', topicId)
      .single()
    return data?.last_read_at ? new Date(data.last_read_at).getTime() : 0
  } catch { return 0 }
}

// Mark a topic as read up to now
export async function markRead(username, topicId) {
  try {
    await supabase.from(TABLE).upsert({
      username,
      topic_id: topicId,
      last_read_at: new Date().toISOString()
    }, { onConflict: 'username,topic_id' })
  } catch (e) { console.error('markRead error', e) }
}

// Get read state for multiple topics at once
export async function getBulkLastRead(username, topicIds) {
  if (!topicIds.length) return {}
  try {
    const { data } = await supabase
      .from(TABLE)
      .select('topic_id, last_read_at')
      .eq('username', username)
      .in('topic_id', topicIds)
    const map = {}
    ;(data || []).forEach(r => { map[r.topic_id] = new Date(r.last_read_at).getTime() })
    return map
  } catch { return {} }
}

// Count unread comments in a comment array since lastReadAt
export function countUnread(comments, lastReadAt) {
  if (!lastReadAt) return countAll(comments)
  let count = 0
  const check = (cms) => {
    for (const cm of (cms || [])) {
      if (!cm.deleted && cm.ts > lastReadAt) count++
      if (cm.replies?.length) check(cm.replies)
    }
  }
  check(comments)
  return count
}

export function countAll(comments) {
  let count = 0
  const check = (cms) => {
    for (const cm of (cms || [])) {
      if (!cm.deleted) count++
      if (cm.replies?.length) check(cm.replies)
    }
  }
  check(comments)
  return count
}

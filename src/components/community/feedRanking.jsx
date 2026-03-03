/**
 * Adaptive Feed Ranking Engine
 * 
 * Multi-layer ranking combining:
 * - User interest profile (from liked/engaged posts)
 * - Collaborative filtering (posts liked by similar users)
 * - Trending velocity (recent engagement acceleration)
 * - Diversity & anti-repetition (topic fatigue, author cap)
 * - Recency decay
 * - Exploratory injection (new creators)
 */

// ── Topic extraction from post ──────────────────────────
export function extractTopics(post) {
  const topics = new Set();
  if (post.media_type && post.media_type !== "general") topics.add(post.media_type);
  if (post.type) topics.add(post.type);
  if (post.tags) post.tags.forEach(t => topics.add(t));
  const bodyLower = (post.body || "").toLowerCase();
  const keywords = ["music", "movie", "book", "game", "show", "sports", "tech", "art", "anime", "film"];
  keywords.forEach(k => { if (bodyLower.includes(k)) topics.add(k); });
  return [...topics];
}

// ── Build user interest profile from engagement ──────────
export function buildUserProfile(userEmail, posts) {
  const engaged = posts.filter(p =>
    p.upvoted_by?.includes(userEmail)
  );
  const topicScores = {};
  const typeScores = {};
  const authorScores = {};

  engaged.forEach((p, i) => {
    // Recency weight: newer engagements matter more
    const ageHours = (Date.now() - new Date(p.updated_date || p.created_date).getTime()) / 3600000;
    const weight = Math.exp(-ageHours / (24 * 14)); // 2-week decay

    extractTopics(p).forEach(topic => {
      topicScores[topic] = (topicScores[topic] || 0) + weight;
    });
    if (p.type) typeScores[p.type] = (typeScores[p.type] || 0) + weight;
    if (p.author_email && p.author_email !== userEmail) {
      authorScores[p.author_email] = (authorScores[p.author_email] || 0) + weight;
    }
  });

  return { topicScores, typeScores, authorScores, engagedPostIds: engaged.map(p => p.id) };
}

// ── Similarity between post and user profile ─────────────
function topicSimilarity(post, profile) {
  const postTopics = extractTopics(post);
  if (postTopics.length === 0) return 0;
  const totalTopicWeight = Object.values(profile.topicScores).reduce((a, b) => a + b, 0) || 1;
  let score = 0;
  postTopics.forEach(t => {
    score += (profile.topicScores[t] || 0) / totalTopicWeight;
  });
  // Type preference
  const totalTypeWeight = Object.values(profile.typeScores).reduce((a, b) => a + b, 0) || 1;
  score += (profile.typeScores[post.type] || 0) / totalTypeWeight * 0.3;
  return Math.min(score, 1);
}

// ── Collaborative filtering score ────────────────────────
export function buildCollaborativeScores(userEmail, posts, allPosts) {
  // Find users with overlapping upvote patterns
  const myLiked = new Set(posts.filter(p => p.upvoted_by?.includes(userEmail)).map(p => p.id));
  if (myLiked.size === 0) return {};

  const userSimilarity = {};
  allPosts.forEach(post => {
    (post.upvoted_by || []).forEach(email => {
      if (email === userEmail) return;
      if (myLiked.has(post.id)) {
        userSimilarity[email] = (userSimilarity[email] || 0) + 1;
      }
    });
  });

  // For similar users, find posts they liked that current user hasn't
  const collab = {};
  allPosts.forEach(post => {
    if (myLiked.has(post.id) || post.author_email === userEmail) return;
    let score = 0;
    (post.upvoted_by || []).forEach(email => {
      if (userSimilarity[email]) score += userSimilarity[email];
    });
    if (score > 0) collab[post.id] = score;
  });

  // Normalize
  const maxScore = Math.max(...Object.values(collab), 1);
  Object.keys(collab).forEach(id => { collab[id] = collab[id] / maxScore; });
  return collab;
}

// ── Trending velocity (last 6h engagement) ───────────────
function trendingVelocity(post) {
  const now = Date.now();
  const sixHoursAgo = now - 6 * 3600000;
  const created = new Date(post.created_date).getTime();
  if (created < sixHoursAgo) return 0;

  // Approximate: engagement_score can proxy velocity for recent posts
  const ageHours = (now - created) / 3600000;
  if (ageHours > 6) return 0;
  const velocity = (post.engagement_score || 0) / Math.max(ageHours, 0.5);
  return Math.min(velocity / 20, 1); // normalize
}

// ── Recency decay ─────────────────────────────────────────
function recencyScore(post) {
  const ageHours = (Date.now() - new Date(post.created_date).getTime()) / 3600000;
  return Math.exp(-ageHours / 72); // 3-day half-life
}

// ── Diversity adjustment ──────────────────────────────────
function applyDiversityFilter(rankedPosts, userEmail) {
  const authorCounts = {};
  const typeCounts = {};
  const topicRecentCounts = {};
  const result = [];
  const deferred = [];

  for (const item of rankedPosts) {
    const post = item.post;
    const author = post.author_email || "anon";
    const type = post.type;
    const topics = extractTopics(post);

    // Author cap: max 2 posts per author per 10 feed items
    const authorCount = authorCounts[author] || 0;
    const authorOk = author === userEmail || authorCount < 2;

    // Type rotation: max 3 consecutive same type
    const typeCount = typeCounts[type] || 0;
    const typeOk = typeCount < 3;

    // Topic fatigue: if 4 same-topic posts recently
    const topicFatigue = topics.some(t => (topicRecentCounts[t] || 0) >= 4);

    if (authorOk && typeOk && !topicFatigue) {
      result.push(item);
      authorCounts[author] = authorCount + 1;
      typeCounts[type] = typeCount + 1;
      topics.forEach(t => { topicRecentCounts[t] = (topicRecentCounts[t] || 0) + 1; });

      // Reset type counter if rotation happened
      if (result.length % 5 === 0) {
        Object.keys(typeCounts).forEach(k => { typeCounts[k] = Math.max(0, typeCounts[k] - 1); });
      }
    } else {
      deferred.push(item);
    }
  }

  // Append deferred posts at end
  return [...result, ...deferred];
}

// ── Main ranking function ─────────────────────────────────
export function rankFeedForUser(posts, userEmail, debates = [], followedEmails = []) {
  if (!userEmail || posts.length === 0) {
    return posts.sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
  }

  const followedSet = new Set(followedEmails);
  const profile = buildUserProfile(userEmail, posts);
  const collabScores = buildCollaborativeScores(userEmail, posts, posts);

  // Session-level seen posts (soft suppress quick-skipped)
  const seenRecently = JSON.parse(sessionStorage.getItem("seen_posts") || "[]");

  const scored = posts.map(post => {
    const similarity = topicSimilarity(post, profile);
    const collab = collabScores[post.id] || 0;

    // Engagement prediction: weighted combo of normalized engagement metrics
    const maxEngagement = Math.max(...posts.map(p => p.engagement_score || 0), 1);
    const engagementNorm = (post.engagement_score || 0) / maxEngagement;
    // Boost if author is frequently engaged with
    const authorBoost = profile.authorScores[post.author_email] ? 0.15 : 0;
    const engagementPrediction = Math.min(engagementNorm + authorBoost, 1);

    const velocity = trendingVelocity(post);
    const recency = recencyScore(post);

    // Seen suppression
    const seenPenalty = seenRecently.includes(post.id) ? 0.4 : 1.0;

    // Discovery injection: boost new/unknown creators (low upvotes/comments but recent)
    const isNewCreator = (post.upvotes || 0) < 5 && (post.comment_count || 0) < 3;
    const discoveryBoost = isNewCreator && recency > 0.7 ? 0.08 : 0;

    // Multi-layer score formula
    const score = (
      similarity * 0.35 +
      collab * 0.20 +
      engagementPrediction * 0.20 +
      velocity * 0.10 +
      recency * 0.10 +
      discoveryBoost
    ) * seenPenalty;

    return { post, score };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Apply diversity filter
  const diverse = applyDiversityFilter(scored, userEmail);

  return diverse.map(item => item.post);
}

// ── Track viewed post for session adaptation ─────────────
export function trackPostView(postId) {
  const seen = JSON.parse(sessionStorage.getItem("seen_posts") || "[]");
  if (!seen.includes(postId)) {
    seen.push(postId);
    if (seen.length > 100) seen.shift();
    sessionStorage.setItem("seen_posts", JSON.stringify(seen));
  }
}
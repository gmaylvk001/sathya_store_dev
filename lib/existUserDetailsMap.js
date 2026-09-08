import ExistSathyaUserDetail from "@/models/ExistSathyaUserDetail";

export function userIdMatchValues(value) {
  const text = String(value ?? "").trim();
  if (!text) return [];
  const values = new Set([text]);
  if (/^\d+(\.0+)?$/.test(text)) {
    const n = Math.trunc(Number(text));
    values.add(String(n));
    values.add(`${n}.0`);
    values.add(n);
  }
  return [...values];
}

export async function mapUserDetailsToLiveUser(existId, liveUserId) {
  const matchValues = userIdMatchValues(existId);
  if (!matchValues.length) {
    return { matchedCount: 0, modifiedCount: 0 };
  }

  const result = await ExistSathyaUserDetail.updateMany(
    { user_id: { $in: matchValues } },
    { $set: { live_user_id: String(liveUserId) } }
  );

  return {
    matchedCount: result.matchedCount || 0,
    modifiedCount: result.modifiedCount || 0,
  };
}

export async function getMappedLiveUserIdSet(liveUserIds) {
  const ids = [...new Set((liveUserIds || []).map((id) => String(id || "").trim()).filter(Boolean))];
  if (!ids.length) return new Set();

  const mapped = await ExistSathyaUserDetail.distinct("live_user_id", {
    live_user_id: { $in: ids },
  });

  return new Set(mapped.map((id) => String(id)));
}

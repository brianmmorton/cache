/**
 * Describes the shape of a model's relationship fields at the type level, e.g.
 * `{ friends: FriendModelType[]; bestFriend: FriendModelType | null }`.
 * Declared as the second generic to `Model` alongside the runtime `hasMany`/
 * `hasOne`/`belongsTo` calls made in the registration file.
 */
export type RelationsShape = object;

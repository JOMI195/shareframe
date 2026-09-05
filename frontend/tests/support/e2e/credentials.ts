// Seeded by seed-data/users.json via `manage.py seed_dev_data`, which the
// backend entrypoint runs whenever PRODUCTION is not True.
// The passwords carry a digit because the change-password form validates the
// *current* password against the new-password policy too.
export const alice = { email: 'seed.alice@shareframe.local', password: 'seed-alice-dev-pass1', username: 'seed_alice', code: 'SEEDA001' };
export const bob = { email: 'seed.bob@shareframe.local', password: 'seed-bob-dev-pass1', username: 'seed_bob', code: 'SEEDB001' };
export const carol = { email: 'seed.carol@shareframe.local', password: 'seed-carol-dev-pass1', username: 'seed_carol', code: 'SEEDC001' };

// Reserved for the destructive specs so the shared accounts stay intact.
export const dave = { email: 'seed.dave@shareframe.local', password: 'seed-dave-dev-pass1', username: 'seed_dave', code: 'SEEDD001' };
export const erin = { email: 'seed.erin@shareframe.local', password: 'seed-erin-dev-pass1', username: 'seed_erin', code: 'SEEDE001' };
// friendship_user_searchable is false for this one.
export const mallory = { email: 'seed.mallory@shareframe.local', password: 'seed-mallory-dev-pass1', username: 'seed_mallory', code: 'SEEDM001' };

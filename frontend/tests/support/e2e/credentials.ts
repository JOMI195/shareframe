// Seeded by seed-data/users.json via `manage.py seed_dev_data`, which the
// backend entrypoint runs whenever PRODUCTION is not True.
export const alice = { email: 'seed.alice@shareframe.local', password: 'seed-alice-dev-pass1', username: 'seed_alice', code: 'SEEDA001' };
export const bob = { email: 'seed.bob@shareframe.local', password: 'seed-bob-dev-pass1', username: 'seed_bob', code: 'SEEDB001' };
export const carol = { email: 'seed.carol@shareframe.local', password: 'seed-carol-dev-pass1', username: 'seed_carol', code: 'SEEDC001' };

// Reserved for the destructive specs so the shared accounts stay intact.
export const dave = { email: 'seed.dave@shareframe.local', password: 'seed-dave-dev-pass1', username: 'seed_dave', code: 'SEEDD001' };
export const erin = { email: 'seed.erin@shareframe.local', password: 'seed-erin-dev-pass1', username: 'seed_erin', code: 'SEEDE001' };
// friendship_user_searchable is false for this one.
export const mallory = { email: 'seed.mallory@shareframe.local', password: 'seed-mallory-dev-pass1', username: 'seed_mallory', code: 'SEEDM001' };
// Changes its email address.
export const frank = { email: 'seed.frank@shareframe.local', password: 'seed-frank-dev-pass1', username: 'seed_frank', code: 'SEEDF001' };
// Inactive until the activation spec opens its link.
export const ivy = { email: 'seed.ivy@shareframe.local', password: 'seed-ivy-dev-pass1', username: 'seed_ivy', code: 'SEEDI001' };
// Resets its password.
export const grace = { email: 'seed.grace@shareframe.local', password: 'seed-grace-dev-pass1', username: 'seed_grace', code: 'SEEDG001' };
// Signs in to the Django admin; its own mails go to ADMIN_NOTIFICATION_EMAIL.
export const admin = { email: 'seed.admin@shareframe.local', password: 'seed-admin-dev-pass1', username: 'seed_admin', code: 'SEEDX001' };
export const ADMIN_NOTIFICATION_EMAIL = 'test@shareframe.local';

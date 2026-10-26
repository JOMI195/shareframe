import { MigrationManifest } from 'redux-persist';
import migration2 from './migrations/migration2';
import migration3 from './migrations/migration3';
import migration4 from './migrations/migration4';
import migration5 from './migrations/migration5';
import migration6 from './migrations/migration6';
import migration7 from './migrations/migration7';
import migration8 from './migrations/migration8';
import migration9 from './migrations/migration9';
import migration10 from './migrations/migration10';
import migration11 from './migrations/migration11';
import migration12 from './migrations/migration12';
import migration13 from './migrations/migration13';
import migration14 from './migrations/migration14';

const typedMigrations = {
    2: migration2,
    3: migration3,
    4: migration4,
    5: migration5,
    6: migration6,
    7: migration7,
    8: migration8,
    9: migration9,
    10: migration10,
    11: migration11,
    12: migration12,
    13: migration13,
    14: migration14
};

const migrations = typedMigrations as unknown as MigrationManifest;

export default migrations;
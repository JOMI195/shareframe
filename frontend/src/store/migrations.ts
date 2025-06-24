import { MigrationManifest } from 'redux-persist';
import migration2 from './migrations/migration2';
import migration3 from './migrations/migration3';
import migration4 from './migrations/migration4';
import migration5 from './migrations/migration5';
import migration6 from './migrations/migration6';
import migration7 from './migrations/migration7';
import migration8 from './migrations/migration8';

const typedMigrations = {
    2: migration2,
    3: migration3,
    4: migration4,
    5: migration5,
    6: migration6,
    7: migration7,
    8: migration8
};

const migrations = typedMigrations as unknown as MigrationManifest;

export default migrations;
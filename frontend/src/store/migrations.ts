import { MigrationManifest } from 'redux-persist';
import migration2 from './migrations/migration2';
import migration3 from './migrations/migration3';
import migration4 from './migrations/migration4';

const typedMigrations = {
    2: migration2,
    3: migration3,
    4: migration4,
};

const migrations = typedMigrations as unknown as MigrationManifest;

export default migrations;
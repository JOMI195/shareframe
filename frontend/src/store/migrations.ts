import { MigrationManifest } from 'redux-persist';
import migration2 from './migrations/migration2';
import migration3 from './migrations/migration3';

const typedMigrations = {
    2: migration2,
    3: migration3,
};

const migrations = typedMigrations as unknown as MigrationManifest;

export default migrations;
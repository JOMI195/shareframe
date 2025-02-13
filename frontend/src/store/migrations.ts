import { MigrationManifest } from 'redux-persist';
import migration2 from './migrations/migration2';

const typedMigrations = {
    2: migration2,
};

const migrations = typedMigrations as unknown as MigrationManifest;

export default migrations;
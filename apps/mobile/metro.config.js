const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// résolution monorepo pnpm
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// pour pnpm : on garde la lookup hierarchique active sinon Metro ne trouve
// pas les transitive deps qui sont symlinkees dans .pnpm/
config.resolver.disableHierarchicalLookup = false;

// pnpm utilise des symlinks vers le store .pnpm/ — Metro doit les suivre
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: './global.css' });

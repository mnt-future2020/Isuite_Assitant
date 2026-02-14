const fs = require('fs-extra');
const path = require('path');

exports.default = async function(context) {
  console.log('[BUILD HOOK] Context:', Object.keys(context));

  const appOutDir = context.appOutDir;
  const projectDir = __dirname; // Use __dirname instead of context.projectDir
  const resourcesDir = path.join(appOutDir, 'resources');

  console.log('[BUILD HOOK] Copying node_modules to packaged app...');
  console.log('[BUILD HOOK] App out dir:', appOutDir);
  console.log('[BUILD HOOK] Resources dir:', resourcesDir);

  // Copy server node_modules
  const serverNodeModulesSrc = path.join(projectDir, 'server', 'node_modules');
  const serverNodeModulesDest = path.join(resourcesDir, 'server', 'node_modules');

  if (fs.existsSync(serverNodeModulesSrc)) {
    console.log(`[BUILD HOOK] Copying server node_modules from ${serverNodeModulesSrc} to ${serverNodeModulesDest}...`);
    await fs.copy(serverNodeModulesSrc, serverNodeModulesDest);
    console.log('[BUILD HOOK] Server node_modules copied!');
  } else {
    console.log(`[BUILD HOOK] Server node_modules not found at ${serverNodeModulesSrc}`);
  }

  // Copy frontend node_modules
  const frontendNodeModulesSrc = path.join(projectDir, 'frontend', '.next', 'standalone', 'frontend', 'node_modules');
  const frontendNodeModulesDest = path.join(resourcesDir, 'frontend', 'node_modules');

  if (fs.existsSync(frontendNodeModulesSrc)) {
    console.log(`[BUILD HOOK] Copying frontend node_modules from ${frontendNodeModulesSrc} to ${frontendNodeModulesDest}...`);
    await fs.copy(frontendNodeModulesSrc, frontendNodeModulesDest);
    console.log('[BUILD HOOK] Frontend node_modules copied!');
  } else {
    console.log(`[BUILD HOOK] Frontend node_modules not found at ${frontendNodeModulesSrc}`);
  }

  console.log('[BUILD HOOK] Build hook completed successfully!');
};

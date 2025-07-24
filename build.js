import { build, context } from 'esbuild';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

const isWatch = process.argv.includes('--watch');

// Clean dist directory
async function clean() {
  try {
    await fs.rm('dist', { recursive: true, force: true });
  } catch {
    // Directory might not exist, ignore error
  }
}

// Generate TypeScript declarations
async function generateDeclarations() {
  return new Promise((resolve, reject) => {
    const tsc = spawn('npx', ['tsc', '--project', 'tsconfig.build.json', '--emitDeclarationOnly', '--declaration'], {
      stdio: 'inherit',
      shell: true
    });

    tsc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`TypeScript compilation failed with code ${code}`));
      }
    });
  });
}

// Common esbuild options
const baseOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  target: 'es2022',
  sourcemap: true,
  minify: false,
  external: [], // Bundle all dependencies
  platform: 'node',
};

// Build ESM version
async function buildESM() {
  await build({
    ...baseOptions,
    format: 'esm',
    outfile: 'dist/index.js',
    packages: 'bundle',
  });
  console.log('✓ Built ESM version');
}

async function main() {
  try {
    console.log('🧹 Cleaning dist directory...');
    await clean();

    console.log('🔨 Building with esbuild...');

    if (isWatch) {
      console.log('👀 Watching for changes...');

      // Build initial version
      await buildESM();

      // Generate declarations once in watch mode
      await generateDeclarations();
      console.log('✓ Generated TypeScript declarations');

      // Create watch context
      const esmContext = await context({
        ...baseOptions,
        format: 'esm',
        outfile: 'dist/index.js',
        packages: 'bundle',
      });

      // Start watching
      await esmContext.watch();

      console.log('🔄 Build context is watching for changes...');

      // Keep the process alive
      process.on('SIGINT', async () => {
        await esmContext.dispose();
        process.exit(0);
      });

      // Keep the process alive
      return new Promise(() => {});
    } else {
      // Build ESM format
      await buildESM();

      console.log('📝 Generating TypeScript declarations...');
      await generateDeclarations();
      console.log('✓ Generated TypeScript declarations');

      console.log('🎉 Build completed successfully!');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

main();

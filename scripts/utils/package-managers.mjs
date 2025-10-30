import { access } from 'node:fs/promises';
import path from 'node:path';

const WINDOWS = process.platform === 'win32';

const MANAGER_COMMANDS = {
  npm: WINDOWS ? 'npm.cmd' : 'npm',
  pnpm: WINDOWS ? 'pnpm.cmd' : 'pnpm',
  yarn: WINDOWS ? 'yarn.cmd' : 'yarn'
};

const lockfiles = [
  { filename: 'pnpm-lock.yaml', manager: 'pnpm' },
  { filename: 'yarn.lock', manager: 'yarn' },
  { filename: 'package-lock.json', manager: 'npm' }
];

export const detectPackageManager = async (dir) => {
  for (const { filename, manager } of lockfiles) {
    const fullPath = path.join(dir, filename);
    try {
      await access(fullPath);
      return manager;
    } catch {
      // continue searching
    }
  }
  return 'npm';
};

export const getManagerCommand = (manager) => {
  const command = MANAGER_COMMANDS[manager];
  if (!command) {
    throw new Error(`Unsupported package manager: ${manager}`);
  }
  return command;
};

export const buildScriptInvocation = (manager, scriptName, extraArgs = []) => {
  switch (manager) {
    case 'pnpm':
      return {
        command: getManagerCommand(manager),
        args: ['run', scriptName, ...extraArgs]
      };
    case 'yarn':
      return {
        command: getManagerCommand(manager),
        args: ['run', scriptName, ...extraArgs]
      };
    case 'npm':
    default:
      return {
        command: getManagerCommand(manager),
        args: ['run', scriptName, '--', ...extraArgs]
      };
  }
};

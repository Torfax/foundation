import { execFileSync } from 'node:child_process';

/**
 * What is running: the released tag and its commit. A release image sets `TORFAX_VERSION` and
 * `TORFAX_COMMIT`; outside one the tag is `dev`. Every service publishes it on `/health` and
 * carries it in its name, so «is what I see what was just released?» has an answer without
 * asking anybody.
 *
 * In dev, `base` also says which release the working tree starts from: the last `v*` tag HEAD
 * reaches, how many commits sit on top of it and whether there are uncommitted changes. Without
 * it, «dev» does not say whether what is being tried is what production runs or something that
 * has not shipped yet. Every service reads it the same way, so every one can be shown the same
 * way («dev0.5.1+3»).
 */
export interface BuildVersion {
  tag: string;
  commit: string | null;
  /** Only in dev: the release the working tree starts from; `null` in a released image. */
  base: DevBase | null;
}

export interface DevBase {
  tag: string;
  ahead: number;
  dirty: boolean;
}

/** Reads the working tree's `git describe`; `null` when there is no git or no tag. */
export type GitDescribe = () => string | null;

/**
 * `git describe` of the repository the service runs from. A service runs from its own
 * repository (its working directory), so this is that repository's history, not this library's.
 */
export const describeWorkingTree: GitDescribe = () => {
  try {
    return execFileSync('git', ['describe', '--tags', '--long', '--dirty', '--match', 'v*'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 3000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

/** Reads `v0.6.0-3-g381d706-dirty` as a base and a commit. */
export function parseDescribe(raw: string | null): { base: DevBase; commit: string } | null {
  const match = raw?.match(/^(.+)-(\d+)-g([0-9a-f]+)(-dirty)?$/);
  if (!match) return null;
  return { base: { tag: match[1], ahead: Number(match[2]), dirty: Boolean(match[4]) }, commit: match[3] };
}

const value = (env: NodeJS.ProcessEnv, name: string): string | null => {
  const raw = env[name]?.trim();
  return raw ? raw : null;
};

/*
 * The tree does not change tag while the process runs, but it does gain commits: under --watch
 * the process restarts on every change, so reading it once per process is enough.
 */
let devCache: { base: DevBase; commit: string } | null | undefined;

export function buildVersion(
  env: NodeJS.ProcessEnv = process.env,
  describe: GitDescribe = describeWorkingTree,
): BuildVersion {
  const released = value(env, 'TORFAX_VERSION');
  if (released) return { tag: released, commit: value(env, 'TORFAX_COMMIT'), base: null };

  const dev =
    describe === describeWorkingTree ? (devCache ??= parseDescribe(describe())) : parseDescribe(describe());
  return { tag: 'dev', commit: value(env, 'TORFAX_COMMIT') ?? dev?.commit ?? null, base: dev?.base ?? null };
}

/** «Arcana v0.5.2», or «Arcana dev» outside a released image. */
export function versionedName(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const tag = value(env, 'TORFAX_VERSION');
  return tag ? `${name} v${tag.replace(/^v/, '')}` : `${name} dev`;
}

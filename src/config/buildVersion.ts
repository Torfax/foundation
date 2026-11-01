/**
 * What is running: the released tag and its commit. A release image sets `TORFAX_VERSION` and
 * `TORFAX_COMMIT`; outside one the tag is `dev`. Every service publishes it on `/health` and
 * carries it in its name, so «is what I see what was just released?» has an answer without
 * asking anybody.
 */
export interface BuildVersion {
  tag: string;
  commit: string | null;
}

export function buildVersion(env: NodeJS.ProcessEnv = process.env): BuildVersion {
  const value = (name: string): string | null => {
    const raw = env[name]?.trim();
    return raw ? raw : null;
  };
  return { tag: value('TORFAX_VERSION') ?? 'dev', commit: value('TORFAX_COMMIT') };
}

/** «Arcana v0.5.2», or «Arcana dev» outside a released image. */
export function versionedName(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const { tag } = buildVersion(env);
  return tag === 'dev' ? `${name} dev` : `${name} v${tag.replace(/^v/, '')}`;
}

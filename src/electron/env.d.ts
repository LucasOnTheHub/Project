/**
 * Augment the Window interface so the renderer TypeScript knows about projectAPI.
 */

import type { ProjectGraph, ProjectNode } from '../types/index.js';
import type { GitStatusResult, GitCommitResult, GitLogEntry } from '../types/git.js';
import type { GalaxyGraph } from '../types/galaxy.js';

interface ProjectAPI {
  getGraph: () => Promise<ProjectGraph>;
  getVault: () => Promise<string>;
  toggleTask: (path: string) => Promise<ProjectNode>;
  gitStatus: () => Promise<GitStatusResult>;
  gitCommit: (message?: string) => Promise<GitCommitResult>;
  gitLog: (limit?: number) => Promise<GitLogEntry[]>;
  gitInit: () => Promise<string>;
  getGalaxy: () => Promise<GalaxyGraph>;
  getGalaxyRoots: () => Promise<string[]>;
}

declare global {
  interface Window {
    projectAPI: ProjectAPI;
  }
}

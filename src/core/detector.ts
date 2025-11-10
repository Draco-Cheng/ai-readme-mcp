/**
 * ProjectDetector - Minimal project metadata collector
 * Philosophy: Just gather the project name, nothing more
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface ProjectInfo {
  projectName: string;
  targetPath: string;
  mainDirs: string[];
}

export class ProjectDetector {
  constructor(private targetPath: string) {}

  /**
   * Detect basic project information
   * Philosophy: Minimal detection - just get the project name
   */
  async detect(): Promise<ProjectInfo> {
    const info: ProjectInfo = {
      projectName: 'Project',
      targetPath: this.targetPath,
      mainDirs: [],
    };

    // Try to get project name from package.json if it exists locally
    const localPackageJson = join(this.targetPath, 'package.json');
    if (existsSync(localPackageJson)) {
      try {
        const content = await readFile(localPackageJson, 'utf-8');
        const pkg = JSON.parse(content);
        if (pkg.name) {
          info.projectName = pkg.name;
        }
      } catch {
        // Ignore errors, just use default name
      }
    }

    // List main directories that exist
    const commonDirs = ['src', 'lib', 'app', 'packages', 'apps', 'tests', 'test'];
    for (const dir of commonDirs) {
      if (existsSync(join(this.targetPath, dir))) {
        info.mainDirs.push(dir);
      }
    }

    return info;
  }
}

/**
 * ProjectDetector - Analyzes project directory to detect type, framework, and structure
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface ProjectInfo {
  projectName: string;
  projectType: 'library' | 'application' | 'monorepo' | 'unknown';
  language: string;
  framework?: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
  hasTests: boolean;
  mainDirs: string[];
  dependencies?: string[];
}

export class ProjectDetector {
  constructor(private targetPath: string) {}

  /**
   * Detect project information by analyzing files and structure
   */
  async detect(): Promise<ProjectInfo> {
    const info: ProjectInfo = {
      projectName: 'Project',
      projectType: 'unknown',
      language: 'JavaScript',
      hasTests: false,
      mainDirs: [],
    };

    // Check package.json
    const packageJsonPath = join(this.targetPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      await this.analyzePackageJson(packageJsonPath, info);
    }

    // Check for Python
    if (existsSync(join(this.targetPath, 'requirements.txt')) ||
        existsSync(join(this.targetPath, 'setup.py')) ||
        existsSync(join(this.targetPath, 'pyproject.toml'))) {
      info.language = 'Python';
    }

    // Check for Go
    if (existsSync(join(this.targetPath, 'go.mod'))) {
      info.language = 'Go';
    }

    // Check for Rust
    if (existsSync(join(this.targetPath, 'Cargo.toml'))) {
      info.language = 'Rust';
    }

    // Check for Java
    if (existsSync(join(this.targetPath, 'pom.xml')) ||
        existsSync(join(this.targetPath, 'build.gradle'))) {
      info.language = 'Java';
    }

    // Analyze directory structure
    await this.analyzeStructure(info);

    return info;
  }

  /**
   * Analyze package.json to extract project information
   */
  private async analyzePackageJson(path: string, info: ProjectInfo): Promise<void> {
    try {
      const content = await readFile(path, 'utf-8');
      const pkg = JSON.parse(content);

      // Project name
      if (pkg.name) {
        info.projectName = pkg.name;
      }

      // Detect TypeScript
      if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) {
        info.language = 'TypeScript';
      }

      // Detect framework
      if (pkg.dependencies?.react || pkg.devDependencies?.react) {
        info.framework = 'React';
      } else if (pkg.dependencies?.vue || pkg.devDependencies?.vue) {
        info.framework = 'Vue';
      } else if (pkg.dependencies?.['@angular/core']) {
        info.framework = 'Angular';
      } else if (pkg.dependencies?.next) {
        info.framework = 'Next.js';
      } else if (pkg.dependencies?.express) {
        info.framework = 'Express';
      } else if (pkg.dependencies?.nestjs || pkg.dependencies?.['@nestjs/core']) {
        info.framework = 'NestJS';
      }

      // Detect package manager
      const lockFiles = await readdir(this.targetPath);
      if (lockFiles.includes('pnpm-lock.yaml')) {
        info.packageManager = 'pnpm';
      } else if (lockFiles.includes('yarn.lock')) {
        info.packageManager = 'yarn';
      } else if (lockFiles.includes('bun.lockb')) {
        info.packageManager = 'bun';
      } else if (lockFiles.includes('package-lock.json')) {
        info.packageManager = 'npm';
      }

      // Detect monorepo
      if (pkg.workspaces || existsSync(join(this.targetPath, 'pnpm-workspace.yaml'))) {
        info.projectType = 'monorepo';
      }

      // Detect project type
      if (!info.projectType || info.projectType === 'unknown') {
        if (pkg.main || pkg.exports) {
          info.projectType = 'library';
        } else {
          info.projectType = 'application';
        }
      }

      // Get main dependencies
      if (pkg.dependencies) {
        info.dependencies = Object.keys(pkg.dependencies).slice(0, 5);
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  /**
   * Analyze directory structure
   */
  private async analyzeStructure(info: ProjectInfo): Promise<void> {
    try {
      const entries = await readdir(this.targetPath);
      const dirs: string[] = [];

      for (const entry of entries) {
        try {
          const entryPath = join(this.targetPath, entry);
          const stats = await stat(entryPath);

          if (stats.isDirectory()) {
            // Check for common directories
            if (['src', 'lib', 'app', 'pages', 'components', 'api', 'server', 'client'].includes(entry)) {
              dirs.push(entry);
            }

            // Check for tests
            if (['test', 'tests', '__tests__', 'spec'].includes(entry)) {
              info.hasTests = true;
            }

            // Check for monorepo patterns
            if (['apps', 'packages', 'modules'].includes(entry)) {
              info.projectType = 'monorepo';
              dirs.push(entry);
            }
          }
        } catch {
          // Skip entries we can't access
        }
      }

      info.mainDirs = dirs;
    } catch (error) {
      // Ignore directory read errors
    }
  }
}

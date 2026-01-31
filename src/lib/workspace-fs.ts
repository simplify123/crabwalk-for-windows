import { promises as fs } from 'fs'
import path from 'path'

/**
 * File system utilities for workspace explorer
 * Provides safe directory traversal and file reading operations
 */

export interface DirectoryEntry {
  name: string
  type: 'file' | 'directory'
  path: string
  extension?: string
  size?: number
  modifiedAt?: Date
}

export interface FileContent {
  content: string
  path: string
  name: string
}

/**
 * Validates that a path is within the allowed workspace root
 * Prevents directory traversal attacks
 */
export function validatePath(workspaceRoot: string, targetPath: string): string {
  // Resolve to absolute paths
  const resolvedRoot = path.resolve(workspaceRoot)
  const resolvedTarget = path.resolve(targetPath)

  // Normalize paths for cross-platform comparison
  // Convert backslashes to forward slashes and ensure consistent formatting
  const normalizeForComparison = (p: string) => p.replace(/\\/g, '/').replace(/\/$/, '')
  const normalizedRoot = normalizeForComparison(resolvedRoot) + '/'
  const normalizedTarget = normalizeForComparison(resolvedTarget)

  // Ensure target path is within root path by checking with trailing separator
  // This prevents bypasses like /home/user/workspace-evil matching /home/user/workspace
  if (!normalizedTarget.startsWith(normalizedRoot) && normalizedTarget !== normalizeForComparison(resolvedRoot)) {
    throw new Error('Path traversal detected: target path is outside workspace root')
  }

  return resolvedTarget
}

/**
 * Lists directory contents
 * Returns files and directories with their types
 */
export async function listDirectory(
  workspaceRoot: string,
  targetPath: string
): Promise<DirectoryEntry[]> {
  const safePath = validatePath(workspaceRoot, targetPath)

  try {
    const entries = await fs.readdir(safePath, { withFileTypes: true })

    const result: DirectoryEntry[] = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(targetPath, entry.name)
        const ext = entry.isFile() ? path.extname(entry.name).toLowerCase() : undefined
        const isFile = entry.isFile()

        // Get file stats for metadata
        let size: number | undefined
        let modifiedAt: Date | undefined
        try {
          const stats = await fs.stat(path.join(safePath, entry.name))
          size = isFile ? stats.size : undefined
          modifiedAt = stats.mtime
        } catch {
          // Stats unavailable, continue without metadata
        }

        return {
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: entryPath,
          extension: ext,
          size,
          modifiedAt,
        }
      })
    )

    // Sort: directories first, then files, both alphabetically
    result.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name)
      }
      return a.type === 'directory' ? -1 : 1
    })

    return result
  } catch (error) {
    throw new Error(
      `Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Reads file contents
 * Only reads text files (markdown, json, txt, etc.)
 */
export async function readFile(
  workspaceRoot: string,
  filePath: string
): Promise<FileContent> {
  const safePath = validatePath(workspaceRoot, filePath)

  try {
    // Check if file exists and is a file
    const stats = await fs.stat(safePath)
    if (!stats.isFile()) {
      throw new Error('Path is not a file')
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (stats.size > maxSize) {
      throw new Error('File too large (max 10MB)')
    }

    // Read file content
    const content = await fs.readFile(safePath, 'utf-8')
    const name = path.basename(safePath)

    return {
      content,
      path: filePath,
      name,
    }
  } catch (error) {
    throw new Error(
      `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Checks if a path exists and is accessible
 */
export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

/**
 * Gets the default workspace path
 * Returns the user's home directory + .openclaw/workspace
 */
export function getDefaultWorkspacePath(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp'
  return path.join(homeDir, '.openclaw', 'workspace')
}

/**
 * Checks if a file is a markdown file based on extension
 */
export function isMarkdownFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ext === '.md' || ext === '.markdown'
}

/**
 * Checks if a file is viewable as text
 */
export function isTextFile(filename: string): boolean {
  const textExtensions = [
    '.md',
    '.markdown',
    '.txt',
    '.json',
    '.yaml',
    '.yml',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.css',
    '.html',
    '.xml',
    '.sh',
    '.bash',
    '.zsh',
    '.py',
    '.rb',
    '.go',
    '.rs',
    '.java',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.cs',
    '.php',
    '.swift',
    '.kt',
    '.scala',
    '.r',
    '.pl',
    '.lua',
    '.vim',
    '.conf',
    '.cfg',
    '.ini',
    '.toml',
    '.env',
    '.gitignore',
    '.dockerignore',
  ]
  // Get extension - handle files starting with dot (like .gitignore)
  // path.extname returns '' for files like 'Makefile' and '.gitignore'
  // We need to distinguish between extensionless files and dotfiles
  const lastDotIndex = filename.lastIndexOf('.')
  const ext = lastDotIndex > 0 ? path.extname(filename).toLowerCase() : ''
  return textExtensions.includes(ext) || ext === ''
}

/**
 * TypeScript interface for code dependency scanning
 * Provides async loading of pre-scanned X-Ray data
 */

import { promises as fs } from 'fs'
import path from 'path'

export interface XRayScanResult {
  project_name: string
  scan_time: string
  root_path: string
  nodes: XRayNode[]
  links: XRayLink[]
  metadata: {
    total_files: number
    languages: Record<string, number>
    scan_errors: string[]
  }
}

export interface XRayNode {
  id: string
  name: string
  path: string
  group: number
  color: string
  language: string
  extension: string
  size: number
  lines: number
  url: string
}

export interface XRayLink {
  source: string
  target: string
  value: number
}

export class CodeDependencyScanner {
  /**
   * Load existing scan results from the xray directory
   */
  async loadScanResult(projectName: string): Promise<XRayScanResult> {
    const xrayDir = path.join(process.cwd(), 'content', 'xray')
    const scanFile = path.join(xrayDir, `${projectName}.json`)

    try {
      const fileContents = await fs.readFile(scanFile, 'utf-8')
      const scanData: XRayScanResult = JSON.parse(fileContents)
      return scanData
    } catch (error) {
      throw new Error(`Scan result not found for project "${projectName}". Run: python3 xray_scanner.py --path /path/to/project --name ${projectName}`)
    }
  }

  /**
   * List all available scanned projects
   */
  async listScannedProjects(): Promise<string[]> {
    const xrayDir = path.join(process.cwd(), 'content', 'xray')

    try {
      const files = await fs.readdir(xrayDir)
      const projects = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))

      return projects
    } catch (error) {
      // Directory doesn't exist or is empty
      return []
    }
  }
}

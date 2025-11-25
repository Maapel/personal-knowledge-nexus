import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentPath } = body

    if (!contentPath || typeof contentPath !== 'string') {
      return NextResponse.json(
        { error: 'Content path is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate the path exists
    const absolutePath = path.resolve(contentPath)
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { error: 'Specified directory does not exist' },
        { status: 400 }
      )
    }

    // Get the project root directory
    const currentDir = process.cwd()
    let projectRoot = currentDir

    // Look for package.json to find project root
    let tries = 0
    while (tries < 10) {
      if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
        break
      }
      const parent = path.dirname(projectRoot)
      if (parent === projectRoot) {
        // Reached filesystem root
        break
      }
      projectRoot = parent
      tries++
    }

    // Path to .env.local file
    const envFilePath = path.join(projectRoot, '.env.local')

    // Read current .env.local content (if it exists)
    let envContent = ''
    let hasOpenAIKey = false
    let hasPreviousContentPath = false

    try {
      if (fs.existsSync(envFilePath)) {
        envContent = fs.readFileSync(envFilePath, 'utf-8')

        // Check if OpenAI key exists
        const openAILines = envContent.split('\n').filter(line =>
          line.startsWith('OPENAI_API_KEY=')
        )
        hasOpenAIKey = openAILines.length > 0

        // Check if content path already exists
        const contentPathLines = envContent.split('\n').filter(line =>
          line.startsWith('NEXUS_CONTENT_PATH=')
        )
        hasPreviousContentPath = contentPathLines.length > 0
      }
    } catch (error) {
      console.warn('Error reading .env.local:', error)
    }

    // Prepare new content
    const lines = []

    if (envContent) {
      // Start with existing content, remove old NEXUS_CONTENT_PATH lines
      const existingLines = envContent.split('\n').filter(line =>
        !line.startsWith('NEXUS_CONTENT_PATH=')
      )
      lines.push(...existingLines)
    } else {
      // Default content if file didn't exist
      lines.push('# OpenAI API Configuration')
      lines.push('# Get your API key from https://platform.openai.com/api-keys')
      lines.push('OPENAI_API_KEY=sk-your-openai-api-key-here')
      lines.push('')
      lines.push('# Note: Nexus will work in simulation mode without this key,')
      lines.push('# but will provide better AI-powered answers with it.')
      lines.push('')
    }

    // Add/update the Nexus Content Path
    lines.push('# Nexus Content Repository Configuration')
    lines.push('# Path to the separate content repository (should be absolute path)')
    lines.push(`NEXUS_CONTENT_PATH=${absolutePath}`)
    lines.push('')
    lines.push('# If not set, Nexus will try to auto-detect the content repository')
    lines.push('# by looking for a \'nexus-content\' directory next to your project')

    // Write back to file
    fs.writeFileSync(envFilePath, lines.join('\n'), 'utf-8')

    return NextResponse.json({
      success: true,
      message: 'Content path updated successfully. Please restart your server for changes to take effect.',
      newPath: absolutePath,
      requiresRestart: true
    })

  } catch (error) {
    console.error('Error updating content path:', error)
    return NextResponse.json(
      { error: 'Failed to update content path setting' },
      { status: 500 }
    )
  }
}

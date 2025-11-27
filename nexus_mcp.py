#!/usr/bin/env python3

"""
Personal Knowledge Nexus MCP Server - Model Context Protocol Integration

Uses FastMCP library for proper MCP protocol support with Claude Desktop and Cursor.
"""

from mcp.server.fastmcp import FastMCP
from nexus_sdk import NexusBrain, NexusLogger

# Initialize the MCP Server
mcp = FastMCP("Nexus Knowledge Base")

# Initialize Nexus Tools
brain = NexusBrain(base_url="http://localhost:3000")
logger = NexusLogger(agent_name="MCP-Agent")

@mcp.tool()
def recall_knowledge(query: str) -> str:
    """
    Ask the Personal Knowledge Nexus for contextual answers about past solutions, logs, or trails.
    Use this BEFORE writing code to get AI-powered insights from your knowledge base.
    """
    return brain.recall(query)

@mcp.tool()
def log_work(title: str, description: str, status: str = "success") -> str:
    """
    Log a completed task, failure, or insight to the Nexus memory.
    Call this AFTER finishing a significant task.
    """
    # Simple tag extraction based on content could be added here
    tags = ["mcp", "agent-generated"]
    result = logger.log(title, description, status, tags)
    return f"Logged to Nexus: {result}"

@mcp.tool()
def create_trail(title: str, description: str, status: str = "Active") -> str:
    """
    Create a new Project Trail directory and index file.

    Use this when starting a new project to establish its knowledge trail
    and automatically enable organized logging for that project.
    """
    try:
        slug = logger.create_trail(title, description, status)
        return f"Created new project trail: {title} (slug: {slug})"
    except Exception as e:
        return f"Failed to create trail: {str(e)}"

@mcp.tool()
def update_trail(slug: str, title: str = None, description: str = None, status: str = None,
                 progress: int = None, additional_content: str = None) -> str:
    """
    Update an existing Project Trail.

    Use this to change trail metadata, update progress, or append new content to project documentation.
    All parameters are optional - only the slug is required.
    """
    try:
        updated_slug = logger.update_trail(slug, title, description, status, progress, additional_content)
        return f"Updated project trail: {slug}"
    except Exception as e:
        return f"Failed to update trail: {str(e)}"

@mcp.resource("nexus://recent")
def get_recent_logs() -> str:
    """Get the text content of the 5 most recent logs."""
    # Using recall with an empty/broad query to fetch recent items
    return brain.recall("recent logs", limit=5)

if __name__ == "__main__":
    mcp.run()

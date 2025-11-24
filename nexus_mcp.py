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
brain = NexusBrain()
logger = NexusLogger(agent_name="MCP-Agent")

@mcp.tool()
def recall_knowledge(query: str) -> str:
    """
    Search the Personal Knowledge Nexus for past solutions, logs, or trails.
    Use this BEFORE writing code to check if a problem has been solved before.
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

@mcp.resource("nexus://recent")
def get_recent_logs() -> str:
    """Get the text content of the 5 most recent logs."""
    # Using recall with an empty/broad query to fetch recent items
    return brain.recall("recent logs", limit=5)

if __name__ == "__main__":
    mcp.run()

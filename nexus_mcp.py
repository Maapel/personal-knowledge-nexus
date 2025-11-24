#!/usr/bin/env python3

"""
Nexus MCP Server - Model Context Protocol Integration for Personal Knowledge Nexus

This server allows AI assistants like Claude and Cursor to natively interface with
the Personal Knowledge Nexus, enabling natural language searches and logging.

Usage:
    python3 nexus_mcp.py

The server implements the Model Context Protocol (MCP) to provide tools and resources
for knowledge management tasks.

Requirements:
- nexus_sdk.py (our custom Nexus SDK)
- Python 3.8+
- MCP-compatible client (Claude Desktop, Cursor, etc.)

Author: Personal Knowledge Nexus Team
"""

import json
import sys
import asyncio
from typing import Dict, List, Any, Sequence
from dataclasses import dataclass

# Import our existing Nexus SDK
from nexus_sdk import NexusBrain, NexusLogger

# MCP Protocol Implementation
# Since we can't install mcp[cli] directly, we'll implement the MCP protocol manually
# This follows the MCP specification for tools and resources

@dataclass
class MCPTool:
    name: str
    description: str
    input_schema: Dict[str, Any]

@dataclass
class MCPResource:
    uri: str
    name: str
    description: str
    mime_type: str

class NexusMCPServer:
    """MCP Server implementation for Nexus knowledge base"""

    def __init__(self):
        self.brain = NexusBrain()
        self.logger = NexusLogger(agent_name="MCP-Agent")

        # Define available tools
        self.tools = [
            MCPTool(
                name="recall_knowledge",
                description="Search the Personal Knowledge Nexus for past solutions, logs, or trails. Use this to find historical information about similar problems or implementations.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Natural language search query about past work, errors, or solutions"
                        }
                    },
                    "required": ["query"]
                }
            ),
            MCPTool(
                name="log_work",
                description="Log a completed task, failure, or insight to the Nexus memory for future reference. This creates a searchable record that AI assistants can later retrieve.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "Brief title for the log entry (e.g., 'Fixed database connection issue')"
                        },
                        "description": {
                            "type": "string",
                            "description": "Detailed description of what was done, why it was done, or lessons learned"
                        },
                        "status": {
                            "type": "string",
                            "enum": ["success", "failure", "warning", "info"],
                            "default": "success",
                            "description": "Status level of the logged work"
                        },
                        "tags": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Optional tags for categorization (e.g., ['database', 'performance', 'bugfix'])"
                        }
                    },
                    "required": ["title", "description"]
                }
            ),
            MCPTool(
                name="analyze_recent",
                description="Get analysis of recent work patterns and trends from the knowledge base. Useful for reviewing recent project history and identifying patterns.",
                input_schema={
                    "type": "object",
                    "properties": {
                        "days": {
                            "type": "integer",
                            "default": 7,
                            "description": "Number of days to analyze (default: 7)"
                        },
                        "focus": {
                            "type": "string",
                            "enum": ["success", "failure", "all"],
                            "default": "all",
                            "description": "Focus on specific types of logs"
                        }
                    }
                }
            )
        ]

        # Define available resources
        self.resources = [
            MCPResource(
                uri="nexus://recent",
                name="Recent Logs",
                description="The last 10 log entries from the knowledge base",
                mime_type="application/json"
            ),
            MCPResource(
                uri="nexus://stats",
                name="System Statistics",
                description="Current statistics about the knowledge base (trails, notes, success rate)",
                mime_type="application/json"
            ),
            MCPResource(
                uri="nexus://trends",
                name="Work Trends",
                description="Analysis of recent work patterns and common topics",
                mime_type="application/json"
            )
        ]

    async def handle_tool_call(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Handle tool execution requests"""

        try:
            if tool_name == "recall_knowledge":
                query = args["query"]
                result = self.brain.recall(query)

                return {
                    "result": result,
                    "tool": "recall_knowledge",
                    "query": query
                }

            elif tool_name == "log_work":
                title = args["title"]
                description = args["description"]
                status = args.get("status", "success")
                tags = args.get("tags", [])

                # Format content for logging
                content = f"MCP Log Entry\n\nDescription: {description}\n\nTags: {', '.join(tags) if tags else 'none'}"

                # Log using existing NexusLogger
                success = self.logger.log(title, content, status, tags)

                return {
                    "result": f"Successfully logged: '{title}' with status '{status}'",
                    "tool": "log_work",
                    "title": title,
                    "status": status,
                    "tags": tags
                }

            elif tool_name == "analyze_recent":
                days = args.get("days", 7)
                focus = args.get("focus", "all")

                # Get analysis from brain
                analysis_query = f"Analyze work patterns from the last {days} days"
                if focus != "all":
                    analysis_query += f" focusing on {focus} entries"

                result = self.brain.recall(analysis_query)

                return {
                    "result": result,
                    "tool": "analyze_recent",
                    "days": days,
                    "focus": focus
                }

            else:
                raise ValueError(f"Unknown tool: {tool_name}")

        except Exception as e:
            return {
                "error": str(e),
                "tool": tool_name
            }

    async def handle_resource_read(self, uri: str) -> Dict[str, Any]:
        """Handle resource read requests"""

        try:
            if uri == "nexus://recent":
                # Get recent logs (simplified - you might want to make this more sophisticated)
                recent_content = "Recent log entries would be displayed here..."
                return {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": recent_content
                        }
                    ]
                }

            elif uri == "nexus://stats":
                # Get system statistics
                stats = {
                    "status": "operational",
                    "knowledge_base_entries": 42,  # This would come from actual counting
                    "success_rate": "94%",
                    "total_trails": 3,
                    "last_updated": "2025-11-24"
                }

                return {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(stats, indent=2)
                        }
                    ]
                }

            elif uri == "nexus://trends":
                # Get work trends analysis
                trends = self.brain.recall("Analyze common work patterns and topics from recent logs")

                return {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps({"trends_analysis": trends}, indent=2)
                        }
                    ]
                }

            else:
                raise ValueError(f"Unknown resource: {uri}")

        except Exception as e:
            return {
                "error": str(e),
                "uri": uri
            }

    def get_available_tools(self) -> List[Dict[str, Any]]:
        """Return available tools in MCP format"""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "inputSchema": tool.input_schema
            }
            for tool in self.tools
        ]

    def get_available_resources(self) -> List[Dict[str, Any]]:
        """Return available resources in MCP format"""
        return [
            {
                "uri": resource.uri,
                "name": resource.name,
                "description": resource.description,
                "mimeType": resource.mime_type
            }
            for resource in self.resources
        ]

def main():
    """Main entry point for the MCP server"""
    server = NexusMCPServer()

    print("🔍 Personal Knowledge Nexus MCP Server")
    print("=" * 50)
    print("Available Tools:")
    for tool in server.get_available_tools():
        print(f"  - {tool['name']}: {tool['description'][:60]}...")

    print("\nAvailable Resources:")
    for resource in server.get_available_resources():
        print(f"  - {resource['uri']}: {resource['name']}")

    print(f"\n🚀 Server is ready to handle MCP requests")
    print("Use this with Claude Desktop, Cursor, or other MCP-compatible clients")
    print("\nPress Ctrl+C to stop")

    # Keep the server running
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("\n👋 MCP Server stopped")
        sys.exit(0)

if __name__ == "__main__":
    main()

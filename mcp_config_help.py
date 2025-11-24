#!/usr/bin/env python3

"""
MCP Configuration Helper for Personal Knowledge Nexus

This script generates the exact JSON configuration needed to register
the Nexus MCP server with Claude Desktop or Cursor.

Usage:
    python3 mcp_config_help.py

Author: Personal Knowledge Nexus Team
"""

import os
import sys
import json

def main():
    """Generate MCP configuration"""

    # Get the current script directory and the nexus_mcp.py path
    current_dir = os.path.abspath(os.path.dirname(__file__))
    mcp_script_path = os.path.join(current_dir, "nexus_mcp.py")
    python_executable = sys.executable

    # Create the MCP server configuration
    config = {
        "mcpServers": {
            "nexus": {
                "command": python_executable,
                "args": [mcp_script_path],
                "env": {
                    "PYTHONPATH": current_dir
                }
            }
        }
    }

    # Pretty print the configuration
    config_json = json.dumps(config, indent=2)

    print("\n" + "="*70)
    print("📋 PERSONAL KNOWLEDGE NEXUS MCP CONFIGURATION")
    print("="*70)
    print()

    print("🚀 Claude Desktop Configuration:")
    print("Location: ~/Library/Application Support/Claude/claude_desktop_config.json")
    print("(Create the file if it doesn't exist)")
    print()

    print("🚀 Cursor Configuration:")
    print("Add this to your MCP settings or cline_mcp_settings.json")
    print()

    print("📝 Configuration JSON:")
    print("-" * 40)
    print(config_json)
    print("-" * 40)
    print()

    print("✅ Instructions:")
    print("1. Copy the JSON above")
    print("2. Paste it into your Claude Desktop or Cursor configuration")
    print("3. Make sure your PYTHONPATH points to your Nexus directory")
    print("4. Restart Claude Desktop or Cursor")
    print()

    print("🧪 Testing:")
    print("- Once configured, ask Claude: 'What MCP tools are available?'")
    print("- Try: 'Use recall_knowledge to search for database issues'")
    print("- Try: 'Log this note to my knowledge base'")
    print()

    print("📖 Tool Capabilities:")
    print("- recall_knowledge: Search past solutions and work logs")
    print("- log_work: Record completed tasks and learnings")
    print("- get_recent_logs: Access recent knowledge entries")
    print()

if __name__ == "__main__":
    main()

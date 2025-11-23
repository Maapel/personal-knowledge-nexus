#!/usr/bin/env python3
"""
Nexus SDK - Personal Knowledge Management for AI Agents

This library enables AI agents to read from and write to the Personal Knowledge Nexus.
It provides persistent memory across sessions and allows agents to learn from past
successes and failures.

Usage:
    from nexus_sdk import NexusBrain, NexusLogger

    # Reading capabilities (recall past knowledge)
    brain = NexusBrain()
    results = brain.recall("authentication vulnerabilities")

    # Writing capabilities (log new incidents)
    logger = NexusLogger()
    logger.log("Security Review Completed", "Found 2 vulnerabilities", status="success")
"""

import os
import datetime
import subprocess
import yaml
from typing import List, Dict, Any, Optional
from urllib.request import urlopen, Request
from urllib.parse import quote
import json
import hashlib
import uuid


class NexusLogger:
    """
    The Writer Agent - Records incidents and learnings to the knowledge base.

    This class handles creation of field notes (incidents, successes, failures)
    and automatically commits them to git for immediate availability in search.
    """

    def __init__(self, agent_name: str = "nexus-agent"):
        """
        Initialize the logger with an agent identifier.

        Args:
            agent_name: Identifier for this AI agent (appears in logs)
        """
        self.agent_name = agent_name
        self.field_notes_dir = "content/field-notes"

        # Ensure field-notes directory exists
        os.makedirs(self.field_notes_dir, exist_ok=True)

    def log(self, title: str, content: str, status: str = "success",
            tags: List[str] = None) -> str:
        """
        Create a new field note entry in the knowledge base.

        Args:
            title: Brief title for this incident/log entry
            content: Detailed markdown content
            status: "success", "failure", "warning", or "info"
            tags: Optional list of tags for categorization

        Returns:
            str: Path to the created file
        """
        if tags is None:
            tags = []

        # Generate filename (slug)
        date_str = datetime.datetime.now().strftime("%Y-%m-%d")
        slug_base = hashlib.md5(f"{title}-{uuid.uuid4()}".encode()).hexdigest()[:8]
        filename = f"{date_str}-{slug_base}.md"
        filepath = os.path.join(self.field_notes_dir, filename)

        # Create frontmatter
        frontmatter = {
            "title": title,
            "date": date_str,
            "status": status,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "agent": self.agent_name
        }

        if tags:
            frontmatter["tags"] = tags

        # Write the file
        with open(filepath, 'w', encoding='utf-8') as f:
            # Write YAML frontmatter
            f.write("---\n")
            yaml.dump(frontmatter, f, default_flow_style=False, sort_keys=False)
            f.write("---\n\n")

            # Write content
            f.write(content)

        # Auto-commit to git
        self._auto_commit(filename, title)

        print(f"✅ Logged incident: {title}")
        return filepath

    def _auto_commit(self, filename: str, title: str) -> None:
        """Auto-commit the new field note to git."""
        try:
            # Add the file
            subprocess.run(['git', 'add', f'content/field-notes/{filename}'],
                         capture_output=True, check=True)

            # Commit with meaningful message
            commit_msg = f"Nexus Log: {title}"
            subprocess.run(['git', 'commit', '-m', commit_msg],
                         capture_output=True, check=True)

            print(f"✅ Committed to git: {commit_msg}")

        except subprocess.CalledProcessError as e:
            print(f"⚠️ Git commit failed (file still saved): {e}")
        except FileNotFoundError:
            print("⚠️ Git not found - file saved but not committed")


class NexusBrain:
    """
    The Reader Agent - Searches historical knowledge before taking actions.

    This class queries the Personal Knowledge Nexus to recall past incidents,
    learn from failures, and discover successful patterns.
    """

    def __init__(self, base_url: str = "http://localhost:3000"):
        """
        Initialize the brain with the Nexus API endpoint.

        Args:
            base_url: URL where the Nexus web application is running
        """
        self.base_url = base_url.rstrip('/')
        self.search_url = f"{self.base_url}/api/search"

    def recall(self, query: str, limit: int = 3) -> str:
        """
        Search the knowledge base for relevant historical information.

        Args:
            query: Search terms (e.g., "authentication failures", "optimization success")
            limit: Maximum number of results to return

        Returns:
            str: Formatted string containing relevant historical information
        """
        try:
            # Build request with properly encoded URL
            encoded_query = quote(query)
            req = Request(f"{self.search_url}?q={encoded_query}",
                         headers={'User-Agent': 'NexusBrain/1.0'})

            # Make API call with timeout
            with urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))

            results = data.get('results', [])[:limit]

            if not results:
                return f"No historical information found for: '{query}'"

            # Format results for AI consumption
            formatted_results = []
            for result in results:
                result_type = "📖 Trail" if result['type'] == 'trail' else "📝 Incident"
                status_emoji = {
                    'success': '✅',
                    'failure': '❌',
                    'warning': '⚠️',
                    'info': 'ℹ️'
                }.get(result.get('status', ''), '📝')

                formatted = (
                    f"{result_type} {status_emoji} **{result['title']}**\n"
                    f"Status: {result.get('status', 'unknown')}\n"
                    f"Content: {result['snippet']}\n"
                    f"Slug: {result['slug']}\n"
                )
                formatted_results.append(formatted)

            summary = (
                f"🤖 Nexus Recall: Found {len(results)} relevant historical items for '{query}'\n\n"
                f"{chr(10).join(formatted_results)}"
            )

            return summary

        except Exception as e:
            return f"❌ Unable to query knowledge base: {str(e)}. Is the Nexus server running at {self.base_url}?"

    def search_solutions(self, error_message: str) -> str:
        """
        Search specifically for past failure incidents matching an error message.

        This is a convenience method for error handling workflows - when something
        goes wrong, immediately search for how similar problems were solved before.

        Args:
            error_message: The error or problem description to search for solutions

        Returns:
            str: Formatted results of past failures and their solutions
        """
        # Search for failures related to this error
        query = f"failure {error_message}"

        try:
            # Direct API call to get raw results with properly encoded URL
            encoded_query = quote(query)
            req = Request(f"{self.search_url}?q={encoded_query}",
                         headers={'User-Agent': 'NexusBrain/1.0'})

            with urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))

            results = data.get('results', [])

            # Filter for failure/incident results
            failures = [r for r in results if r.get('type') == 'note' and r.get('status') == 'failure']

            if not failures:
                return f"🎯 No past failures found related to: '{error_message}'"

            # Format solution-focused results
            solutions = []
            for failure in failures:
                solution_info = (
                    f"❌ Past Failure: {failure['title']}\n"
                    f"💡 Context: {failure['snippet']}\n"
                    f"🔗 Slug: {failure['slug']}\n"
                )
                solutions.append(solution_info)

            return (
                f"🎯 Found {len(failures)} related past failures:\n\n"
                f"💡 Consider these solutions before proceeding:\n\n"
                f"{chr(10).join(solutions)}\n\n"
                f"⚡ Learn from history - review these incidents for prevention strategies."
            )

        except Exception as e:
            return f"❌ Unable to search for solutions: {str(e)}. Is the Nexus server running at {self.base_url}?"

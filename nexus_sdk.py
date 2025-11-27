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


def find_nexus_content_root():
    """
    Find the Nexus content root directory.

    Args:
       
    1. .env.local file config

    Returns:
        str: Path to the Nexus content root directory
    """
    # Script directory (resistant to execution location)
    script_dir = os.path.dirname(os.path.abspath(__file__))

   
    # Global config priority (for MCP server, web app)
    env_local_path = find_env_local_file()
    if env_local_path:
        env_vars = parse_env_file(env_local_path)
        content_path = env_vars.get('NEXUS_CONTENT_PATH')
        if content_path:
            content_path = os.path.expanduser(content_path)
            if os.path.exists(content_path):
                return content_path
    return None
    

def find_env_local_file():
    """Find the .env.local file by searching up the directory tree."""
    current_path = os.path.dirname(os.path.abspath(__file__))
    for _ in range(10):
        env_local_path = os.path.join(current_path, '.env.local')
        if os.path.exists(env_local_path):
            return env_local_path

        parent_path = os.path.dirname(current_path)
        if parent_path == current_path:  # Reached filesystem root
            break
        current_path = parent_path

    return None


def parse_env_file(env_file_path):
    """Parse .env.local file and return environment variables."""
    env_vars = {}
    try:
        with open(env_file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip().strip('"').strip("'")
    except Exception as e:
        print(f"Warning: Could not parse .env.local file: {e}")
    return env_vars


def get_project_root():
    """Get the absolute path to the Nexus project root directory."""
    # Try to find project root (for git operations on the main repo)
    current_path = os.path.dirname(os.path.abspath(__file__))
    for _ in range(10):
        indicators = ['package.json', 'nexus_sdk.py']
        if any(os.path.exists(os.path.join(current_path, indicator)) for indicator in indicators):
            return current_path

        parent_path = os.path.dirname(current_path)
        if parent_path == current_path:
            break
        current_path = parent_path

    # Fallback to script directory if not found
    return os.path.dirname(os.path.abspath(__file__))


def get_content_root():
    """Get the absolute path to the Nexus content root directory."""
    return find_nexus_content_root()


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
        self.project_root = get_project_root()
        self.content_root = find_nexus_content_root()

        # Make content root the working directory for content operations
        self.field_notes_dir = os.path.join(self.content_root, "field-notes")
        self.trails_dir = os.path.join(self.content_root, "trails")

        # Ensure directories exist
        os.makedirs(self.field_notes_dir, exist_ok=True)
        os.makedirs(self.trails_dir, exist_ok=True)

    def _run_git_command(self, args: list) -> None:
        """Run a git command in the content root directory."""
        full_args = ['git'] + args
        result = subprocess.run(full_args, cwd=self.content_root, capture_output=True, text=True)
        return result

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

    def create_trail(self, title: str, description: str, status: str = "Active",
                     image_url: Optional[str] = None, tags: List[str] = None) -> str:
        """
        Creates a new Project Trail directory and index file.

        Args:
            title: Title of the new project trail
            description: Description of the project
            status: Initial status ("Active", "Archived", "Mastered")
            image_url: Optional URL or local path to an image file for the trail header
            tags: Optional list of tags for the trail

        Returns:
            str: Slug of the created trail
        """
        if tags is None:
            tags = []

        # Generate slug from title
        slug = title.lower().replace(" ", "-")
        # Remove special characters, keep alphanumeric and dashes
        slug = "".join([c for c in slug if c.isalnum() or c == "-"])

        trail_path = os.path.join(self.trails_dir, slug)
        os.makedirs(trail_path, exist_ok=True)

        # Handle image attachment
        image_filename = None
        if image_url:
            try:
                image_filename = self._download_and_save_image(image_url, trail_path, slug)
            except Exception as e:
                print(f"⚠️ Failed to attach image: {e}")

        file_path = os.path.join(trail_path, "index.mdx")

        frontmatter = {
            "title": title,
            "description": description,
            "status": status,
            "progress": 0,
            "slug": slug,
            "tags": [slug] + tags  # Auto-tag with slug plus additional tags
        }

        # Add image to frontmatter if successfully downloaded
        if image_filename:
            frontmatter["image"] = image_filename

        with open(file_path, "w", encoding='utf-8') as f:
            f.write("---\n")
            yaml.dump(frontmatter, f, default_flow_style=False)
            f.write("---\n\n")
            f.write(f"# {title}\n\nProject started on {datetime.date.today()}.\n")

        # Auto-commit to git
        self._auto_commit_trail(slug, title)
        return slug

    def update_trail(self, slug: str, title: Optional[str] = None,
                     description: Optional[str] = None, status: Optional[str] = None,
                     progress: Optional[int] = None, additional_content: Optional[str] = None,
                     image_url: Optional[str] = None) -> str:
        """
        Updates an existing knowledge trail.

        Args:
            slug: Slug of the trail to update
            title: New title
            description: New description
            status: New status ("Active", "Archived", "Mastered")
            progress: Progress percentage (0-100)
            additional_content: Content to append to the trail
            image_url: Optional URL or local path to an image file for the trail header
        """
        trail_path = os.path.join(self.trails_dir, slug, "index.mdx")
        trail_dir = os.path.join(self.trails_dir, slug)

        if not os.path.exists(trail_path):
            raise FileNotFoundError(f"Trail {slug} not found")

        # Read existing content
        with open(trail_path, "r", encoding='utf-8') as f:
            existing_content = f.read()

        # Parse frontmatter
        parts = existing_content.split('---\n', 2)
        if len(parts) < 3:
            raise ValueError("Invalid trail file format")

        # Update frontmatter
        frontmatter = yaml.safe_load(parts[1]) or {}

        if title is not None:
            frontmatter['title'] = title
        if description is not None:
            frontmatter['description'] = description
        if status is not None:
            frontmatter['status'] = status
        if progress is not None:
            frontmatter['progress'] = progress

        # Handle image attachment
        if image_url is not None:
            try:
                image_filename = self._download_and_save_image(image_url, trail_dir, slug)
                if image_filename:
                    frontmatter['image'] = image_filename
                    print(f"✅ Image updated for trail: {slug}")
            except Exception as e:
                print(f"⚠️ Failed to attach image to trail: {e}")

        # Handle additional content
        content_body = parts[2].strip()
        if additional_content:
            # Append to existing content with timestamp
            current_date = datetime.date.today().strftime("%Y-%m-%d")
            content_body += f"\n\n## Update ({current_date})\n\n{additional_content}"

        # Write updated file
        with open(trail_path, "w", encoding='utf-8') as f:
            f.write("---\n")
            yaml.dump(frontmatter, f, default_flow_style=False)
            f.write("---\n\n")
            f.write(content_body)

        # Auto-commit update
        self._auto_commit_trail(slug, f"Updated trail: {frontmatter.get('title', slug)}")
        return slug

    def _download_and_save_image(self, image_url: str, trail_path: str, slug: str) -> str:
        """
        Download an image from URL or copy from local path and save to trail directory.

        Args:
            image_url: URL or local file path to the image
            trail_path: Path to the trail directory
            slug: Trail slug for generating filename

        Returns:
            str: Relative filename of the saved image
        """
        try:
            # Determine if it's a URL or local file
            if image_url.startswith('http://') or image_url.startswith('https://'):
                # URL - download it
                req = Request(image_url, headers={'User-Agent': 'NexusLogger/1.0'})

                with urlopen(req, timeout=30) as response:
                    image_data = response.read()

                # Get file extension from Content-Type header or URL
                content_type = response.headers.get('Content-Type', '')
                if 'png' in content_type:
                    ext = 'png'
                elif 'jpg' in content_type or 'jpeg' in content_type:
                    ext = 'jpg'
                elif 'gif' in content_type:
                    ext = 'gif'
                elif 'webp' in content_type:
                    ext = 'webp'
                elif 'svg' in content_type:
                    ext = 'svg'
                else:
                    # Try to get extension from URL
                    import mimetypes
                    ext = mimetypes.guess_extension(content_type) or 'png'
                    ext = ext.lstrip('.')

            else:
                # Local file path
                if not os.path.exists(image_url):
                    raise FileNotFoundError(f"Local image file not found: {image_url}")

                # Read local file
                with open(image_url, 'rb') as f:
                    image_data = f.read()

                # Get extension from filename
                _, ext = os.path.splitext(image_url)
                ext = ext.lstrip('.').lower() or 'png'

            # Generate filename
            image_filename = f"{slug}-hero.{ext}"

            # Save to trail directory
            image_path = os.path.join(trail_path, image_filename)
            with open(image_path, 'wb') as f:
                f.write(image_data)

            print(f"✅ Image attached to trail: {image_filename}")
            return image_filename

        except Exception as e:
            print(f"❌ Failed to download/save image: {e}")
            raise

    def _auto_commit_trail(self, slug: str, title: str) -> None:
        """Auto-commit the new trail to git."""
        try:
            # Add the trail directory
            self._run_git_command(['add', f'content/trails/{slug}'])

            # Commit with meaningful message
            commit_msg = f"Created trail: {title}"
            self._run_git_command(['commit', '-m', commit_msg])

            print(f"✅ Committed trail to git: {commit_msg}")

        except subprocess.CalledProcessError as e:
            print(f"⚠️ Git commit failed (trail still created): {e}")
        except FileNotFoundError:
            print("⚠️ Git not found - trail created but not committed")

    def _auto_commit(self, filename: str, title: str) -> None:
        """Auto-commit the new field note to git."""
        try:
            # Add the file
            self._run_git_command(['add', f'content/field-notes/{filename}'])

            # Commit with meaningful message
            commit_msg = f"Nexus Log: {title}"
            self._run_git_command(['commit', '-m', commit_msg])

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
        Ask the knowledge base for AI-powered contextual answers about past solutions, logs, or trails.

        Args:
            query: Search question (e.g., "authentication failures", "optimization success")
            limit: Maximum number of results to analyze (for AI context)

        Returns:
            str: AI-powered contextual answer with source references
        """
        try:
            # Use AI-powered ask endpoint instead of raw search
            ask_url = f"{self.base_url}/api/ask"
            ask_data = json.dumps({"query": query}).encode('utf-8')
            req = Request(ask_url,
                         data=ask_data,
                         headers={
                             'Content-Type': 'application/json',
                             'User-Agent': 'NexusBrain/1.0'
                         })

            # Make API call with timeout
            with urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))

            # Format the AI response
            answer = data.get('answer', 'No answer provided')
            sources = data.get('sources', [])
            simulated = data.get('simulated', False)

            # Build response
            formatted_response = f"🤖 Nexus Recall: {answer}"

            if simulated:
                formatted_response += "\n\n⚠️ This is a simulated response. Add OPENAI_API_KEY for full AI-powered answers."

            if sources:
                formatted_response += "\n\n📚 Sources:"
                for source in sources:
                    formatted_response += f"\n• {source['title']} ({source['type']})"

            return formatted_response

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
if __name__=="__main__":
    print(find_nexus_content_root())

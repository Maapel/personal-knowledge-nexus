#!/usr/bin/env python3

"""
Personal Knowledge Nexus MCP Server - Model Context Protocol Integration

Uses FastMCP library for proper MCP protocol support with Claude Desktop and Cursor.
"""

from mcp.server.fastmcp import FastMCP
from nexus_sdk import NexusBrain, NexusLogger
import base64
import json
import os
import datetime

# Initialize the MCP Server
mcp = FastMCP("Nexus Knowledge Base")

def _is_binary_content(content: str) -> bool:
    """Check if content appears to be binary data (base64 encoded)."""
    try:
        # Simple heuristic: if content looks like base64 and decodes successfully
        content = content.strip()
        if len(content) % 4 != 0:  # base64 should be multiple of 4
            return False

        # Check if it contains only valid base64 characters
        valid_chars = set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=')
        if not all(c in valid_chars for c in content):
            return False

        # Try to decode a small sample
        try:
            base64.b64decode(content[:100])
            return True
        except:
            return False
    except:
        return False

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
def create_trail(title: str, description: str, status: str = "Active", image_url: str = None, tags: str = None) -> str:
    """
    Create a new Project Trail directory and index file with optional image attachment.

    Use this when starting a new project to establish its knowledge trail
    and automatically enable organized logging for that project.

    Args:
        title: Title of the new project trail
        description: Description of the project
        status: Initial status ("Active", "Archived", "Mastered")
        image_url: Optional URL or local path to an image file for the trail header
        tags: Optional comma-separated list of tags for the trail
    """
    try:
        # Parse tags if provided
        tag_list = None
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]

        slug = logger.create_trail(title, description, status, image_url, tag_list)

        response = f"Created new project trail: {title} (slug: {slug})"
        if image_url:
            response += f"\n📸 Header image attached from: {image_url}"
        if tag_list:
            response += f"\n🏷️ Tagged with: {', '.join(tag_list)}"

        return response
    except Exception as e:
        return f"Failed to create trail: {str(e)}"

@mcp.tool()
def update_trail(slug: str, title: str = None, description: str = None, status: str = None,
                 progress: int = None, additional_content: str = None, image_url: str = None) -> str:
    """
    Update an existing Project Trail with optional image attachment.

    Use this to change trail metadata, update progress, or append new content to project documentation.
    All parameters are optional - only the slug is required.

    Args:
        slug: Trail slug to update
        title: New title for the trail
        description: New description
        status: New status ("Active", "Archived", "Mastered")
        progress: Progress percentage (0-100)
        additional_content: Content to append to the trail
        image_url: URL or local path to attach as header image
    """
    try:
        updated_slug = logger.update_trail(slug, title, description, status, progress, additional_content, image_url)
        response = f"Updated project trail: {slug}"
        if image_url:
            response += f"\n📸 Header image updated from: {image_url}"
        return response
    except Exception as e:
        return f"Failed to update trail: {str(e)}"

@mcp.tool()
def attach_file_to_trail(slug: str, filename: str, content: str, description: str = "") -> str:
    """
    Attach a new file (documentation, code, etc.) directly to a trail.

    This allows agents to upload complete files rather than generating content through SDK processing.

    Args:
        slug: Trail slug to attach file to
        filename: Name for the new file (e.g., "architecture.md", "diagram.png")
        content: Full content of the file (base64 for binary files)
        description: Description of what this file contains

    Returns:
        str: Success confirmation with file path
    """
    try:
        # Ensure trail exists
        trail_dir = os.path.join(logger.trails_dir, slug)
        if not os.path.exists(trail_dir):
            raise FileNotFoundError(f"Trail {slug} not found")

        # Create attachments directory if it doesn't exist
        attachments_dir = os.path.join(trail_dir, "attachments")
        os.makedirs(attachments_dir, exist_ok=True)

        # Save file
        file_path = os.path.join(attachments_dir, filename)
        file_mode = 'wb' if _is_binary_content(content) else 'w'

        with open(file_path, file_mode) as f:
            if file_mode == 'wb':
                # Handle base64 decoding for binary files
                import base64
                f.write(base64.b64decode(content))
            else:
                f.write(content)

        # Create or update index file for attachments
        attachments_index = os.path.join(attachments_dir, "README.md")
        index_content = f"# Trail Attachments for {slug}\n\n"
        index_content += f"## {filename}\n\n{description}\n\n"

        if os.path.exists(attachments_index):
            with open(attachments_index, 'a') as f:
                f.write(f"## {filename}\n\n{description}\n\n")
        else:
            with open(attachments_index, 'w') as f:
                f.write(index_content)

        # Auto-commit
        logger._run_git_command(['add', f'content/trails/{slug}/attachments/'])

        commit_msg = f"Attach file to trail {slug}: {filename}"
        if description:
            commit_msg += f" - {description[:50]}..."
        logger._run_git_command(['commit', '-m', commit_msg])

        relative_path = f"content/trails/{slug}/attachments/{filename}"
        return f"✅ File attached to trail {slug}: {filename} -> {relative_path}"

    except Exception as e:
        return f"❌ Failed to attach file: {str(e)}"

@mcp.tool()
def upload_trail_document(slug: str, markdown_content: str, frontmatter_updates: str = None) -> str:
    """
    Upload a complete markdown document to replace trail content.

    This gives agents full control over trail content, including custom frontmatter,
    complex markdown structures, and complete document replacement.

    Args:
        slug: Trail slug to update
        markdown_content: Complete markdown content with optional frontmatter
        frontmatter_updates: JSON string of frontmatter fields to update (optional)

    Returns:
        str: Success confirmation
    """
    try:
        # Parse frontmatter updates if provided
        additional_frontmatter = {}
        if frontmatter_updates:
            try:
                additional_frontmatter = json.loads(frontmatter_updates)
            except json.JSONDecodeError:
                return "❌ Invalid JSON in frontmatter_updates"

        # Update the trail with the complete content
        updated_slug = logger.update_trail_content(slug, markdown_content, additional_frontmatter)
        return f"✅ Uploaded complete document to trail: {slug}"

    except Exception as e:
        return f"❌ Failed to upload document: {str(e)}"

@mcp.tool()
def create_trail_from_template(template_name: str, title: str, description: str, tags: str = None) -> str:
    """
    Create a trail using predefined templates with rich content structures.

    Args:
        template_name: Template type ("project", "research", "tutorial", "documentation")
        title: Trail title
        description: Trail description
        tags: Optional comma-separated tags

    Returns:
        str: Created trail details
    """
    try:
        templates = {
            "project": {
                "status": "Active",
                "progress": 10,
                "tags": ["development", "project"],
                "content": f"""# Project: {title}

## Overview
{description}

## Goals & Objectives
- [ ] Define project scope
- [ ] Set up development environment
- [ ] Create initial project structure
- [ ] Establish coding standards

## Technical Architecture
*(To be filled as project progresses)*

## Development Phases
### Phase 1: Setup & Foundation
- [ ] Repository initialization
- [ ] CI/CD pipeline setup
- [ ] Documentation setup

### Phase 2: Core Development
- [ ] Feature implementation
- [ ] Testing strategy
- [ ] Code reviews

### Phase 3: Deployment & Maintenance
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Documentation completion

## Key Decisions
*(Log important architectural and implementation decisions)*

## Challenges & Solutions
*(Document problems encountered and how they were solved)*

## Metrics & Success Criteria
- [ ] Code coverage > 80%
- [ ] Performance benchmarks met
- [ ] User acceptance criteria satisfied"""
            },
            "research": {
                "status": "Active",
                "progress": 5,
                "tags": ["research", "exploration"],
                "content": f"""# Research: {title}

## Abstract
{description}

## Research Questions
- What problem are we trying to solve?
- What are the current approaches?
- What novel contribution can we make?

## Methodology
### Data Collection
*(Describe data sources and collection methods)*

### Experimental Design
*(Detail the experimental setup and procedures)*

### Analysis Methods
*(Statistical methods, validation approaches, etc.)*

## Literature Review
*(Summarize relevant existing work)*

## Findings
*(Present research results and analysis)*

## Discussion
*(Interpret results, implications, limitations)*

## Future Work
*(Next steps and extensions)*

## References
*(Academic citations and related work)*

---
*Research initiated: {datetime.date.today()}*"""
            },
            "tutorial": {
                "status": "Active",
                "progress": 25,
                "tags": ["tutorial", "learning"],
                "content": f"""# Tutorial: {title}

## Overview
{description}

## Prerequisites
- [ ] Required knowledge and skills
- [ ] Software/environment setup
- [ ] Required tools and dependencies

## Learning Objectives
After completing this tutorial, you will be able to:
- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

## Step-by-Step Guide

### Step 1: Setup and Preparation
*(Detailed instructions for getting started)*

### Step 2: Core Concepts
*(Explain fundamental concepts with examples)*

### Step 3: Hands-on Implementation
*(Practical exercises and code examples)*

### Step 4: Testing and Validation
*(How to verify your implementation works)*

### Step 5: Best Practices & Tips
*(Common pitfalls and optimization tips)*

## Code Examples

### Basic Implementation
```python
# Example code demonstrating core concepts
def example_function():
    pass
```

### Advanced Usage
```python
# More complex implementation
def advanced_example():
    pass
```

## Troubleshooting
### Common Issues
- **Issue 1**: Solution description
- **Issue 2**: Solution description

## Quiz & Exercises
- [ ] Exercise 1: Description
- [ ] Exercise 2: Description

## Next Steps
*(Additional resources and advanced topics)*

## Resources
- Official documentation
- Community resources
- Related tutorials

---
*Tutorial created: {datetime.date.today()}*"""
            },
            "documentation": {
                "status": "Active",
                "progress": 30,
                "tags": ["documentation", "reference"],
                "content": f"""# Documentation: {title}

## Purpose & Scope
{description}

## Quick Start
### Installation
*(Setup instructions)*

### Basic Usage
*(Simple getting started example)*

```bash
# Example command
example-command --flag value
```

## API Reference

### Core Classes

#### MainClass
Main component description.

**Parameters:**
- `param1` (type): Description of parameter

**Returns:** Description of return value

**Example:**
```python
instance = MainClass(param1="value")
result = instance.do_something()
```

### Configuration
*(Configuration options and settings)*

## Examples & Use Cases
### Example 1: Basic Usage
*(Complete working example)*

### Example 2: Advanced Features
*(Complex usage scenarios)*

## Best Practices
- [ ] Best practice 1
- [ ] Best practice 2

## Common Issues & FAQ
### Q: Common question?
A: Answer and detailed explanation.

## Version History
### v1.0.0
- Initial release
- Basic functionality

## Contributing
*(Guidelines for contributions)*

## License
*(License information)*

---
*Documentation created: {datetime.date.today()}*"""
            }
        }

        if template_name not in templates:
            available = ", ".join(templates.keys())
            return f"❌ Unknown template '{template_name}'. Available: {available}"

        template = templates[template_name]

        # Parse custom tags if provided
        tag_list = [tag.strip() for tag in tags.split(',')] if tags else []
        all_tags = template["tags"] + tag_list

        # Create trail with template content
        slug = logger.create_trail_group(
            title=title,
            description=description,
            template_name=template_name,
            template_content=template["content"],
            status=template["status"],
            progress=template["progress"],
            tags=all_tags
        )

        return f"✅ Created {template_name} trail '{title}' (slug: {slug}) with rich template structure and {len(all_tags)} tags"

    except Exception as e:
        return f"❌ Failed to create trail from template: {str(e)}"

@mcp.resource("nexus://recent")
def get_recent_logs() -> str:
    """Get the text content of the 5 most recent logs."""
    # Using recall with an empty/broad query to fetch recent items
    return brain.recall("recent logs", limit=5)

if __name__ == "__main__":
    mcp.run()

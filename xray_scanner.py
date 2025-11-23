#!/usr/bin/env python3

"""
Project X-Ray Scanner
Nexus v2.0 - Code Architecture Analysis Tool

Scans external repositories to analyze import dependencies and generate
architectural visualizations for the Knowledge Nexus.

Usage:
    python3 xray_scanner.py --path ../my-project --name my-project
    python3 xray_scanner.py --path /full/path/project --name production-app

Output: Creates content/xray/[project_name].json with nodes and links for visualization
"""

import os
import json
import argparse
import ast
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional

class CodeDependencyScanner:
    """Scans code files to extract import/dependency relationships."""

    def __init__(self):
        self.supported_extensions = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.jsx': 'javascript'
        }

    def scan_directory(self, root_path: str, project_name: str) -> Dict:
        """
        Scan a directory to build dependency graph.

        Args:
            root_path: Path to the project root
            project_name: Human readable name for the project

        Returns:
            Dictionary with nodes, links, and metadata for visualization
        """
        print(f"🔍 Scanning project: {project_name}")
        print(f"📁 Root path: {root_path}")

        # Validate path
        if not os.path.exists(root_path):
            raise ValueError(f"Path does not exist: {root_path}")

        if not os.path.isdir(root_path):
            raise ValueError(f"Path is not a directory: {root_path}")

        # Initialize result structure
        result = {
            "project_name": project_name,
            "scan_time": datetime.now().isoformat(),
            "root_path": os.path.abspath(root_path),
            "nodes": [],
            "links": [],
            "metadata": {
                "total_files": 0,
                "languages": {},
                "scan_errors": []
            }
        }

        # Scan all files
        file_dependencies = {}
        file_info = {}

        for file_path in self._walk_files(root_path):
            try:
                relative_path = os.path.relpath(file_path, root_path)
                dependencies, file_metadata = self._parse_file(file_path)

                file_dependencies[relative_path] = dependencies
                file_info[relative_path] = file_metadata

                result["metadata"]["total_files"] += 1
                language = file_metadata["language"]
                result["metadata"]["languages"][language] = result["metadata"]["languages"].get(language, 0) + 1

                print(f"📄 Analyzed: {relative_path} ({len(dependencies)} deps)")

            except Exception as e:
                error_msg = f"Error parsing {file_path}: {str(e)}"
                result["metadata"]["scan_errors"].append(error_msg)
                print(f"⚠️ {error_msg}")

        # Build graph structure
        result["nodes"] = self._build_nodes(file_info)
        result["links"] = self._build_links(file_dependencies, file_info)

        print("\n📊 Scan Results:")
        print(f"   Files: {result['metadata']['total_files']}")
        print(f"   Nodes: {len(result['nodes'])}")
        print(f"   Links: {len(result['links'])}")
        print(f"   Languages: {result['metadata']['languages']}")

        return result

    def _walk_files(self, root_path: str) -> List[str]:
        """Recursively walk directory and return paths of supported files."""
        supported_files = []

        # Skip common directories
        skip_dirs = {
            '.git', 'node_modules', '__pycache__', '.venv', 'venv',
            'build', 'dist', '.next', '.nuxt', 'coverage',
            '.terraform', 'target'  # Rust
        }

        for dirpath, dirnames, filenames in os.walk(root_path):
            # Remove directories to skip from further traversal
            dirnames[:] = [d for d in dirnames if d not in skip_dirs]

            for filename in filenames:
                _, ext = os.path.splitext(filename)
                if ext in self.supported_extensions:
                    supported_files.append(os.path.join(dirpath, filename))

        return supported_files

    def _parse_file(self, file_path: str) -> Tuple[Set[str], Dict]:
        """Parse a file to extract its imports/dependencies."""
        _, ext = os.path.splitext(file_path)

        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Get file metadata
        metadata = {
            "language": self.supported_extensions[ext],
            "extension": ext,
            "size": len(content),
            "lines": len(content.split('\n'))
        }

        # Parse dependencies based on file type
        if ext == '.py':
            dependencies = self._parse_python_imports(content)
        elif ext in ['.js', '.jsx', '.ts', '.tsx']:
            dependencies = self._parse_js_imports(content)
        else:
            dependencies = set()

        return dependencies, metadata

    def _parse_python_imports(self, content: str) -> Set[str]:
        """Parse Python imports using AST."""
        dependencies = set()

        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        dependencies.add(alias.name.split('.')[0])

                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        dependencies.add(node.module.split('.')[0])

        except SyntaxError:
            # Fallback: simple regex parsing for files with syntax errors
            import_lines = re.findall(r'^\s*(?:import|from)\s+(\w+)', content, re.MULTILINE)
            dependencies = set(import_lines)

        return dependencies

    def _parse_js_imports(self, content: str) -> Set[str]:
        """Parse JavaScript/TypeScript imports using regex."""
        dependencies = set()

        # ES6 imports: import ... from '...'
        es6_imports = re.findall(r'import\s+.*?from\s+["\']([^"\']+)["\']', content, re.DOTALL)
        dependencies.update(self._clean_js_import(module) for module in es6_imports)

        # CommonJS: require('...')
        require_imports = re.findall(r'require\s*\(\s*["\']([^"\']+)["\']\s*\)', content)
        dependencies.update(self._clean_js_import(module) for module in require_imports)

        # React/Vue imports: import { ... } from 'react'
        react_imports = re.findall(r'import\s*{[^}]*}\s*from\s*["\']([^"\']+)["\']', content)
        dependencies.update(self._clean_js_import(module) for module in react_imports)

        return dependencies

    def _clean_js_import(self, module: str) -> str:
        """Clean JavaScript import names."""
        # Remove path separators and file extensions
        base = module.split('/')[-1]
        base = re.sub(r'\.(js|jsx|ts|tsx|json)$', '', base)
        return base

    def _build_nodes(self, file_info: Dict) -> List[Dict]:
        """Build node objects for visualization."""
        nodes = []

        for relative_path, info in file_info.items():
            # Categorize by extension and language
            language = info["language"]
            extension = info["extension"]

            # Color coding for visualization
            if extension in ['.py']:
                group = 1  # Python
                color = '#3b82f6'  # Blue
            elif extension in ['.ts', '.tsx']:
                group = 2  # TypeScript
                color = '#0891b2'  # Cyan
            elif extension in ['.js', '.jsx']:
                group = 3  # JavaScript
                color = '#eab308'  # Yellow
            else:
                group = 4  # Other
                color = '#6b7280'  # Gray

            node = {
                "id": relative_path,
                "name": os.path.basename(relative_path),
                "path": relative_path,
                "group": group,
                "color": color,
                "language": language,
                "extension": extension,
                "size": info.get("size", 0),
                "lines": info.get("lines", 0),
                "url": f"/xray/{relative_path}",  # For navigation
            }
            nodes.append(node)

        return nodes

    def _build_links(self, file_dependencies: Dict[str, Set[str]], file_info: Dict) -> List[Dict]:
        """Build link objects representing dependencies."""
        links = []
        all_files = set(file_dependencies.keys())

        for from_file, dependencies in file_dependencies.items():
            for dep in dependencies:
                # Look for matching files (local dependencies)
                # This is simplified - in a more advanced version you'd match against
                # actual files, installed packages, etc.
                possible_targets = [
                    dep + '.py',
                    dep + '.js',
                    dep + '.ts',
                    os.path.join(from_file.split('/')[0], dep + '.py'),  # Same directory
                    os.path.join(from_file.split('/')[0], dep + '.js'),
                    os.path.join(from_file.split('/')[0], dep + '.ts'),
                ]

                for target in possible_targets:
                    if target in all_files:
                        link = {
                            "source": from_file,
                            "target": target,
                            "value": 1  # Could weight by usage frequency
                        }
                        links.append(link)
                        break

        return links

    def save_scan_result(self, scan_result: Dict, project_name: str) -> str:
        """Save scan results to disk."""
        # Create xray directory
        xray_dir = Path("content/xray")
        xray_dir.mkdir(parents=True, exist_ok=True)

        # Save as JSON
        output_file = xray_dir / f"{project_name}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(scan_result, f, indent=2, ensure_ascii=False)

        return str(output_file)


def main():
    parser = argparse.ArgumentParser(
        description="Project X-Ray Scanner - Code Architecture Analysis for Nexus",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python3 xray_scanner.py --path ../my-project --name my-project
  python3 xray_scanner.py --path /full/path/project --name production-app

The scan results will be saved to content/xray/[project_name].json
and can be visualized in your Nexus dashboard at /xray/[project-name]
        '''
    )

    parser.add_argument('--path', required=True,
                       help='Path to the project to scan')
    parser.add_argument('--name', required=True,
                       help='Human-readable name for this project')
    parser.add_argument('--format', choices=['json'], default='json',
                       help='Output format (default: json)')

    args = parser.parse_args()

    try:
        # Initialize scanner
        scanner = CodeDependencyScanner()

        # Scan the project
        print("🚀 Starting Code Architecture Analysis...")
        print(f"Target: {args.name}")
        print(f"Path: {args.path}")
        print("-" * 50)

        scan_result = scanner.scan_directory(args.path, args.name)

        # Save results
        output_file = scanner.save_scan_result(scan_result, args.name)

        print(f"\n✅ Analysis complete!")
        print(f"📂 Results saved to: {output_file}")
        print(f"🎯 View visualization: http://localhost:3002/xray/{args.name}")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

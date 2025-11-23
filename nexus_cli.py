#!/usr/bin/env python3

"""
Nexus CLI - Quick Log Interface for Personal Knowledge Nexus

A command-line tool for fast logging to your knowledge base without writing Python scripts.

Usage:
    python3 nexus_cli.py log "Fixed the authentication bug"
    python3 nexus_cli.py log --status failure "Database connection timeout" --tags "db connectivity critical"
    python3 nexus_cli.py find "authentication issues"
"""

import argparse
import sys
from nexus_sdk import NexusLogger, NexusBrain

def main():
    parser = argparse.ArgumentParser(
        description="Nexus CLI - Quick logging to your knowledge base",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  nexus_cli.py log "Fixed the login issue" --status success --tags "auth frontend"
  nexus_cli.py log --status failure "API timeout after deployment" --tags "api performance"
  nexus_cli.py find "database optimization"
  nexus_cli.py brain "What have we learned about caching?"
        '''
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Log command
    log_parser = subparsers.add_parser('log', help='Log a new entry to the knowledge base')
    log_parser.add_argument('message', help='The log message or incident description')
    log_parser.add_argument('--status', choices=['success', 'failure', 'warning', 'info'],
                          default='success', help='Status level (default: success)')
    log_parser.add_argument('--tags', nargs='+', help='Space-separated tags (e.g., --tags auth security)')
    log_parser.add_argument('--agent', default='cli-user', help='Agent identifier (default: cli-user)')

    # Find/Search command
    find_parser = subparsers.add_parser('find', help='Search the knowledge base')
    find_parser.add_argument('query', help='Search query')
    find_parser.add_argument('--limit', type=int, default=3, help='Number of results (default: 3)')

    # Brain/Ask command
    brain_parser = subparsers.add_parser('brain', help='Ask AI-powered questions about your knowledge')
    brain_parser.add_argument('question', help='Your question about the knowledge base')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    try:
        if args.command == 'log':
            # Quick logging
            logger = NexusLogger(agent_name=args.agent)
            logger.log(
                title=args.message,
                content=f"Quick log entry from CLI\n\nStatus: {args.status}\nTags: {', '.join(args.tags) if args.tags else 'none'}",
                status=args.status,
                tags=args.tags or []
            )

        elif args.command == 'find':
            # Search functionality
            brain = NexusBrain()
            results = brain.recall(args.query)

            if "No historical information" in results:
                print(f"❌ No results found for: '{args.query}'")
            else:
                print(f"🔍 Results for '{args.query}':\n")
                print(results)

        elif args.command == 'brain':
            # AI-powered questions
            brain = NexusBrain()
            try:
                answer = brain.recall(args.question)
                if "No historical information" in answer:
                    print(f"🤔 I don't have enough context to answer: '{args.question}'")
                else:
                    print(f"🧠 Nexus Intelligence for: '{args.question}'\n")
                    print(answer)
            except Exception as e:
                print(f"❌ Error connecting to Nexus: {e}")
                print("💡 Make sure the Nexus server is running with 'npm run dev'")

    except KeyboardInterrupt:
        print("\n⚡ Nexus CLI interrupted")
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

    return 0

def setup_shell_alias():
    """
    Helper function to show how to set up shell aliases for easier usage
    """
    print("💡 To set up quick aliases, add to your ~/.bashrc or ~/.zshrc:")
    print()
    print("# Nexus CLI quick commands")
    print("alias nx='cd /path/to/nexus && python3 nexus_cli.py'")
    print("alias nxlog='cd /path/to/nexus && python3 nexus_cli.py log'")
    print("alias nxfind='cd /path/to/nexus && python3 nexus_cli.py find'")
    print("alias nxbrain='cd /path/to/nexus && python3 nexus_cli.py brain'")
    print()
    print("Usage examples:")
    print("  nxlog 'Database query optimized' --tags 'db performance'")
    print("  nxfind 'authentication issues'")
    print("  nxbrain 'What happened last week?'")

if __name__ == "__main__":
    # Check if help requested
    if len(sys.argv) == 1:
        print("Nexus CLI - Quick Knowledge Base Logging")
        print("==========================================")
        print()
        parser = argparse.ArgumentParser()
        subparsers = parser.add_subparsers()
        # Rebuild parser to show usage
        main()  # Will show help

    exit_code = main()
    sys.exit(exit_code or 0)

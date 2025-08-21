#!/usr/bin/env python3
"""
DocuSync-AI Integration Hook for Camydia Portfolio
Automatically registers code changes and suggests documentation updates.
"""
import json
import sys
import os
import subprocess
import re

def should_track_for_documentation(file_path, content):
    """Determine if file changes should be tracked for documentation."""
    
    # Skip non-relevant files
    skip_patterns = [
        r'node_modules/',
        r'\.next/',
        r'dist/',
        r'build/',
        r'\.turbo/',
        r'\.git/',
        r'\.cache/',
        r'\.temp/',
        r'\.tmp/',
        r'\.log$',
        r'\.lock$',
    ]
    
    for pattern in skip_patterns:
        if re.search(pattern, file_path, re.IGNORECASE):
            return False
    
    # Track these file types
    track_extensions = ['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx', '.json']
    if not any(file_path.endswith(ext) for ext in track_extensions):
        return False
    
    # Always track significant files
    significant_files = [
        'package.json',
        'tsconfig.json',
        'next.config.',
        'tailwind.config.',
        'README.md',
        'CHANGELOG.md',
    ]
    
    for significant in significant_files:
        if significant in file_path:
            return True
    
    # Track API routes
    if '/api/' in file_path or 'route.ts' in file_path:
        return True
    
    # Track component files
    if any(dir_name in file_path for dir_name in ['/components/', '/pages/', '/app/']):
        return True
    
    # Track utility and library files
    if any(dir_name in file_path for dir_name in ['/lib/', '/utils/', '/hooks/']):
        return True
    
    # Track configuration files
    if file_path.endswith('.config.js') or file_path.endswith('.config.ts'):
        return True
    
    return False

def analyze_change_type(file_path, content):
    """Analyze the type of change for documentation purposes."""
    
    change_types = []
    
    # API changes
    if '/api/' in file_path or 'route.ts' in file_path:
        change_types.append('api')
    
    # Component changes
    if any(dir_name in file_path for dir_name in ['/components/', '/ui/']):
        change_types.append('component')
    
    # Page/route changes
    if '/app/' in file_path and ('page.' in file_path or 'layout.' in file_path):
        change_types.append('page')
    
    # Database schema changes
    if 'schema.ts' in file_path or '/db/' in file_path:
        change_types.append('database')
    
    # Configuration changes
    if any(config in file_path for config in ['config', 'package.json', 'tsconfig']):
        change_types.append('config')
    
    # Feature detection from content
    if content:
        # New exports/functions
        if re.search(r'export\s+(function|const|class)', content):
            change_types.append('export')
        
        # New types/interfaces
        if re.search(r'(interface|type)\s+\w+', content):
            change_types.append('type')
        
        # Environment variables
        if re.search(r'process\.env\.\w+', content):
            change_types.append('env')
        
        # Database queries
        if re.search(r'(SELECT|INSERT|UPDATE|DELETE)', content, re.IGNORECASE):
            change_types.append('query')
    
    return change_types if change_types else ['general']

def register_code_change_with_docusync(file_path, content, change_types):
    """Register the code change with DocuSync-AI system."""
    
    try:
        project_root = '/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio'
        os.chdir(project_root)
        
        # Prepare change summary
        change_type = change_types[0] if change_types else 'general'
        
        # Create summary based on file and change type
        if change_type == 'api':
            summary = f"API endpoint modified: {os.path.basename(file_path)}"
        elif change_type == 'component':
            summary = f"React component updated: {os.path.basename(file_path)}"
        elif change_type == 'page':
            summary = f"Page/route modified: {os.path.basename(file_path)}"
        elif change_type == 'database':
            summary = f"Database schema changes: {os.path.basename(file_path)}"
        elif change_type == 'config':
            summary = f"Configuration updated: {os.path.basename(file_path)}"
        else:
            summary = f"Code modified: {os.path.basename(file_path)}"
        
        # Try to register with DocuSync-AI MCP
        try:
            # Note: This would normally call the DocuSync-AI MCP tool
            # For now, we'll simulate the registration
            print(f"📝 DocuSync-AI: Registering change in {file_path}")
            print(f"   Type: {', '.join(change_types)}")
            print(f"   Summary: {summary}")
            
            # In a real implementation, this would be:
            # result = subprocess.run(['claude', 'mcp', 'docusync-ai', 'register-code-change-context', 
            #                        '--changed-files', file_path, 
            #                        '--change-summary', summary,
            #                        '--change-type', change_type], 
            #                       capture_output=True, text=True, timeout=10)
            
        except Exception as e:
            print(f"⚠️ Could not register with DocuSync-AI: {e}")
    
    except Exception as e:
        print(f"❌ DocuSync-AI integration error: {e}")

def suggest_documentation_updates(file_path, change_types):
    """Suggest documentation sections that might need updates."""
    
    suggestions = []
    
    # API documentation
    if 'api' in change_types:
        suggestions.append("📚 Consider updating API documentation")
        suggestions.append("   • Document new endpoints or parameters")
        suggestions.append("   • Update OpenAPI/Swagger specs if used")
        suggestions.append("   • Add usage examples")
    
    # Component documentation
    if 'component' in change_types:
        suggestions.append("📚 Consider updating component documentation")
        suggestions.append("   • Document new props or features")
        suggestions.append("   • Update Storybook stories if used")
        suggestions.append("   • Add usage examples")
    
    # Database documentation
    if 'database' in change_types:
        suggestions.append("📚 Consider updating database documentation")
        suggestions.append("   • Document schema changes")
        suggestions.append("   • Update ERD diagrams")
        suggestions.append("   • Document migration steps")
    
    # Configuration documentation
    if 'config' in change_types:
        suggestions.append("📚 Consider updating configuration documentation")
        suggestions.append("   • Document new environment variables")
        suggestions.append("   • Update setup instructions")
        suggestions.append("   • Document breaking changes")
    
    # Page/routing documentation
    if 'page' in change_types:
        suggestions.append("📚 Consider updating user documentation")
        suggestions.append("   • Document new features or pages")
        suggestions.append("   • Update user guides")
        suggestions.append("   • Document UI/UX changes")
    
    # Type documentation
    if 'type' in change_types:
        suggestions.append("📚 Consider updating type documentation")
        suggestions.append("   • Document new interfaces")
        suggestions.append("   • Update TypeDoc comments")
        suggestions.append("   • Add usage examples")
    
    return suggestions

# Main execution
try:
    input_data = json.load(sys.stdin)
    tool_input = input_data.get('tool_input', {})
    file_path = tool_input.get('file_path', '')
    
    # Get content from different tool types
    content = (
        tool_input.get('content', '') or 
        tool_input.get('new_string', '') or
        tool_input.get('body', '')
    )
    
    if not file_path:
        sys.exit(0)  # Nothing to process
    
    # Make path relative for cleaner output
    display_path = file_path
    if file_path.startswith('/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio/'):
        display_path = file_path.replace('/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio/', '')
    
    # Check if this change should be tracked
    if not should_track_for_documentation(display_path, content):
        sys.exit(0)  # Not relevant for documentation
    
    # Analyze change type
    change_types = analyze_change_type(display_path, content)
    
    # Register with DocuSync-AI
    register_code_change_with_docusync(display_path, content, change_types)
    
    # Provide documentation suggestions
    suggestions = suggest_documentation_updates(display_path, change_types)
    if suggestions:
        print("\n💡 Documentation suggestions:")
        for suggestion in suggestions[:3]:  # Limit suggestions
            print(f"   {suggestion}")
        if len(suggestions) > 3:
            print(f"   ... and {len(suggestions) - 3} more suggestions")
    
    # Special reminders for significant changes
    if 'api' in change_types:
        print("\n🔗 API Documentation Reminder:")
        print("   • Update README.md with new API usage")
        print("   • Consider adding integration tests")
    
    if 'database' in change_types:
        print("\n🗄️ Database Documentation Reminder:")
        print("   • Document migration steps")
        print("   • Update schema documentation")
    
    if 'config' in change_types:
        print("\n⚙️ Configuration Documentation Reminder:")
        print("   • Update .env.example if needed")
        print("   • Document new environment variables")

except Exception as e:
    print(f"Error in DocuSync-AI integration: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block on integration errors
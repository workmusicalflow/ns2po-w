#!/usr/bin/env python3
"""
Database Migration Checker for Camydia Portfolio
Alerts when Drizzle schema changes require database migrations.
"""
import json
import sys
import os
import subprocess

def check_migration_needed(file_path, content):
    """Check if schema changes require database migration."""
    
    # Only check for database schema files
    if 'packages/db/src/schema.ts' not in file_path:
        return
    
    print(f"🗄️ Database schema modified: {file_path}")
    
    # Detect type of schema changes
    schema_changes = []
    
    # Table definitions
    if 'sqliteTable(' in content:
        schema_changes.append("Table definitions")
    
    # Column changes
    if any(col_type in content for col_type in ['text(', 'integer(', 'real(', 'blob(']):
        schema_changes.append("Column definitions")
    
    # Index changes  
    if 'index(' in content or 'Index' in content:
        schema_changes.append("Index definitions")
    
    # Relationship changes
    if 'references(' in content or 'foreignKey(' in content:
        schema_changes.append("Foreign key relationships")
    
    if schema_changes:
        print(f"📋 Schema changes detected: {', '.join(schema_changes)}")
    
    print("\n🔄 Migration commands to run:")
    print("  1. Generate migration:")
    print("     pnpm --filter @camydia/db db:generate")
    print("  2. Apply migration:")
    print("     pnpm --filter @camydia/db db:migrate")
    print("  3. Verify with Drizzle Studio:")
    print("     pnpm --filter @camydia/db db:studio")
    
    # Check if there are pending migrations
    project_root = '/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio'
    drizzle_dir = os.path.join(project_root, 'packages/db/drizzle')
    
    if os.path.exists(drizzle_dir):
        try:
            # List migration files
            migrations = [f for f in os.listdir(drizzle_dir) if f.endswith('.sql')]
            if migrations:
                print(f"\n📁 Existing migrations found: {len(migrations)} files")
                latest = sorted(migrations)[-1] if migrations else None
                if latest:
                    print(f"   Latest: {latest}")
        except Exception:
            pass
    
    print("\n💾 Don't forget to:")
    print("  • Test migrations on development database first")
    print("  • Backup production data before applying migrations")
    print("  • Update seed data if table structure changed")

def check_seed_data_impact(content):
    """Check if schema changes affect seed data."""
    
    # Check for breaking changes that affect existing data
    breaking_changes = []
    
    if '.notNull()' in content:
        breaking_changes.append("Added NOT NULL constraints")
    
    if '.unique()' in content:
        breaking_changes.append("Added UNIQUE constraints")
    
    if 'DROP ' in content.upper() or 'drop(' in content:
        breaking_changes.append("Column/table removals")
    
    if breaking_changes:
        print(f"\n⚠️ Potentially breaking changes detected:")
        for change in breaking_changes:
            print(f"  • {change}")
        print("  → Review seed data compatibility")
        print("  → Consider data migration scripts")

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
    
    if not file_path or not content:
        sys.exit(0)  # Nothing to check
    
    # Check for migration needs
    check_migration_needed(file_path, content)
    
    # Check for seed data impact
    if 'packages/db/src/schema.ts' in file_path:
        check_seed_data_impact(content)
    
except Exception as e:
    print(f"Error checking database migrations: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block on validation errors
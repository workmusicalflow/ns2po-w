#!/usr/bin/env python3
"""
Universal CLAUDE.md Context Updater
Version: 2.0 | Date: 2025-09-17

A truly autonomous and dynamic hook system that adapts to any project type.
Discovers project context automatically and updates CLAUDE.md intelligently.

Key Features:
- Plugin-based architecture for extensibility
- Automatic project type detection
- Smart caching for performance
- Zero configuration required (but configurable)
- Learning from project patterns over time
"""
import json
import sys
import re
import logging
import subprocess
import hashlib
from abc import ABC, abstractmethod
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent.parent
CLAUDE_MD_PATH = PROJECT_ROOT / "CLAUDE.md"
HOOKS_DIR = PROJECT_ROOT / ".claude" / "hooks"
CACHE_PATH = HOOKS_DIR / "context_cache.json"
CONFIG_PATH = HOOKS_DIR / "context.json"
LOG_PATH = HOOKS_DIR / "context_updater.log"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_PATH),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class SectionData:
    """Data structure for a CLAUDE.md section"""
    id: str
    title: str
    content: str
    priority: int = 100
    enabled: bool = True
    source_plugin: str = ""
    last_updated: str = ""


@dataclass
class ProjectContext:
    """Complete project context discovered by plugins"""
    project_type: str = "unknown"
    language: str = "unknown"
    framework: List[str] = None
    services: List[str] = None
    commands: Dict[str, str] = None
    health_status: Dict[str, bool] = None
    recent_activity: List[str] = None
    custom_data: Dict[str, Any] = None

    def __post_init__(self):
        self.framework = self.framework or []
        self.services = self.services or []
        self.commands = self.commands or {}
        self.health_status = self.health_status or {}
        self.recent_activity = self.recent_activity or []
        self.custom_data = self.custom_data or {}


class ContextPlugin(ABC):
    """Base class for all context discovery plugins"""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    @abstractmethod
    def discover(self) -> Dict[str, Any]:
        """Discover project information"""
        pass

    @abstractmethod
    def format_section(self, data: Dict[str, Any]) -> Optional[SectionData]:
        """Format discovered data as a CLAUDE.md section"""
        pass

    @property
    def name(self) -> str:
        """Plugin name"""
        return self.__class__.__name__

    @property
    def priority(self) -> int:
        """Display priority (lower = higher priority)"""
        return 100

    def is_applicable(self) -> bool:
        """Check if this plugin applies to the current project"""
        return True

    def run_command(self, cmd: List[str], timeout: int = 5) -> Optional[str]:
        """Utility to run shell commands safely"""
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.project_root
            )
            if result.returncode == 0:
                return result.stdout.strip()
            return None
        except Exception as e:
            self.logger.debug(f"Command failed: {' '.join(cmd)} - {e}")
            return None


class PluginManager:
    """Manages plugin discovery, loading, and execution"""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.plugins: List[ContextPlugin] = []
        self.logger = logger

    def load_builtin_plugins(self):
        """Load built-in plugins"""
        builtin_plugins = [
            GitPlugin,
            ProjectTypePlugin,
            PackageManagerPlugin,
            EnvironmentPlugin,
            CommandsPlugin,
            HealthCheckPlugin,
            MCPServersPlugin,
            RecentActivityPlugin
        ]

        for plugin_class in builtin_plugins:
            try:
                plugin = plugin_class(self.project_root)
                if plugin.is_applicable():
                    self.plugins.append(plugin)
                    self.logger.info(f"Loaded builtin plugin: {plugin.name}")
            except Exception as e:
                self.logger.error(f"Failed to load {plugin_class.__name__}: {e}")


    def run_all_plugins(self) -> ProjectContext:
        """Execute all plugins and collect context"""
        context = ProjectContext()
        sections = []

        # Sort plugins by priority
        self.plugins.sort(key=lambda p: p.priority)

        for plugin in self.plugins:
            try:
                # Discover data
                data = plugin.discover()

                # Update context
                self._merge_context(context, data)

                # Format section
                section = plugin.format_section(data)
                if section:
                    section.source_plugin = plugin.name
                    section.last_updated = datetime.now().isoformat()
                    sections.append(section)

            except Exception as e:
                self.logger.error(f"Plugin {plugin.name} failed: {e}")

        return context, sections

    def _merge_context(self, context: ProjectContext, data: Dict[str, Any]):
        """Merge plugin data into main context"""
        for key, value in data.items():
            if hasattr(context, key):
                current = getattr(context, key)
                if isinstance(current, list) and isinstance(value, list):
                    current.extend(value)
                elif isinstance(current, dict) and isinstance(value, dict):
                    current.update(value)
                elif value is not None:
                    setattr(context, key, value)
            else:
                context.custom_data[key] = value


# Built-in Plugins

class GitPlugin(ContextPlugin):
    """Discovers Git repository information"""

    @property
    def priority(self) -> int:
        return 10

    def is_applicable(self) -> bool:
        return (self.project_root / ".git").exists()

    def discover(self) -> Dict[str, Any]:
        data = {}

        # Current branch
        branch = self.run_command(["git", "branch", "--show-current"])
        data["current_branch"] = branch or "unknown"

        # Modified files count
        status = self.run_command(["git", "status", "--porcelain"])
        if status:
            data["modified_files"] = len(status.strip().split('\n'))
        else:
            data["modified_files"] = 0

        # Recent commits
        log = self.run_command([
            "git", "log", "--oneline", "-5", "--format=%h %s"
        ])
        if log:
            data["recent_commits"] = log.strip().split('\n')

        # Repository URL
        remote = self.run_command(["git", "remote", "get-url", "origin"])
        if remote:
            data["repository_url"] = remote

        return data

    def format_section(self, data: Dict[str, Any]) -> Optional[SectionData]:
        lines = ["## 📊 Git Repository Status\n"]

        if "current_branch" in data:
            lines.append(f"**Branch**: `{data['current_branch']}`")
        if "modified_files" in data:
            lines.append(f"**Modified Files**: {data['modified_files']}")
        if "repository_url" in data:
            lines.append(f"**Repository**: {data['repository_url']}")

        if "recent_commits" in data:
            lines.append("\n### Recent Commits")
            for commit in data["recent_commits"][:5]:
                lines.append(f"- {commit}")

        return SectionData(
            id="git_status",
            title="Git Repository Status",
            content="\n".join(lines),
            priority=10
        )


class ProjectTypePlugin(ContextPlugin):
    """Detects project type and primary language"""

    @property
    def priority(self) -> int:
        return 1

    def discover(self) -> Dict[str, Any]:
        data = {
            "project_type": "unknown",
            "language": "unknown",
            "framework": []
        }

        # Check for common project files
        checks = [
            (self.project_root / "package.json", "node", "javascript"),
            (self.project_root / "requirements.txt", "python", "python"),
            (self.project_root / "go.mod", "go", "go"),
            (self.project_root / "Cargo.toml", "rust", "rust"),
            (self.project_root / "pom.xml", "java", "java"),
            (self.project_root / "composer.json", "php", "php"),
        ]

        for file_path, proj_type, language in checks:
            if file_path.exists():
                data["project_type"] = proj_type
                data["language"] = language

                # Detect frameworks
                if proj_type == "node":
                    data["framework"] = self._detect_node_frameworks()
                elif proj_type == "python":
                    data["framework"] = self._detect_python_frameworks()

                break

        # Check for monorepo
        if (self.project_root / "pnpm-workspace.yaml").exists():
            data["project_type"] = "monorepo"
            data["monorepo_type"] = "pnpm"
        elif (self.project_root / "lerna.json").exists():
            data["project_type"] = "monorepo"
            data["monorepo_type"] = "lerna"

        return data

    def _detect_node_frameworks(self) -> List[str]:
        frameworks = []
        package_json = self.project_root / "package.json"

        if package_json.exists():
            try:
                with open(package_json) as f:
                    pkg = json.load(f)
                    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

                    framework_map = {
                        "nuxt": "Nuxt",
                        "next": "Next.js",
                        "vue": "Vue",
                        "react": "React",
                        "angular": "Angular",
                        "svelte": "Svelte",
                        "express": "Express",
                        "fastify": "Fastify",
                    }

                    for key, name in framework_map.items():
                        if any(key in dep for dep in deps):
                            frameworks.append(name)

            except Exception as e:
                self.logger.debug(f"Failed to parse package.json: {e}")

        return frameworks

    def _detect_python_frameworks(self) -> List[str]:
        frameworks = []

        # Check requirements files
        for req_file in ["requirements.txt", "pyproject.toml", "Pipfile"]:
            req_path = self.project_root / req_file
            if req_path.exists():
                content = req_path.read_text()

                framework_map = {
                    "django": "Django",
                    "flask": "Flask",
                    "fastapi": "FastAPI",
                    "pyramid": "Pyramid",
                    "tornado": "Tornado",
                }

                for key, name in framework_map.items():
                    if key in content.lower():
                        frameworks.append(name)

        return frameworks

    def format_section(self, data: Dict[str, Any]) -> Optional[SectionData]:
        lines = ["## 🏗️ Project Information\n"]

        lines.append(f"**Type**: {data['project_type'].title()}")
        lines.append(f"**Language**: {data['language'].title()}")

        if data["framework"]:
            lines.append(f"**Frameworks**: {', '.join(data['framework'])}")

        if "monorepo_type" in data:
            lines.append(f"**Monorepo**: {data['monorepo_type']}")

        return SectionData(
            id="project_info",
            title="Project Information",
            content="\n".join(lines),
            priority=1
        )


class PackageManagerPlugin(ContextPlugin):
    """Detects package manager and dependencies"""

    @property
    def priority(self) -> int:
        return 20

    def discover(self) -> Dict[str, Any]:
        data = {
            "package_manager": None,
            "dependencies_count": 0,
            "workspaces": []
        }

        # Detect package manager
        if (self.project_root / "pnpm-lock.yaml").exists():
            data["package_manager"] = "pnpm"
        elif (self.project_root / "yarn.lock").exists():
            data["package_manager"] = "yarn"
        elif (self.project_root / "package-lock.json").exists():
            data["package_manager"] = "npm"
        elif (self.project_root / "Pipfile.lock").exists():
            data["package_manager"] = "pipenv"
        elif (self.project_root / "poetry.lock").exists():
            data["package_manager"] = "poetry"

        # Count dependencies for Node projects
        if (self.project_root / "package.json").exists():
            try:
                with open(self.project_root / "package.json") as f:
                    pkg = json.load(f)
                    deps = pkg.get("dependencies", {})
                    dev_deps = pkg.get("devDependencies", {})
                    data["dependencies_count"] = len(deps) + len(dev_deps)

                    # Check for workspaces
                    if "workspaces" in pkg:
                        data["workspaces"] = pkg["workspaces"]

            except Exception:
                pass

        return data

    def format_section(self, data: Dict[str, Any]) -> Optional[SectionData]:
        if not data["package_manager"]:
            return None

        lines = ["## 📦 Package Management\n"]

        lines.append(f"**Manager**: {data['package_manager']}")

        if data["dependencies_count"] > 0:
            lines.append(f"**Dependencies**: {data['dependencies_count']}")

        if data["workspaces"]:
            lines.append(f"**Workspaces**: {len(data['workspaces'])}")

        return SectionData(
            id="package_management",
            title="Package Management",
            content="\n".join(lines),
            priority=20
        )


class EnvironmentPlugin(ContextPlugin):
    """Discovers environment variables and services"""

    @property
    def priority(self) -> int:
        return 30

    def discover(self) -> Dict[str, Any]:
        data = {
            "env_files": [],
            "services": [],
            "configured_services": {}
        }

        # Find env files
        env_patterns = [".env", ".env.local", ".env.production", ".env.development"]
        for pattern in env_patterns:
            for env_file in self.project_root.rglob(pattern):
                if "node_modules" not in str(env_file):
                    data["env_files"].append(str(env_file.relative_to(self.project_root)))

                    # Detect services from env variables
                    services = self._detect_services(env_file)
                    data["services"].extend(services)

        # Remove duplicates
        data["services"] = list(set(data["services"]))

        return data

    def _detect_services(self, env_file: Path) -> List[str]:
        """Detect services from environment variable patterns"""
        services = []
        service_patterns = {
            r"DATABASE_URL|DB_": "Database",
            r"REDIS_": "Redis",
            r"SMTP_|MAIL_": "Email",
            r"AWS_": "AWS",
            r"STRIPE_": "Stripe",
            r"TWILIO_": "Twilio",
            r"SENDGRID_": "SendGrid",
            r"CLOUDINARY_": "Cloudinary",
            r"FIREBASE_": "Firebase",
            r"SUPABASE_": "Supabase",
            r"OPENAI_": "OpenAI",
            r"GITHUB_": "GitHub",
            r"GOOGLE_": "Google",
            r"AIRTABLE_": "Airtable",
            r"TURSO_": "Turso",
        }

        try:
            content = env_file.read_text()
            for pattern, service in service_patterns.items():
                if re.search(pattern, content, re.IGNORECASE):
                    services.append(service)
        except Exception:
            pass

        return services

    def format_section(self, data: Dict[str, Any]) -> Optional[SectionData]:
        if not data["env_files"] and not data["services"]:
            return None

        lines = ["## 🔧 Environment & Services\n"]

        if data["env_files"]:
            lines.append(f"**Config Files**: {len(data['env_files'])}")

        if data["services"]:
            lines.append(f"**Services**: {', '.join(data['services'])}")

        return SectionData(
            id="environment",
            title="Environment & Services",
            content="\n".join(lines),
            priority=30
        )


class CommandsPlugin(ContextPlugin):
    """Discovers available commands from various sources"""

    @property
    def priority(self) -> int:
        return 40

    def discover(self) -> Dict[str, Any]:
        data = {
            "commands": {},
            "command_sources": []
        }

        # Check package.json scripts
        package_json = self.project_root / "package.json"
        if package_json.exists():
            try:
                with open(package_json) as f:
                    pkg = json.load(f)
                    scripts = pkg.get("scripts", {})

                    # Categorize scripts
                    categories = {
                        "dev": ["dev", "start", "serve"],
                        "build": ["build", "compile"],
                        "test": ["test", "spec"],
                        "lint": ["lint", "format"],
                        "deploy": ["deploy", "publish"],
                    }

                    for script_name, script_cmd in scripts.items():
                        categorized = False
                        for category, keywords in categories.items():
                            if any(kw in script_name.lower() for kw in keywords):
                                if category not in data["commands"]:
                                    data["commands"][category] = []
                                data["commands"][category].append(
                                    f"{script_name}: {script_cmd[:50]}..."
                                    if len(script_cmd) > 50 else f"{script_name}: {script_cmd}"
                                )
                                categorized = True
                                break

                        if not categorized:
                            if "other" not in data["commands"]:
                                data["commands"]["other"] = []
                            data["commands"]["other"].append(script_name)

                data["command_sources"].append("package.json")

            except Exception:
                pass

        # Check for Makefile
        if (self.project_root / "Makefile").exists():
            data["command_sources"].append("Makefile")

        # Check for docker-compose
        if (self.project_root / "docker-compose.yml").exists():
            data["command_sources"].append("docker-compose")

        return data

    def format_section(self, data: Dict[str, Any]) -> Optional[SectionData]:
        if not data["commands"]:
            return None

        lines = ["## 🚀 Available Commands\n"]

        for category, cmds in data["commands"].items():
            lines.append(f"### {category.title()}")
            for cmd in cmds[:5]:  # Limit to 5 per category
                lines.append(f"- `{cmd}`")
            if len(cmds) > 5:
                lines.append(f"- _{len(cmds) - 5} more..._")
            lines.append("")

        if data["command_sources"]:
            lines.append(f"**Sources**: {', '.join(data['command_sources'])}")

        return SectionData(
            id="commands",
            title="Available Commands",
            content="\n".join(lines),
            priority=40
        )


class HealthCheckPlugin(ContextPlugin):
    """Performs basic health checks on the project"""

    @property
    def priority(self) -> int:
        return 50

    def discover(self) -> Dict[str, Any]:
        data = {
            "health_status": {},
            "issues": []
        }

        # Check for common issues

        # TypeScript errors
        if (self.project_root / "tsconfig.json").exists():
            tsc_check = self.run_command(["npx", "tsc", "--noEmit"], timeout=10)
            if tsc_check is not None:
                data["health_status"]["TypeScript"] = "✅" if not tsc_check else "❌"
                if tsc_check:
                    error_count = len(re.findall(r"error TS\d+", tsc_check))
                    data["issues"].append(f"TypeScript: {error_count} errors")

        # Git status
        if (self.project_root / ".git").exists():
            status = self.run_command(["git", "status", "--porcelain"])
            data["health_status"]["Git"] = "✅" if status is not None else "❌"

        # Package manager lockfile sync
        if (self.project_root / "package.json").exists():
            if (self.project_root / "pnpm-lock.yaml").exists():
                data["health_status"]["Dependencies"] = "✅"
            elif (self.project_root / "yarn.lock").exists():
                data["health_status"]["Dependencies"] = "✅"
            elif (self.project_root / "package-lock.json").exists():
                data["health_status"]["Dependencies"] = "✅"
            else:
                data["health_status"]["Dependencies"] = "⚠️"
                data["issues"].append("No lockfile found")

        # Check for TODO/FIXME in code
        todo_count = 0
        for ext in ["*.ts", "*.tsx", "*.js", "*.jsx", "*.py"]:
            for file in self.project_root.rglob(ext):
                if "node_modules" not in str(file) and ".git" not in str(file):
                    try:
                        content = file.read_text()
                        todo_count += len(re.findall(r"(TODO|FIXME|XXX|HACK)", content))
                    except Exception:
                        pass

        if todo_count > 0:
            data["issues"].append(f"{todo_count} TODO/FIXME comments")

        return data

    def format_section(self, data: Dict[str, Any]) -> Optional[SectionData]:
        lines = ["## 🏥 Project Health\n"]

        if data["health_status"]:
            lines.append("### Status Checks")
            for check, status in data["health_status"].items():
                lines.append(f"- **{check}**: {status}")
            lines.append("")

        if data["issues"]:
            lines.append("### ⚠️ Issues")
            for issue in data["issues"]:
                lines.append(f"- {issue}")

        return SectionData(
            id="health",
            title="Project Health",
            content="\n".join(lines),
            priority=50
        )


class MCPServersPlugin(ContextPlugin):
    """Detects available MCP servers and their capabilities"""

    @property
    def priority(self) -> int:
        return 55

    def _analyze_mcp_tools(self, mcp_tools: List[str]) -> Dict[str, str]:
        """Analyze MCP tools to generate descriptions"""
        servers_info = {}

        # Group tools by server
        server_tools = {}
        for tool in mcp_tools:
            parts = tool.split("__")
            if len(parts) >= 2:
                server = parts[1]
                function = parts[2] if len(parts) >= 3 else "general"
                if server not in server_tools:
                    server_tools[server] = []
                server_tools[server].append(function)

        # Generate descriptions based on tool patterns
        for server, tools in server_tools.items():
            server_name = server.replace("-", " ").title()
            description = self._generate_description(server, tools)
            if description:
                servers_info[server_name] = description

        return servers_info

    def _generate_descriptions_for_servers(self, server_names: List[str]) -> Dict[str, str]:
        """Generate descriptions for active servers (direct from server names)"""
        servers_info = {}

        for server in server_names:
            server_formatted = server.replace("-", " ").title()
            description = self._generate_description_by_name(server)
            if description:
                servers_info[server_formatted] = description

        return servers_info

    def _generate_description_by_name(self, server: str) -> str:
        """Generate description based on server name only"""
        server_lower = server.lower().replace("-", " ")

        # Specific server patterns (using original server name)
        if server == "serena":
            return "Agent sémantique - analyse code, refactoring, navigation symboles"
        elif server == "context7":
            return "Documentation framework temps réel (Nuxt, Vue, React)"
        elif server == "perplexity-copilot":
            return "Recherche web IA temps réel, sessions persistantes, 5 modèles (sonar, reasoning)"
        elif server == "task-master":
            return "Gestion projets et tâches avec tracking progression"
        elif server == "pareto-planner":
            return "Planification 80/20 pour priorisation intelligente"
        elif server == "git-master":
            return "Opérations Git avancées, branches, commits, historique"
        elif server == "docker-master":
            return "Gestion containers Docker, images, registres"
        elif server == "eslint-master":
            return "Analyse et correction automatique code JavaScript/TypeScript"
        elif server == "airtable":
            return "API Airtable - bases, tables, records, recherche"
        elif "gemini" in server_lower:
            return "Assistant IA Google - génération code, sessions, multimodal"
        elif "gpt5" in server_lower:
            return "Assistant IA OpenAI - développement, sessions, uploads"
        elif server == "firecrawl":
            return "Extraction contenu web structuré, scraping, crawling"
        elif "cloudinary" in server_lower:
            return "Gestion médias - upload, optimisation, transformations"
        elif "turso" in server_lower:
            return "Base données Turso SQLite, requêtes, migrations"
        elif "docusync" in server_lower:
            return "Synchronisation documentation automatique"
        elif "railway" in server_lower:
            return "Déploiement et infrastructure cloud Railway"
        elif "prisma" in server_lower:
            return "ORM Prisma - modèles, migrations, admin interface"
        elif "postman" in server_lower:
            return "Tests API et collections Postman"
        elif "github" in server_lower and "actions" in server_lower:
            return "CI/CD GitHub Actions - workflows, déploiements"
        elif "monorepo" in server_lower:
            return "Gestion monorepo - analyse structure, dépendances"
        elif "terminal" in server_lower:
            return "Observation et monitoring processus terminal"
        elif "filesystem" in server_lower:
            return "Opérations système de fichiers"

        # NEW: Descriptions for missing servers
        elif server == "playwright":
            return "Tests E2E browser automation - capture, interaction, assertions"
        elif "browser" in server_lower and "automation" in server_lower:
            return "Automatisation navigateur - contrôle, scraping, tests"
        elif "code-critique" in server_lower or "code_critique" in server_lower:
            return "Analyse qualité code - complexité, smells, métriques"

        # Pattern-based detection for unknown servers
        elif "test" in server_lower or "playwright" in server_lower:
            return "Outils de test automatisé"
        elif "browser" in server_lower or "automation" in server_lower:
            return "Automatisation et contrôle navigateur"
        elif "critique" in server_lower or "quality" in server_lower:
            return "Analyse et amélioration qualité code"
        else:
            return ""

    def _generate_description(self, server: str, tools: List[str]) -> str:
        """Generate concise description based on tool patterns"""
        tools_str = " ".join(tools).lower()
        server_lower = server.lower().replace("-", " ")

        # Specific server patterns (using original server name with dashes)
        if server == "serena":
            return "Agent sémantique - analyse code, refactoring, navigation symboles"
        elif server == "context7":
            return "Documentation framework temps réel (Nuxt, Vue, React)"
        elif server == "perplexity-copilot":
            return "Recherche web IA temps réel, sessions persistantes, 5 modèles (sonar, reasoning)"
        elif server == "task-master":
            return "Gestion projets et tâches avec tracking progression"
        elif server == "pareto-planner":
            return "Planification 80/20 pour priorisation intelligente"
        elif server == "git-master":
            return "Opérations Git avancées, branches, commits, historique"
        elif server == "docker-master":
            return "Gestion containers Docker, images, registres"
        elif server == "eslint-master":
            return "Analyse et correction automatique code JavaScript/TypeScript"
        elif server == "airtable-mcp" or server == "airtable":
            return "API Airtable - bases, tables, records, recherche"
        elif "gemini" in server_lower:
            return "Assistant IA Google - génération code, sessions, multimodal"
        elif "gpt5" in server_lower:
            return "Assistant IA OpenAI - développement, sessions, uploads"
        elif server == "firecrawl":
            return "Extraction contenu web structuré, scraping, crawling"
        elif "cloudinary" in server_lower:
            return "Gestion médias - upload, optimisation, transformations"
        elif "turso" in server_lower:
            return "Base données Turso SQLite, requêtes, migrations"
        elif "docusync" in server_lower:
            return "Synchronisation documentation automatique"
        elif "railway" in server_lower:
            return "Déploiement et infrastructure cloud Railway"
        elif "prisma" in server_lower:
            return "ORM Prisma - modèles, migrations, admin interface"
        elif "postman" in server_lower:
            return "Tests API et collections Postman"
        elif "github" in server_lower and "actions" in server_lower:
            return "CI/CD GitHub Actions - workflows, déploiements"
        elif "monorepo" in server_lower:
            return "Gestion monorepo - analyse structure, dépendances"
        elif "terminal" in server_lower:
            return "Observation et monitoring processus terminal"
        elif "filesystem" in server_lower:
            return "Opérations système de fichiers"

        # Pattern-based detection for unknown servers
        elif any(x in tools_str for x in ["session", "conversation"]):
            return "Assistant conversationnel avec sessions"
        elif any(x in tools_str for x in ["search", "web", "fetch"]):
            return "Recherche et extraction web"
        elif any(x in tools_str for x in ["build", "deploy", "container"]):
            return "Outils déploiement et infrastructure"
        elif any(x in tools_str for x in ["test", "lint", "analyze"]):
            return "Outils qualité et analyse code"
        elif any(x in tools_str for x in ["database", "db", "sql"]):
            return "Gestion base de données"
        else:
            return ""

    def _get_mcp_servers_from_config(self) -> Dict[str, Dict[str, str]]:
        """Get configured MCP servers from JSON config files (fast and lightweight)"""
        servers = {}

        # Config file paths to check
        config_files = [
            Path.home() / ".claude.json",  # User global config
            PROJECT_ROOT / ".mcp.json",    # Project config
            PROJECT_ROOT / ".claude" / "settings.json"  # Local settings
        ]

        for config_file in config_files:
            try:
                if not config_file.exists():
                    continue

                with open(config_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Extract mcpServers section
                mcp_servers = data.get("mcpServers", {})

                for server_name, server_config in mcp_servers.items():
                    # Format server info (lightweight, no health checks)
                    servers[server_name] = {
                        'command': server_config.get('command', 'unknown'),
                        'status': '✓ Configured',  # Assume configured = active
                        'connected': True,
                        'config_source': str(config_file.name)
                    }

            except (json.JSONDecodeError, PermissionError, Exception):
                # Skip files that can't be read or parsed
                continue

        return servers

    def discover(self) -> Dict[str, Any]:
        data = {
            "mcp_servers": [],
            "mcp_servers_info": {},
            "mcp_servers_status": {},
            "mcp_config_found": False,
            "claude_settings": None
        }

        # Primary method: Get configured servers from config files (lightweight)
        active_servers = self._get_mcp_servers_from_config()

        if active_servers:
            data["mcp_config_found"] = True

            # Extract server names and status
            for server_name, server_info in active_servers.items():
                formatted_name = server_name.replace("-", " ").title()
                data["mcp_servers"].append(formatted_name)
                data["mcp_servers_status"][formatted_name] = server_info

            # Generate descriptions for all active servers
            data["mcp_servers_info"] = self._generate_descriptions_for_servers(list(active_servers.keys()))
        else:
            # DEBUG: Add debug info if CLI fails
            data["mcp_debug"] = "claude mcp list failed or returned no servers"

        # Fallback: Check .claude/settings.json if CLI fails
        if not data["mcp_config_found"]:
            claude_settings = self.project_root / ".claude" / "settings.json"
            if claude_settings.exists():
                try:
                    import json
                    with open(claude_settings) as f:
                        settings = json.load(f)
                        data["claude_settings"] = settings
                        data["mcp_config_found"] = True

                        # Extract MCP servers info from permissions
                        if "permissions" in settings and "allow" in settings["permissions"]:
                            mcp_tools = [p for p in settings["permissions"]["allow"] if p.startswith("mcp__")]
                            data["mcp_servers_info"] = self._analyze_mcp_tools(mcp_tools)

                            # Get server names
                            mcp_servers = set()
                            for tool in mcp_tools:
                                parts = tool.split("__")
                                if len(parts) >= 2:
                                    server_name = parts[1].replace("-", " ").title()
                                    mcp_servers.add(server_name)
                            data["mcp_servers"] = list(mcp_servers)
                except Exception:
                    pass

        return data

    def format_section(self, data: Dict[str, Any]) -> Optional[SectionData]:
        if not data["mcp_config_found"] and not data["mcp_servers"]:
            return None

        lines = ["## 🤖 MCP Servers\n"]

        if data["mcp_servers"]:
            lines.append(f"**Available Servers**: {len(data['mcp_servers'])}")
            lines.append("")


            # Group servers by category (order matters - more specific first)
            core_servers = [s for s in data["mcp_servers"] if s in ["Serena", "Context7"]]
            task_servers = [s for s in data["mcp_servers"] if "Task" in s or "Pareto" in s]
            infra_servers = [s for s in data["mcp_servers"] if s in ["Git Master", "Docker Master", "Turso Cloud"]]
            ai_servers = [s for s in data["mcp_servers"] if any(term in s for term in ["Copilot", "Gemini", "Gpt5"]) and "Browser" not in s]
            testing_servers = [s for s in data["mcp_servers"] if any(term in s for term in ["Playwright", "Code Critique", "Eslint"])]
            browser_servers = [s for s in data["mcp_servers"] if any(term in s for term in ["Browser", "Firecrawl"]) and s not in ai_servers]
            cloud_servers = [s for s in data["mcp_servers"] if any(term in s for term in ["Airtable", "Railway", "Cloudinary", "Docusync"])]
            other_servers = [s for s in data["mcp_servers"] if s not in core_servers + task_servers + infra_servers + ai_servers + testing_servers + browser_servers + cloud_servers]

            def format_server_line(server: str) -> str:
                """Format a server line with description and status"""
                desc = data["mcp_servers_info"].get(server, "")
                status_info = data["mcp_servers_status"].get(server, {})
                status_icon = " ✓" if status_info.get("connected", False) else " ⚠️"

                if desc:
                    return f"- **{server}**: {desc}{status_icon}"
                else:
                    return f"- **{server}**{status_icon}"

            if core_servers:
                lines.append("### Core Development")
                for server in core_servers:
                    lines.append(format_server_line(server))
                lines.append("")

            if task_servers:
                lines.append("### Project Management")
                for server in task_servers:
                    lines.append(format_server_line(server))
                lines.append("")

            if infra_servers:
                lines.append("### Infrastructure")
                for server in infra_servers:
                    lines.append(format_server_line(server))
                lines.append("")

            if ai_servers:
                lines.append("### AI Assistants")
                for server in ai_servers:
                    lines.append(format_server_line(server))
                lines.append("")

            if testing_servers:
                lines.append("### Testing & Quality")
                for server in testing_servers:
                    lines.append(format_server_line(server))
                lines.append("")

            if browser_servers:
                lines.append("### Browser & Web")
                for server in browser_servers:
                    lines.append(format_server_line(server))
                lines.append("")

            if cloud_servers:
                lines.append("### Cloud Services")
                for server in cloud_servers:
                    lines.append(format_server_line(server))
                lines.append("")

            if other_servers:
                lines.append("### Other Tools")
                for server in other_servers:
                    lines.append(format_server_line(server))

        return SectionData(
            id="mcp_servers",
            title="MCP Servers",
            content="\n".join(lines),
            priority=55
        )


class RecentActivityPlugin(ContextPlugin):
    """Tracks recent project activity"""

    @property
    def priority(self) -> int:
        return 60

    def discover(self) -> Dict[str, Any]:
        data = {
            "recent_files": [],
            "active_areas": []
        }

        # Find recently modified files (last 24 hours)
        try:
            result = self.run_command([
                "find", ".", "-type", "f",
                "-mtime", "-1",
                "-not", "-path", "*/node_modules/*",
                "-not", "-path", "*/.git/*"
            ], timeout=5)

            if result:
                files = result.strip().split('\n')
                data["recent_files"] = files[:10]  # Top 10

                # Determine active areas
                areas = set()
                for file in files:
                    parts = Path(file).parts
                    if len(parts) > 1:
                        areas.add(parts[1])  # First level directory

                data["active_areas"] = list(areas)[:5]

        except Exception:
            pass

        return data

    def format_section(self, data: Dict[str, Any]) -> Optional[SectionData]:
        if not data["recent_files"]:
            return None

        lines = ["## 📈 Recent Activity\n"]

        if data["active_areas"]:
            lines.append(f"**Active Areas**: {', '.join(data['active_areas'])}")
            lines.append("")

        lines.append("### Recently Modified")
        for file in data["recent_files"][:5]:
            lines.append(f"- {file}")

        return SectionData(
            id="activity",
            title="Recent Activity",
            content="\n".join(lines),
            priority=60
        )


class ContextCache:
    """Manages caching of discovered context for performance"""

    def __init__(self, cache_path: Path):
        self.cache_path = cache_path
        self.cache_data = {}
        self.load()

    def load(self):
        """Load cache from disk"""
        if self.cache_path.exists():
            try:
                with open(self.cache_path) as f:
                    self.cache_data = json.load(f)
            except Exception:
                self.cache_data = {}

    def save(self):
        """Save cache to disk"""
        try:
            with open(self.cache_path, 'w') as f:
                json.dump(self.cache_data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save cache: {e}")

    def get_hash(self, key: str) -> Optional[str]:
        """Get hash for a cache key"""
        return self.cache_data.get(key, {}).get("hash")

    def get_data(self, key: str) -> Optional[Any]:
        """Get cached data if still valid"""
        entry = self.cache_data.get(key)
        if not entry:
            return None

        # Check if cache is still fresh (1 hour)
        timestamp = datetime.fromisoformat(entry.get("timestamp", "2000-01-01"))
        if (datetime.now() - timestamp).total_seconds() > 3600:
            return None

        return entry.get("data")

    def set_data(self, key: str, data: Any, hash_value: str = None):
        """Set cache data"""
        self.cache_data[key] = {
            "data": data,
            "hash": hash_value,
            "timestamp": datetime.now().isoformat()
        }
        self.save()


class ConfigManager:
    """Manages configuration from context.yaml"""

    def __init__(self, config_path: Path):
        self.config_path = config_path
        self.config = self.load_config()

    def load_config(self) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        if not self.config_path.exists():
            return self.get_default_config()

        try:
            with open(self.config_path) as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return self.get_default_config()

    def get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            "context_updater": {
                "enabled": True,
                "update_frequency": "on_commit",
                "sections": [
                    {"id": "project_info", "enabled": True, "priority": 1},
                    {"id": "git_status", "enabled": True, "priority": 10},
                    {"id": "package_management", "enabled": True, "priority": 20},
                    {"id": "environment", "enabled": True, "priority": 30},
                    {"id": "commands", "enabled": True, "priority": 40},
                    {"id": "health", "enabled": True, "priority": 50},
                    {"id": "activity", "enabled": True, "priority": 60},
                ],
                "preserve_custom": True,
                "auto_detect": True,
            }
        }

    def is_section_enabled(self, section_id: str) -> bool:
        """Check if a section is enabled"""
        sections = self.config.get("context_updater", {}).get("sections", [])
        for section in sections:
            if section.get("id") == section_id:
                return section.get("enabled", True)
        return True

    def get_section_priority(self, section_id: str) -> int:
        """Get priority for a section"""
        sections = self.config.get("context_updater", {}).get("sections", [])
        for section in sections:
            if section.get("id") == section_id:
                return section.get("priority", 100)
        return 100


class ClaudeContextUpdater:
    """Main updater class that orchestrates everything"""

    def __init__(self):
        self.project_root = PROJECT_ROOT
        self.claude_md_path = CLAUDE_MD_PATH
        self.plugin_manager = PluginManager(self.project_root)
        self.cache = ContextCache(CACHE_PATH)
        self.config = ConfigManager(CONFIG_PATH)

        # Ensure directories exist
        HOOKS_DIR.mkdir(parents=True, exist_ok=True)

    def update_claude_md(self):
        """Main update function"""

        if not self.config.config.get("context_updater", {}).get("enabled", True):
            logger.info("Context updater is disabled")
            return

        logger.info("Starting CLAUDE.md update...")

        # Load plugins
        self.plugin_manager.load_builtin_plugins()

        # Run plugins to get context
        context, sections = self.plugin_manager.run_all_plugins()

        # Filter enabled sections
        enabled_sections = [
            s for s in sections
            if self.config.is_section_enabled(s.id)
        ]

        # Sort by priority
        enabled_sections.sort(key=lambda s: s.priority)

        # Read current CLAUDE.md
        current_content = ""
        if self.claude_md_path.exists():
            current_content = self.claude_md_path.read_text()

        # Update content
        new_content = self._update_content(current_content, enabled_sections)

        # Write back if changed
        if new_content != current_content:
            self.claude_md_path.write_text(new_content)
            logger.info("CLAUDE.md updated successfully")
        else:
            logger.info("No changes needed")

    def _update_content(self, content: str, sections: List[SectionData]) -> str:
        """Update CLAUDE.md content with new sections"""

        # Preserve custom content
        preserve_custom = self.config.config.get("context_updater", {}).get("preserve_custom", True)

        # Find dynamic sections markers
        dynamic_start = "<!-- DYNAMIC_CONTENT_START -->"
        dynamic_end = "<!-- DYNAMIC_CONTENT_END -->"

        # If markers don't exist, add them
        if dynamic_start not in content:
            # Add markers at the end
            content += f"\n\n{dynamic_start}\n{dynamic_end}\n"

        # Extract parts
        parts = content.split(dynamic_start)
        before = parts[0]

        if dynamic_end in content:
            after_parts = content.split(dynamic_end)
            after = after_parts[-1]
        else:
            after = ""

        # Build dynamic content
        dynamic_lines = [dynamic_start]
        dynamic_lines.append(f"<!-- Generated: {datetime.now().isoformat()} -->")
        dynamic_lines.append("<!-- This content is automatically updated -->")
        dynamic_lines.append("")

        for section in sections:
            dynamic_lines.append(section.content)
            dynamic_lines.append("")

        dynamic_lines.append(dynamic_end)

        # Combine
        new_content = before + "\n".join(dynamic_lines) + after

        return new_content


def main():
    """Main entry point"""
    try:
        updater = ClaudeContextUpdater()
        updater.update_claude_md()
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
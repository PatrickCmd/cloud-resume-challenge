"""
Seed deployed DynamoDB with test data.

Seeds production or development databases with:
- Blog posts from backend/data/blogs.json
- Projects from backend/data/projects.json
- Certifications from backend/data/certifications.json

Usage:
    # Seed development environment
    python backend/scripts/seed_deployed.py --env development

    # Seed production environment (with confirmation)
    python backend/scripts/seed_deployed.py --env production

    # Dry run (show what would be seeded)
    python backend/scripts/seed_deployed.py --env development --dry-run

Prerequisites:
    - AWS credentials configured (AWS_PROFILE environment variable)
    - Cognito user credentials in environment variables
    - Test data files in backend/data/
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import List, Dict

import httpx


# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_header(message: str):
    """Print header message."""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'=' * 70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{message:^70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'=' * 70}{Colors.ENDC}\n")


def print_success(message: str):
    """Print success message."""
    print(f"{Colors.OKGREEN}✓{Colors.ENDC} {message}")


def print_error(message: str):
    """Print error message."""
    print(f"{Colors.FAIL}✗{Colors.ENDC} {message}")


def print_info(message: str):
    """Print info message."""
    print(f"{Colors.OKBLUE}ℹ{Colors.ENDC} {message}")


def print_warning(message: str):
    """Print warning message."""
    print(f"{Colors.WARNING}⚠{Colors.ENDC} {message}")


def get_environment_config(env: str) -> Dict[str, str]:
    """Get environment-specific configuration."""
    if env == "production":
        return {
            "api_url": os.getenv("PROD_API_URL", "https://api.patrickcmd.dev"),
            "test_user_email": os.getenv("PROD_TEST_USER_EMAIL"),
            "test_user_password": os.getenv("PROD_TEST_USER_PASSWORD"),
        }
    else:  # development
        return {
            "api_url": os.getenv("DEV_API_URL", "https://api-dev.patrickcmd.dev"),
            "test_user_email": os.getenv("DEV_TEST_USER_EMAIL"),
            "test_user_password": os.getenv("DEV_TEST_USER_PASSWORD"),
        }


def authenticate(config: Dict[str, str]) -> str:
    """Authenticate and get access token."""
    print_info(f"Authenticating with {config['api_url']}")

    credentials = {
        "email": config["test_user_email"],
        "password": config["test_user_password"],
    }

    if not credentials["email"] or not credentials["password"]:
        raise ValueError(
            "Authentication credentials not found. Set PROD_TEST_USER_EMAIL and "
            "PROD_TEST_USER_PASSWORD (or DEV_*) environment variables."
        )

    try:
        with httpx.Client(base_url=config["api_url"], timeout=30.0) as client:
            response = client.post("/auth/login", json=credentials)

            if response.status_code != 200:
                raise RuntimeError(
                    f"Authentication failed: {response.status_code} - {response.text}"
                )

            tokens = response.json()
            print_success("Authentication successful")
            return tokens["access_token"]

    except httpx.RequestError as e:
        raise RuntimeError(f"Network error during authentication: {e}")


def load_test_data(data_dir: Path) -> tuple:
    """Load test data from JSON files."""
    print_info("Loading test data files")

    blogs_file = data_dir / "blogs.json"
    projects_file = data_dir / "projects.json"
    certifications_file = data_dir / "certifications.json"

    with open(blogs_file) as f:
        blogs = json.load(f)
    print_success(f"Loaded {len(blogs)} blog posts")

    with open(projects_file) as f:
        projects = json.load(f)
    print_success(f"Loaded {len(projects)} projects")

    with open(certifications_file) as f:
        certifications = json.load(f)
    print_success(f"Loaded {len(certifications)} certifications")

    return blogs, projects, certifications


def seed_blogs(client: httpx.Client, headers: Dict[str, str], blogs: List[Dict], dry_run: bool):
    """Seed blog posts."""
    print_header("Seeding Blog Posts")

    created_count = 0
    published_count = 0

    for i, blog in enumerate(blogs, 1):
        if dry_run:
            print_info(f"[DRY RUN] Would create blog: {blog['title']}")
            continue

        try:
            # Create blog
            response = client.post("/blogs", json=blog, headers=headers)

            if response.status_code == 201:
                created_blog = response.json()
                created_count += 1
                print_success(f"{i}/{len(blogs)}: Created blog '{blog['title']}'")

                # Publish if marked as published
                if blog.get("published", False):
                    publish_response = client.post(
                        f"/blogs/{created_blog['id']}/publish", headers=headers
                    )

                    if publish_response.status_code in [200, 204]:
                        published_count += 1
                        print_success(f"  → Published")
                    else:
                        print_warning(f"  → Publish failed: {publish_response.status_code}")
            else:
                print_error(f"{i}/{len(blogs)}: Failed to create '{blog['title']}': "
                           f"{response.status_code} - {response.text[:100]}")

        except Exception as e:
            print_error(f"{i}/{len(blogs)}: Error creating '{blog['title']}': {e}")

    print(f"\n{Colors.OKGREEN}Blog Summary:{Colors.ENDC}")
    print(f"  Created: {created_count}/{len(blogs)}")
    print(f"  Published: {published_count}/{created_count if created_count > 0 else 0}")


def seed_projects(
    client: httpx.Client, headers: Dict[str, str], projects: List[Dict], dry_run: bool
):
    """Seed projects."""
    print_header("Seeding Projects")

    created_count = 0
    published_count = 0

    for i, project in enumerate(projects, 1):
        if dry_run:
            print_info(f"[DRY RUN] Would create project: {project['name']}")
            continue

        try:
            # Create project
            response = client.post("/projects", json=project, headers=headers)

            if response.status_code == 201:
                created_project = response.json()
                created_count += 1
                print_success(f"{i}/{len(projects)}: Created project '{project['name']}'")

                # Publish if featured
                if project.get("featured", False):
                    publish_response = client.post(
                        f"/projects/{created_project['id']}/publish", headers=headers
                    )

                    if publish_response.status_code in [200, 204]:
                        published_count += 1
                        print_success(f"  → Published")
            else:
                print_error(f"{i}/{len(projects)}: Failed to create '{project['name']}': "
                           f"{response.status_code} - {response.text[:100]}")

        except Exception as e:
            print_error(f"{i}/{len(projects)}: Error creating '{project['name']}': {e}")

    print(f"\n{Colors.OKGREEN}Project Summary:{Colors.ENDC}")
    print(f"  Created: {created_count}/{len(projects)}")
    print(f"  Published: {published_count}/{created_count if created_count > 0 else 0}")


def seed_certifications(
    client: httpx.Client, headers: Dict[str, str], certifications: List[Dict], dry_run: bool
):
    """Seed certifications."""
    print_header("Seeding Certifications")

    created_count = 0
    published_count = 0

    for i, cert in enumerate(certifications, 1):
        if dry_run:
            print_info(f"[DRY RUN] Would create certification: {cert['name']}")
            continue

        try:
            # Create certification
            response = client.post("/certifications", json=cert, headers=headers)

            if response.status_code == 201:
                created_cert = response.json()
                created_count += 1
                print_success(f"{i}/{len(certifications)}: Created cert '{cert['name']}'")

                # Publish if featured
                if cert.get("featured", False):
                    publish_response = client.post(
                        f"/certifications/{created_cert['id']}/publish", headers=headers
                    )

                    if publish_response.status_code in [200, 204]:
                        published_count += 1
                        print_success(f"  → Published")
            else:
                print_error(f"{i}/{len(certifications)}: Failed to create '{cert['name']}': "
                           f"{response.status_code} - {response.text[:100]}")

        except Exception as e:
            print_error(f"{i}/{len(certifications)}: Error creating '{cert['name']}': {e}")

    print(f"\n{Colors.OKGREEN}Certification Summary:{Colors.ENDC}")
    print(f"  Created: {created_count}/{len(certifications)}")
    print(f"  Published: {published_count}/{created_count if created_count > 0 else 0}")


def main():
    """Main seeding function."""
    parser = argparse.ArgumentParser(
        description="Seed deployed DynamoDB with test data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Seed development environment
  python backend/scripts/seed_deployed.py --env development

  # Seed production (with confirmation)
  python backend/scripts/seed_deployed.py --env production

  # Dry run
  python backend/scripts/seed_deployed.py --env development --dry-run

Environment Variables:
  PROD_API_URL, PROD_TEST_USER_EMAIL, PROD_TEST_USER_PASSWORD
  DEV_API_URL, DEV_TEST_USER_EMAIL, DEV_TEST_USER_PASSWORD
        """,
    )
    parser.add_argument(
        "--env",
        choices=["production", "development"],
        required=True,
        help="Environment to seed (production or development)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be seeded without actually seeding",
    )
    parser.add_argument(
        "--blogs-only",
        action="store_true",
        help="Only seed blog posts",
    )
    parser.add_argument(
        "--projects-only",
        action="store_true",
        help="Only seed projects",
    )
    parser.add_argument(
        "--certifications-only",
        action="store_true",
        help="Only seed certifications",
    )

    args = parser.parse_args()

    # Print banner
    print_header(f"Seeding {args.env.upper()} Environment")

    # Production confirmation
    if args.env == "production" and not args.dry_run:
        print_warning("You are about to seed the PRODUCTION database!")
        confirmation = input("Type 'yes' to confirm: ")
        if confirmation.lower() != "yes":
            print_info("Seeding cancelled")
            sys.exit(0)

    if args.dry_run:
        print_warning("DRY RUN MODE - No data will be created")

    try:
        # Get configuration
        config = get_environment_config(args.env)
        print_info(f"Target API: {config['api_url']}")

        # Authenticate
        access_token = authenticate(config)
        headers = {"Authorization": f"Bearer {access_token}"}

        # Load test data
        data_dir = Path(__file__).parent.parent / "data"
        blogs, projects, certifications = load_test_data(data_dir)

        # Seed data
        with httpx.Client(base_url=config["api_url"], timeout=60.0) as client:
            if args.blogs_only:
                seed_blogs(client, headers, blogs, args.dry_run)
            elif args.projects_only:
                seed_projects(client, headers, projects, args.dry_run)
            elif args.certifications_only:
                seed_certifications(client, headers, certifications, args.dry_run)
            else:
                # Seed all
                seed_blogs(client, headers, blogs, args.dry_run)
                seed_projects(client, headers, projects, args.dry_run)
                seed_certifications(client, headers, certifications, args.dry_run)

        # Final summary
        print_header("Seeding Complete!")
        if args.dry_run:
            print_info("This was a dry run. No data was actually created.")
        else:
            print_success(f"Successfully seeded {args.env} environment")

    except Exception as e:
        print_error(f"Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

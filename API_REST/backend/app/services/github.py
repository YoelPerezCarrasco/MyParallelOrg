from http.client import HTTPException
import os
import httpx
import logging
from typing import List
from sqlalchemy.orm import Session
from app.models.user import GitHubUserModel
import logging


# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Tu token de autenticación de GitHub
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
async def fetch_github_user(username: str) -> dict:
    url = f"https://api.github.com/users/{username}"
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}'
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()  # Levanta un error si el status code no es 200
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub API error: {e.response.status_code} for user {username}")
        raise
    except Exception as e:
        logger.error(f"Error fetching GitHub user: {e}")
        raise

async def fetch_github_org_repos(org: str) -> List[dict]:
    url = f"https://api.github.com/orgs/{org}/repos"
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}'
    }
    repos = []
    page = 1

    try:
        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(url, headers=headers, params={"per_page": 100, "page": page})
                response.raise_for_status()
                page_repos = response.json()

                if not page_repos:
                    break

                repos.extend(page_repos)
                page += 1

        return repos
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub API error: {e.response.status_code} for org {org}")
        raise
    except Exception as e:
        logger.error(f"Error fetching GitHub organization repos: {e}")
        raise

async def fetch_github_repo_contributors(org: str, repo: str) -> List[dict]:
    url = f"https://api.github.com/repos/{org}/{repo}/contributors"
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}'
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub API error: {e.response.status_code} for repo {repo}")
        raise
    except Exception as e:
        logger.error(f"Error fetching GitHub repo contributors: {e}")
        raise
    
async def fetch_github_repo_commits(org: str, repo: str) -> List[dict]:
    url = f"https://api.github.com/repos/{org}/{repo}/commits"
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}'
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub API error: {e.response.status_code} for repo {repo}")
        raise
    except Exception as e:
        logger.error(f"Error fetching GitHub repo commits: {e}")
        raise

async def fetch_github_user_details(username: str) -> dict:
    url = f"https://api.github.com/users/{username}"
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}'
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub API error: {e.response.status_code} for user {username}")
        raise
    except Exception as e:
        logger.error(f"Error fetching GitHub user details: {e}")
        raise


async def fetch_user_dominant_language(username: str) -> str:
    """
    Fetch the dominant language used by a GitHub user across all their repositories.

    :param username: The GitHub username.
    :param github_token: GitHub personal access token for authentication.
    :return: The dominant language (string) or None if there's an error.
    """
    url = f"https://api.github.com/users/{username}/repos"
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}'
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            repos = response.json()

            language_stats = {}

            for repo in repos:
                repo_name = repo['name']
                owner = repo['owner']['login']

                # Fetch languages used in this repository
                lang_url = f"https://api.github.com/repos/{owner}/{repo_name}/languages"
                lang_response = await client.get(lang_url, headers=headers)
                lang_response.raise_for_status()
                languages = lang_response.json()

                for lang, bytes_count in languages.items():
                    if lang in language_stats:
                        language_stats[lang] += bytes_count
                    else:
                        language_stats[lang] = bytes_count

            if language_stats:
                # Find the language with the most bytes
                dominant_language = max(language_stats, key=language_stats.get)
                return dominant_language
            else:
                logger.warning(f"No languages found for user {username}")
                return None
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub API error: {e.response.status_code} for user {username}")
        return None
    except Exception as e:
        logger.error(f"Error fetching languages for user {username}: {e}")
        return None


async def fetch_github_user_stars(username: str) -> int:
    url = f"https://api.github.com/users/{username}/repos"
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}'
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            repos = response.json()
            
            # Sumar las estrellas de todos los repositorios
            total_stars = sum(repo['stargazers_count'] for repo in repos)
            return total_stars
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub API error: {e.response.status_code} for user {username}")
        raise
    except Exception as e:
        logger.error(f"Error fetching GitHub user stars: {e}")
        raise


async def fetch_pull_requests(org: str, repo: str) -> List[dict]:
    url = f"https://api.github.com/repos/{org}/{repo}/pulls"
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}'
    }
    pull_requests = []
    page = 1

    try:
        async with httpx.AsyncClient() as client:
            while True:
                response = await client.get(url, headers=headers, params={"per_page": 100, "page": page, "state": "all"})
                response.raise_for_status()
                prs = response.json()

                if not prs:
                    break

                pull_requests.extend(prs)
                page += 1

        return pull_requests
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub API error: {e.response.status_code} for repo {repo}")
        raise
    except Exception as e:
        logger.error(f"Error fetching pull requests for repo {repo}: {e}")
        raise

async def fetch_pull_request_comments(org: str, repo: str, pr_number: int) -> List[dict]:
    url = f"https://api.github.com/repos/{org}/{repo}/issues/{pr_number}/comments"
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}'
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub API error: {e.response.status_code} for PR {pr_number} in repo {repo}")
        raise
    except Exception as e:
        logger.error(f"Error fetching comments for PR {pr_number} in repo {repo}: {e}")
        raise

async def fetch_pull_request_reviews(org: str, repo: str, pr_number: int) -> List[dict]:
    url = f"https://api.github.com/repos/{org}/{repo}/pulls/{pr_number}/reviews"
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}'
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub API error: {e.response.status_code} for PR {pr_number} in repo {repo}")
        raise
    except Exception as e:
        logger.error(f"Error fetching reviews for PR {pr_number} in repo {repo}: {e}")
        raise

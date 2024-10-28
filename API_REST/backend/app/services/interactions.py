
from sqlalchemy.orm import Session
from app.models.user import UserRepoCommits, UserRepoContributions, PullRequestComment, PullRequestReview
from sqlalchemy import func, distinct



def obtener_revisiones(db: Session, user_id_1: int, user_id_2: int) -> int:
    subquery = (
        db.query(PullRequestReview.pull_request_id)
        .filter(PullRequestReview.reviewer_id.in_([user_id_1, user_id_2]))
        .group_by(PullRequestReview.pull_request_id)
        .having(func.count(distinct(PullRequestReview.reviewer_id)) == 2)
        .subquery()
    )
    count = db.query(func.count()).select_from(subquery).scalar()
    return count or 0


def obtener_pull_requests_comentados(db: Session, user_id_1: int, user_id_2: int) -> int:
    subquery = (
        db.query(PullRequestComment.pull_request_id)
        .filter(PullRequestComment.commenter.in_([user_id_1, user_id_2]))
        .group_by(PullRequestComment.pull_request_id)
        .having(func.count(distinct(PullRequestComment.commenter)) == 2)
        .subquery()
    )
    count = db.query(func.count()).select_from(subquery).scalar()
    return count or 0


def obtener_contributions_juntas(db: Session, user_id_1: int, user_id_2: int) -> int:
    subquery = (
        db.query(UserRepoContributions.repo_name)
        .filter(UserRepoContributions.user_id.in_([user_id_1, user_id_2]))
        .group_by(UserRepoContributions.repo_name)
        .having(func.count(distinct(UserRepoContributions.user_id)) == 2)
        .subquery()
    )
    count = db.query(func.count()).select_from(subquery).scalar()
    return count or 0



def obtener_commits_juntos(db: Session, user_id_1: int, user_id_2: int) -> int:
    subquery = (
        db.query(UserRepoCommits.repo_name)
        .filter(UserRepoCommits.user_id.in_([user_id_1, user_id_2]))
        .group_by(UserRepoCommits.repo_name)
        .having(func.count(distinct(UserRepoCommits.user_id)) == 2)
        .subquery()
    )
    count = db.query(func.count()).select_from(subquery).scalar()
    return count or 0



from sqlalchemy.orm import Session




def obtener_pull_requests_comentados(db: Session, user_id_1: int, user_id_2: int) -> int:
    result = db.execute("""
        SELECT COUNT(DISTINCT c1.pull_request_id)
        FROM pull_request_comments c1
        JOIN pull_request_comments c2 ON c1.pull_request_id = c2.pull_request_id
        WHERE c1.commenter_id = :user1 AND c2.commenter_id = :user2 AND c1.commenter_id != c2.commenter_id
    """, {'user1': user_id_1, 'user2': user_id_2}).fetchone()
    return result[0] if result else 0

def obtener_revisiones(db: Session, user_id_1: int, user_id_2: int) -> int:
    result = db.execute("""
        SELECT COUNT(DISTINCT r1.pull_request_id)
        FROM pull_request_reviews r1
        JOIN pull_request_reviews r2 ON r1.pull_request_id = r2.pull_request_id
        WHERE r1.reviewer_id = :user1 AND r2.reviewer_id = :user2 AND r1.reviewer_id != r2.reviewer_id
    """, {'user1': user_id_1, 'user2': user_id_2}).fetchone()
    return result[0] if result else 0

def obtener_contributions_juntas(db: Session, user_id_1: int, user_id_2: int) -> int:
    result = db.execute("""
        SELECT COUNT(DISTINCT c1.repo_name)
        FROM user_repo_contributions c1
        JOIN user_repo_contributions c2 ON c1.repo_name = c2.repo_name
        WHERE c1.user_id = :user1 AND c2.user_id = :user2
    """, {'user1': user_id_1, 'user2': user_id_2}).fetchone()
    return result[0] if result else 0

def obtener_commits_juntos(db: Session, user_id_1: int, user_id_2: int) -> int:
    result = db.execute("""
        SELECT COUNT(DISTINCT c1.repo_name)
        FROM user_repo_commits c1
        JOIN user_repo_commits c2 ON c1.repo_name = c2.repo_name
        WHERE c1.user_id = :user1 AND c2.user_id = :user2
    """, {'user1': user_id_1, 'user2': user_id_2}).fetchone()
    return result[0] if result else 0




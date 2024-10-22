# app/services/gamification.py

from sqlalchemy.orm import Session
from app.models.user import GitHubUserModel, UserRepoCommits, PullRequestReview, PullRequest

def calcular_puntos_usuario(db: Session, usuario: GitHubUserModel):
    # Obtener el número de commits
    total_commits = db.query(UserRepoCommits).filter_by(user_id=usuario.id).count()
    
    # Obtener el número de revisiones de pull requests
    total_revisiones = db.query(PullRequestReview).filter_by(reviewer_id=usuario.id).count()
    
    # Obtener el número de pull requests aceptados (suponiendo que 'closed' significa aceptado)
    total_pr_aceptados = db.query(PullRequest).filter_by(author_id=usuario.id, state='closed').count()
    
    # Calcular los puntos
    puntos = (total_commits * 10) + (total_revisiones * 5) + (total_pr_aceptados * 20)
    
    # Actualizar los puntos del usuario
    usuario.puntos = puntos
    db.commit()
    
    return puntos

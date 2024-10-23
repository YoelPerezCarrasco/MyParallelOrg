from sqlalchemy.orm import Session
from app.models.user import GitHubUserModel, UserRepoCommits, PullRequestReview, PullRequest
from app.models.config import GamificationConfig
from app.services.gamification import get_gamification_config
from app.models.config import GamificationConfig

def calcular_puntos_usuario(db: Session, usuario: GitHubUserModel):
    config = get_gamification_config(db)
    puntos_commit = config.get('puntos_commit', 10)
    puntos_revision = config.get('puntos_revision', 5)
    puntos_pr_aceptado = config.get('puntos_pr_aceptado', 20)

    # Obtener el número de commits
    total_commits = db.query(UserRepoCommits).filter_by(user_id=usuario.id).count()

    # Obtener el número de revisiones de pull requests
    total_revisiones = db.query(PullRequestReview).filter_by(reviewer_id=usuario.id).count()

    # Obtener el número de pull requests aceptados (asumiendo que 'merged' es el estado para aceptado)
    total_pr_aceptados = db.query(PullRequest).filter_by(author_id=usuario.id, state='merged').count()

    # Calcular los puntos
    puntos = (total_commits * puntos_commit) + (total_revisiones * puntos_revision) + (total_pr_aceptados * puntos_pr_aceptado)

    # Actualizar los puntos del usuario
    usuario.puntos = puntos
    db.commit()

    return puntos


def get_gamification_config(db: Session):
    config = db.query(GamificationConfig).all()
    config_dict = {item.key: item.value for item in config}
    return config_dict

def update_gamification_config(db: Session, new_config: dict):
    for key, value in new_config.items():
        config_item = db.query(GamificationConfig).filter_by(key=key).first()
        if config_item:
            config_item.value = value
        else:
            config_item = GamificationConfig(key=key, value=value)
            db.add(config_item)
    db.commit()

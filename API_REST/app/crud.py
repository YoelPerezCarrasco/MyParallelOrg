import networkx as nx
from sqlalchemy.orm import Session
from app.models import GitHubUserModel

def build_user_graph(db: Session):
    G = nx.Graph()
    
    # Filtrar usuarios que no tengan valores nulos en `dominant_language`, `location`, y `stars`
    users = db.query(GitHubUserModel).filter(
        GitHubUserModel.dominant_language.isnot(None),
        GitHubUserModel.location.isnot(None),
        GitHubUserModel.stars.isnot(None)
    ).all()

    if not users:
        raise ValueError("No users found with all required attributes (dominant_language, location, stars).")
    
    # Añadir nodos al grafo
    for user in users:
        G.add_node(user.username, language=user.dominant_language, continent=user.location, stars=user.stars)
        print(f"Added node for user: {user.username} with language: {user.dominant_language}, continent: {user.location}, stars: {user.stars}")
    
    # Añadir aristas basadas en los tres criterios
    for user in users:
        for other_user in users:
            if user != other_user:
                # Criterios de similitud
                same_language = user.dominant_language == other_user.dominant_language
                same_continent = user.location == other_user.location
                similar_stars = abs(user.stars - other_user.stars) <= 50  # Por ejemplo, una diferencia de hasta 50 estrellas
                
                # Si cumplen los tres criterios, conectamos los nodos
                if same_language and same_continent and similar_stars:
                    try:
                        G.add_edge(user.username, other_user.username)
                        print(f"Added edge between {user.username} and {other_user.username} based on all three criteria: language, continent, stars")
                    except Exception as e:
                        print(f"Error adding edge: {e}")
    
    return G

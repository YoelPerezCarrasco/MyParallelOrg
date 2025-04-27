# MyParallelOrg

> **Análisis colaborativo inteligente para descubrir la “organización paralela” en GitHub**

MyParallelOrg es una plataforma web que analiza interacciones públicas en GitHub (commits, issues, pull requests, reviews…) para revelar cómo los usuarios **colaboran realmente** más allá de la estructura formal de organizaciones y repositorios. El objetivo es ayudar a investigadores y equipos de ingeniería a:

* detectar patrones de colaboración ocultos,
* identificar comportamientos atípicos y cuellos de botella, y
* visualizar insights accionables sin necesidad de acceder a datos privados.

---

## ✨ Características clave

| Módulo | Descripción |
|--------|-------------|
| **Extracción de datos** | Ingesta masiva a través de la **GitHub REST API** (paginação + parallel requests) con persistencia en PostgreSQL. |
| **Detección de anomalías** | Algoritmos como **Isolation Forest** y **Local Outlier Factor** para hallar picos inusuales en actividad, latencias de revisión, etc. |
| **Visualización sin librerías externas** | Gráficos interactivos (canvas/svg vanilla JS) renderizados en el navegador para cumplir la restricción académica ↔ “no librerías gráficas”. |
| **Chatbot RAG** | Asistente contextual que combina embeddings y DeepSeek-LM para responder preguntas sobre los datos almacenados. |
| **Funcionalidades sociales** | Seguir/Dejar de seguir, mensajería y grupos de trabajo con permisos basados en rol *(manager / worker)*. |

---

## 🏗️ Arquitectura

```
┌────────────────────────┐       ┌────────────────────┐
│  Frontend (React + TS) │──────▶│  API REST (Django) │
└────────────────────────┘       └────────────────────┘
           ▲                               ▲
           │ WebSockets (Django Channels)   │ ORM / SQL
           │                               │
┌────────────────────────┐       ┌────────────────────┐
│  Chatbot Service (RAG) │──────▶│   PostgreSQL DB    │
└────────────────────────┘       └────────────────────┘
           ▲                               ▲
           │                               │
           │ Celery   ───── Redis ─────► Task Queue
           │                               │
           ▼                               ▼
  GitHub Public API            Persisted Datasets (≈50 k rows)
```

---

## 🚀 Comenzar

### Requisitos previos

* Python ≥ 3.10
* PostgreSQL 15+
* Node ≥ 20 (para el frontend)
* Git
* (Opcional) Redis + Celery para tareas asíncronas

### Instalación rápida

```bash
# 1. Clona el repositorio
   git clone https://github.com/tu‑usuario/myparallelorg.git
   cd myparallelorg

# 2. Backend
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env   # añade tus credenciales
   python manage.py migrate
   python manage.py runserver 8000

# 3. Frontend
   cd frontend
   npm ci
   npm run dev            # Vite en http://localhost:5173
```

### Variables de entorno principales

| Variable | Propósito |
|----------|-----------|
| `GITHUB_TOKEN` | Token PAT con scopes `public_repo` (aumenta límites de rate). |
| `OPENAI_API_KEY` | Claves para embeddings y generación del chatbot. |
| `DB_*` | Host, puerto, usuario y contraseña de PostgreSQL. |
| `REDIS_URL` | Conexión a Redis si usas Celery. |

---

## 📈 Obtención y actualización de datos

```bash
python manage.py fetch_github --org micuenta --max-pages 100
```
El comando anterior descarga usuarios, repos, issues y eventos en lotes paginados, idempotentes y reanudables.

Programar refrescos:
```bash
celery -A core beat -l info  # ejecuta las tareas periódicas definidas en settings.py
```

---

## 🤖 Entrenamiento y uso de modelos ML

1. **Entrenar:**
   ```bash
   python ml/train_isolation_forest.py --input data/events.parquet --output models/isoforest.pkl
   ```
2. **Evaluar & servir:**
   ```bash
   python ml/serve_model.py --model models/isoforest.pkl
   ```
3. El servicio expone un endpoint REST (`/api/v1/anomaly-score/`) consumido por el backend.

---

## 📂 Estructura de carpetas

```
myparallelorg/
├─ backend/               # Proyecto Django
│  ├─ core/               # Configuración, settings, celery
│  ├─ apps/
│  │   ├─ github_data/    # Modelos y extractores
│  │   ├─ anomalies/
│  │   └─ chat/
│  └─ manage.py
├─ frontend/              # Vite + React + TS + Tailwind
├─ ml/                    # Scripts de IA/ML
├─ data/                  # Datasets (parquet/csv)
└─ docs/                  # Documentación adicional
```

---

## 👫 Contribuir

1. Crea un *fork* y una rama feature: `git checkout -b feat/nueva-funcionalidad`.
2. Sigue la guía de estilo *PEP 8* y ESLint.
3. Incluye **tests** unitarios (`pytest`) y una entrada en `CHANGELOG.md`.
4. Abre un **Pull Request** descriptivo.

---

## 📜 Licencia

MIT © 2025 Yoel Pérez Carrasco

---

## 📧 Contacto

* **Yoel Pérez Carrasco** – yoelperez@usal.com
* [LinkedIn](https://www.linkedin.com/in/yoelperezc)



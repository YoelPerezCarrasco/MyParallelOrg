import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import RetroGrid from './../components/magicui/RetroGrid';  // Asegúrate de que la ruta es correcta

const Homepage: React.FC = () => {
  return (
    <div className="relative">
      {/* RetroGrid Component as Background */}
      <main role="main" className="relative z-10" style={{ marginTop: 50 }}>
        {/* Main jumbotron for a primary marketing message or call to action */}
        <div className="jumbotron text-center">
          <div className="container">
            <h1 className="display-3">Bienvenido a MyParallelOrg</h1>
            <p className="lead">
              La herramienta definitiva para gestionar tu organización y visualizar relaciones entre colaboradores.
            </p>
            <p>
              MyParallelOrg te permite administrar usuarios, asignar roles y explorar redes colaborativas en 3D para optimizar el trabajo en equipo.
            </p>
            <p>
              <a className="btn btn-primary btn-lg" href="#" role="button">
                Aprende más »
              </a>
            </p>
          </div>
        </div>
        <div className="container">
          {/* Example row of columns */}
          <div className="row">
            <div className="col-md-4">
              <h2>Gestión de Usuarios</h2>
              <p>
                Administra de manera eficiente los usuarios de tu organización. Controla el acceso, asigna roles de administrador o usuario, y gestiona los permisos de cada miembro.
              </p>
              <p>
                <a className="btn btn-secondary" href="#" role="button">
                  Ver detalles »
                </a>
              </p>
            </div>
            <div className="col-md-4">
              <h2>Visualización de Redes</h2>
              <p>
                Visualiza las conexiones entre los miembros de tu organización en un grafo 3D. Identifica equipos de trabajo basados en tecnologías compartidas, ubicación geográfica y reputación.
              </p>
              <p>
                <a className="btn btn-secondary" href="#" role="button">
                  Ver detalles »
                </a>
              </p>
            </div>
            <div className="col-md-4">
              <h2>Despliegue con Docker</h2>
              <p>
                La infraestructura de MyParallelOrg está desplegada utilizando Docker, garantizando un entorno estable y reproducible para todos los componentes del sistema.
              </p>
              <p>
                <a className="btn btn-secondary" href="#" role="button">
                  Ver detalles »
                </a>
              </p>
            </div>
          </div>
          <hr />
        </div>{" "}
        {/* /container */}
      </main>
      <footer className="container text-center relative z-10">
        <p>© MyParallelOrg 2024</p>
      </footer>
    </div>
  );
}

export default Homepage;

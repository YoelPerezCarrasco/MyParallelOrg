import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './../styles/Homepage.css';

const Homepage: React.FC = () => {
  return (
    <div className="homepage-wrapper">
       <div className="overlay"></div>

      <main
        role="main"
        className="main-content d-flex flex-column justify-content-start align-items-center text-center pt-2"
      >
        <div className="container bg-transparent text-white mt-custom">
          <h1 className="display-3 mb-4">Bienvenido a MyParallelOrg</h1>
          <p className="lead mt-50">
            La herramienta definitiva para gestionar tu organización y visualizar relaciones entre colaboradores.
          </p>
          <p>
            MyParallelOrg te permite administrar usuarios, asignar roles y explorar redes colaborativas en 3D para optimizar el trabajo en equipo.
          </p>
          <p>
            <a className="btn btn-primary btn-lg mt-2" href="/login" role="button">
              Comenzar »
            </a>
          </p>
        </div>

        <div className="container mt-50">
          <div className="row">
            <div className="col-md-4">
              <h2 className="text-white">Gestión de Usuarios</h2>
              <p className="text-white">
                Administra de manera eficiente los usuarios de tu organización. Controla el acceso, asigna roles de administrador o usuario, y gestiona los permisos de cada miembro.
              </p>
            </div>
            <div className="col-md-4">
              <h2 className="text-white">Visualización de Redes</h2>
              <p className="text-white">
                Visualiza las conexiones entre los miembros de tu organización en un grafo 3D. Identifica equipos de trabajo basados en tecnologías compartidas, ubicación geográfica y reputación.
              </p>
              <p>
                <a className="btn btn-secondary" href="https://reagraph.dev/?path=/docs/docs-intro--docs" role="button">
                  Ver detalles »
                </a>
              </p>
            </div>
            <div className="col-md-4">
              <h2 className="text-white">Despliegue con Docker</h2>
              <p className="text-white">
                La infraestructura de MyParallelOrg está desplegada utilizando Docker, garantizando un entorno estable y reproducible para todos los componentes del sistema.
              </p>
              <p>
                <a className="btn btn-secondary" href="https://docutfg.readthedocs.io/en/latest/Backend.html#configuracion-de-docker" role="button">
                  Ver detalles »
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-light text-center text-lg-start">
        <div className="text-center p-4 footer-bg">
          © 2024 - Yoel Pérez Carrasco
        </div>
      </footer>
    </div>
  );
};

export default Homepage;

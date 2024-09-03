import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Homepage: React.FC = () => {
  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', backgroundColor: '#2c2c2c' }}>
      {/* RetroGrid Component as Background */}
      {/* Puedes añadir el componente RetroGrid aquí si es necesario */}

      <main role="main" className="relative z-10 d-flex flex-column justify-content-start align-items-center text-center h-100" style={{ paddingTop: '20px' }}>
        {/* Main jumbotron for a primary marketing message or call to action */}
        <div className="jumbotron bg-transparent text-white">
          <div className="container" style={{ marginTop: '100px' }}>
            <h1 className="display-3 mb-4" >Bienvenido a MyParallelOrg</h1>
            <p className="lead"  style={{ marginTop: '50px' }}>
              La herramienta definitiva para gestionar tu organización y visualizar relaciones entre colaboradores.
            </p>
            <p>
              MyParallelOrg te permite administrar usuarios, asignar roles y explorar redes colaborativas en 3D para optimizar el trabajo en equipo.
            </p>
            <p>
              <a className="btn btn-primary btn-lg" style={{ marginTop: '10px' }} href="/login" role="button">
                Comenzar »
              </a>
            </p>
          </div>
        </div>
        <div className="container" style={{ marginTop: '70px' }}>
          {/* Example row of columns */}
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
          <div
            className="text-center p-3"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
          >
            © 2024 - Yoel Pérez Carrasco
            
          </div>
        </footer>
    </div>
  );
}

export default Homepage;

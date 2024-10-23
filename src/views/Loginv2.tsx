import React, { useContext, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Loginpage: React.FC = () => {

  const { loginUser } = useContext(AuthContext)!;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (username.length > 0 && password.length > 0) {
      loginUser(username, password);
    }

    console.log(username);
    console.log(password);
  };

  return (
    <div>
      <>
        <section className="vh-100" style={{ backgroundColor: "gray" }}>
          <div className="container py-5 h-100">
            <div className="row d-flex justify-content-center align-items-center h-100">
              <div className="col col-xl-10">
                <div className="card" style={{ borderRadius: "1rem" }}>
                  <div className="row g-0">
                    <div className="col-md-6 col-lg-5 d-flex justify-content-center align-items-center">
                      <img
                        src={require('./../styles/pngwing.com.png')}
                        alt="login form"
                        className="img-fluid"
                        style={{ borderRadius: "1rem", maxWidth: "80%", maxHeight: "80%" }}
                      />
                    </div>
                    <div className="col-md-6 col-lg-7 d-flex align-items-center">
                      <div className="card-body p-4 p-lg-5 text-black">
                        <form onSubmit={handleSubmit}>
                          <div className="d-flex align-items-center mb-3 pb-1">
                            <i
                              className="fas fa-cubes fa-2x me-3"
                              style={{ color: "#ff6219" }}
                            />
                          </div>
                          <h5
                            className="fw-normal mb-3 pb-3"
                            style={{ letterSpacing: 1 }}
                          >
                            Inicia sesión en tu cuenta de empresa
                          </h5>
                          <div className="form-outline mb-4">
                            <input
                              type="username"
                              id="form2Example17"
                              className="form-control form-control-lg"
                              name="username"
                            />
                            <label className="form-label" htmlFor="form2Example17">
                              Usuario
                            </label>
                          </div>
                          <div className="form-outline mb-4">
                            <input
                              type="password"
                              id="form2Example27"
                              className="form-control form-control-lg"
                              name="password"
                            />
                            <label className="form-label" htmlFor="form2Example27">
                              Contraseña
                            </label>
                          </div>
                          <div className="pt-1 mb-4">
                            <button
                              className="btn btn-dark btn-lg btn-block"
                              type="submit"
                            >
                              Iniciar Sesión
                            </button>
                          </div>
                          <a className="small text-muted" href="#!">
                          </a>
                          <p className="mb-5 pb-lg-2" style={{ color: "#393f81" }}>
                            ¿Todavía no tienes cuenta?{" "}
                            <Link to="/register" style={{ color: "#393f81" }}>
                              Resgistrase 
                            </Link>
                          </p>
                          <a href="#!" className="small text-muted">
                            Terms of use.
                          </a>
                          <a href="#!" className="small text-muted">
                            Privacy policy
                          </a>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer className="bg-light text-center text-lg-start">
          <div
            className="text-center p-3"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
          >
            © 2024 - Yoel Pérez Carrasco
            
          </div>
        </footer>
      </>
    </div>
  );
};

export default Loginpage;

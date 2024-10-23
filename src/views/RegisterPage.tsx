import React, { useState, useContext, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Registerpage: React.FC = () => {
  const [rol, setRol] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [companyname, setCompanyName] = useState<string>('');



  const { registerUser } = useContext(AuthContext)!;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    registerUser(rol, username, password, companyname);
  };

  return (
    <div>
      <>
        <section className="vh-100" style={{ backgroundColor: 'GREY' }}>
          <div className="container py-5 h-100">
            <div className="row d-flex justify-content-center align-items-center h-100">
              <div className="col col-xl-10">
                <div className="card" style={{ borderRadius: '1rem' }}>
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
                              style={{ color: '#ff6219' }}
                            />
                          
                          </div>
                          <h5
                            className="h3 mb-3 pb-3"
                            style={{ letterSpacing: 1 }}
                          >
                            Registrarse
                          </h5>
                          <div className="form-outline mb-4">
                            <label htmlFor="roleSelect" className="form-label">Elige tu rol</label>
                            <select
                                id="roleSelect"
                                className="form-select form-select-lg"
                                onChange={(e) => setRol(e.target.value)}  // Asegúrate de tener un estado `role` para manejar este valor
                                >
                                <option value="" disabled selected>Rol</option>
                                <option value="worker">Worker</option>
                                <option value="manager">Manager</option>
                            </select>
                            </div>

                          <div className="form-outline mb-4">
                            <input
                              type="text"
                              id="form2Example17"
                              className="form-control form-control-lg"
                              placeholder="Usuario"
                              onChange={(e) => setUsername(e.target.value)}
                            />
                          </div>
                          <div className="form-outline mb-4">
                            <input
                              type="password"
                              id="form2Example17"
                              className="form-control form-control-lg"
                              placeholder="Contraseña"
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </div>
                          <div className="form-outline mb-4">
                            <input
                              type="text"
                              id="form2Example27"
                              className="form-control form-control-lg"
                              placeholder="Organización"
                              onChange={(e) => setCompanyName(e.target.value)}
                            />
                          </div>
                          <div className="pt-1 mb-4">
                            <button
                              className="btn btn-dark btn-lg btn-block"
                              type="submit"
                            >
                              Registrarse
                            </button>
                          </div>
                         
                          <p className="mb-5 pb-lg-2" style={{ color: '#393f81' }}>
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" style={{ color: '#393f81' }}>
                              Inciar Sesión
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

export default Registerpage;

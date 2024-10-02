import React, { useState, useContext, FormEvent } from 'react';
import AuthContext from '../../context/AuthContext';

const CreateUser: React.FC = () => {
  const [rol, setRol] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [companyname, setCompanyName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { registerUser } = useContext(AuthContext)!;

  const handleCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await registerUser(rol, username, password, companyname);
      setError(null);
    } catch (err) {
      setError('Failed to create user');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Crear Usuario Nuevo En El Sistema</h2>
      <form onSubmit={handleCreateUser}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Usuario</label>
          <input
            type="text"
            id="username"
            className="form-control"
            placeholder="Introducte usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Contraseña</label>
          <input
            type="password"
            id="password"
            className="form-control"
            placeholder="Introduce contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="companyname" className="form-label">Nombre de la Organización</label>
          <input
            type="text"
            id="companyname"
            className="form-control"
            placeholder="Introduce nombre de la empresa"
            value={companyname}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="rol" className="form-label">Rol</label>
          <select
            id="rol"
            className="form-select"
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            required
          >
            <option value="">Seleciona rol</option>
            <option value="manager">Manager</option>
            <option value="worker">Worker</option>
          </select>
        </div>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <button type="submit" className="btn btn-primary">Crear Usuario</button>
      </form>
    </div>
  );
};

export default CreateUser;

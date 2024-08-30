import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './../styles.css';  // Importa el archivo CSS

const databases = [
  { id: 'simple', name: 'Simple Nodes' },
  { id: 'parent', name: 'Parent Nodes' },
  { id: 'cluster', name: 'Cluster Nodes' },
  { id: 'icon', name: 'Icon Nodes' },
  { id: 'NoLabels', name: 'NoLabels' },
  { id: 'large', name: 'Large Dataset' }
];

const DataSelector: React.FC = () => {
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDb(event.target.value);
  };

  const handleContinue = () => {
    if (selectedDb) {
      navigate(`/graphs/${selectedDb}`);
    }
  };

  return (
    <div className="container">
      <h1>Selecciona La Empresa Con La Que Visualizar </h1>
      <select value={selectedDb || ''} onChange={handleSelection}>
        <option value="" disabled>Select a Dataset</option>
        {databases.map(db => (
          <option key={db.id} value={db.id}>{db.name}</option>
        ))}
      </select>
      <button onClick={handleContinue} disabled={!selectedDb}>Continue</button>
    </div>
  );
};

export default DataSelector;

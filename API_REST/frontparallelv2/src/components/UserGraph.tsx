import React, { useEffect, useState } from 'react';
import { GraphCanvas } from 'reagraph';

interface GraphNode {
  id: string;
  label?: string;
}

const UserGraph: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/user-connections')
      .then(response => response.json())
      .then(data => {
        // Aquí solo tomamos el id y el label de cada nodo
        const transformedNodes = data.nodes.map((node: any) => ({
          id: node.id,  // El id es necesario
          label: node.label || node.id,  // Usamos un label si existe, si no, el id
        }));

        setNodes(transformedNodes);
      })
      .catch(error => console.error('Error fetching the graph data:', error));
  }, []);

  return (
    <div>
      <GraphCanvas nodes={nodes} edges={[]} /> {/* Solo pasamos los nodos */}
    </div>
  );
};

export default UserGraph;

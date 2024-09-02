import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { GraphCanvas, GraphCanvasRef } from 'reagraph';

interface GraphNode {
  id: string;
  label?: string;
  icon?: string;
  github_url?: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

const UserGraph: React.FC = () => {
  const { organization } = useParams<{ organization: string }>();  // Obtén la organización de los parámetros de la URL
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [showHelp, setShowHelp] = useState(false); // Estado para controlar el pop-up de ayuda
  const graphRef = useRef<GraphCanvasRef | null>(null);

  

  useEffect(() => {
    // Usar la organización en la URL de la petición
    if (organization) {
      fetch(`http://localhost:8000/user-connections/${organization}`)
        .then(response => response.json())
        .then(data => {
          setNodes(data.nodes);
          setEdges(data.edges);
        })
        .catch(error => console.error('Error fetching the graph data:', error));
    }
  }, [organization]);  // Dependencia en la organización

  const handleNodeClick = (node: GraphNode) => {
    console.log('Node clicked:', node);
    window.open(node.github_url, '_blank');  // Abre el perfil de GitHub en una nueva pestaña
  };

  const toggleHelp = () => {
    setShowHelp(!showHelp); // Cambia la visibilidad del pop-up de ayuda
  };

  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      <div style={{
        zIndex: 9,
        position: 'absolute',
        top: 15,
        right: 15,
        background: 'rgba(0, 0, 0, .5)',
        padding: '10px',
        color: 'white',
        borderRadius: '5px'
      }}>
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.centerGraph()}>Centrar</button>
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.centerGraph([nodes[2]?.id])}>Centrar Nodo 2</button>
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.fitNodesInView()}>Ajustar Vista</button>
        <br />
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.zoomIn()}>Acercar</button>
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.zoomOut()}>Alejar</button>
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.dollyIn()}>Dolly In</button>
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.dollyOut()}>Dolly Out</button>
        <br />
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.panDown()}>Pan Abajo</button>
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.panUp()}>Pan Arriba</button>
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.panLeft()}>Pan Izquierda</button>
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={() => graphRef.current?.panRight()}>Pan Derecha</button>
        <br />
        <button style={{ display: 'block', width: '100%', marginBottom: '5px', backgroundColor: "black" }} onClick={toggleHelp}>Ayuda</button> {/* Botón de ayuda */}
      </div>
      <GraphCanvas
        cameraMode="rotate"
        ref={graphRef}
        nodes={nodes}
        edges={edges}
        layoutType="forceDirected3d"
        onNodeClick={handleNodeClick}  // Manejo de clics en nodos
      />

      {/* Pop-up de ayuda */}
      {showHelp && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 10,
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        }}>
        <h2>Ayuda</h2>
        <p>Esta visualización de gráficos te permite explorar de manera interactiva las conexiones entre usuarios de GitHub de la organización <strong>{organization}</strong>. Aquí te explicamos cómo navegar:</p>
        <ul>
            <li>Utiliza los botones de paneo para mover el gráfico horizontal o verticalmente.</li>
            <li>Acércate o aléjate usando los botones de zoom para explorar el gráfico con más detalle.</li>
            <li>Rota el gráfico en 3D para ver las conexiones desde diferentes ángulos.</li>
            <li>Si te pierdes, utiliza el botón 'Centrar' para regresar el gráfico a la vista predeterminada.</li>
            <li>También puedes enfocar un nodo específico seleccionando 'Centrar Nodo 2' u otra opción de nodo disponible.</li>
            <li>Haz clic en cualquier nodo para abrir el perfil de GitHub correspondiente en una nueva pestaña.</li>
        </ul>
        <p>¡Disfruta explorando el gráfico!</p>

          <button onClick={toggleHelp} style={{ backgroundColor: "black", color: "white", padding: '5px 10px', marginTop: '10px', borderRadius: '5px' }}>Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default UserGraph;

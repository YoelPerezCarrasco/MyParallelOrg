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
  const { organization } = useParams<{ organization: string }>();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const graphRef = useRef<GraphCanvasRef | null>(null);

  useEffect(() => {
    // Verificar que todas las aristas hacen referencia a nodos existentes
    const nodeIds = new Set(nodes.map(node => node.id));
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        console.error(`La arista con id ${edge.id} tiene un source inválido: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        console.error(`La arista con id ${edge.id} tiene un target inválido: ${edge.target}`);
      }
    }
  }, [nodes, edges]);
  

  useEffect(() => {
    if (organization) {
      fetch(`/api//users/user-connections/${organization}`)
        .then(response => response.json())
        .then(data => {
          setNodes(data.nodes);
          setEdges(data.edges);
        })
        .catch(error => console.error('Error fetching the graph data:', error));
    }
  }, [organization]);

  const handleNodeClick = (node: GraphNode) => {
    console.log('Node clicked:', node);
    window.open(node.github_url, '_blank');
  };

  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      
      {/* Título con el nombre del grupo/organización */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 999,
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        Organización: {organization}
      </div>

      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        {/* Botones de control */}
        <div style={{
          zIndex: 9,
          position: 'absolute',
          top: 100,
          right: 15,
          background: 'rgba(0, 0, 0, .7)',
          padding: '15px',
          color: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
        }}>
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => graphRef.current?.centerGraph()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Centrar
          </button>
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => graphRef.current?.fitNodesInView()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Ajustar Vista
          </button>
          <br />
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => graphRef.current?.zoomIn()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Acercar
          </button>
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => graphRef.current?.zoomOut()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Alejar
          </button>
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => graphRef.current?.dollyIn()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Acercar Poco
          </button>
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => graphRef.current?.dollyOut()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Alejar Poco
          </button>
          <br />
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => graphRef.current?.panDown()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Mover Subir
          </button>
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => graphRef.current?.panUp()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Mover Abajo
          </button>
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => graphRef.current?.panLeft()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Mover Derecha
          </button>
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => graphRef.current?.panRight()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Mover Izquierda
          </button>
          <br />
          <button style={{
            display: 'block',
            width: '100%',
            marginBottom: '10px',
            backgroundColor: "#212529",
            color: "white",
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onClick={toggleHelp}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#212529"}
          >
            Ayuda
          </button>
        </div>

        <GraphCanvas
          cameraMode="rotate"
          ref={graphRef}
          nodes={nodes}
          edges={edges}
          layoutType="forceDirected3d"
          onNodeClick={handleNodeClick}
        />

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
            <p>Esta visualización de gráficos te permite explorar las conexiones entre usuarios de GitHub de la organización <strong>{organization}</strong>. Aquí te explicamos cómo navegar:</p>
            <ul>
              <li>Utiliza los botones de paneo para mover el gráfico horizontal o verticalmente.</li>
              <li>Acércate o aléjate usando los botones de zoom para explorar el gráfico con más detalle.</li>
              <li>Rota el gráfico en 3D para ver las conexiones desde diferentes ángulos.</li>
              <li>Si te pierdes, utiliza el botón 'Centrar' para regresar el gráfico a la vista predeterminada.</li>
              <li>Haz clic en cualquier nodo para abrir el perfil de GitHub correspondiente en una nueva pestaña.</li>
            </ul>
            <p>¡Disfruta explorando el gráfico!</p>

            <button onClick={toggleHelp} style={{ backgroundColor: "black", color: "white", padding: '5px 10px', marginTop: '10px', borderRadius: '5px' }}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserGraph;

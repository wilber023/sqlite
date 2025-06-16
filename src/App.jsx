import { useState } from "react";
import "./App.css";

export default function App() {
  const [dbName, setDbName] = useState("nombre_base_de_datos.db");
  const [sqlCommand, setSqlCommand] = useState(`CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  activo INTEGER DEFAULT 1
);`);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      dbName,
      sql: sqlCommand,
    };

    try {
      const res = await fetch("http://localhost:8080/execute-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Error ejecutando SQL:", error);
      setResult({
        success: false,
        message: "Error de conexión con el servidor.",
      });
    }
  };

  return (
    <div className="App">

    
    <div className="container">
      <h1>Crear Base de Datos SQLite</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <label>Nombre de la base de datos:</label>
          <input
            type="text"
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
            required
          />

          <label>Comando SQL:</label>
          <textarea
            rows="10"
            value={sqlCommand}
            onChange={(e) => setSqlCommand(e.target.value)}
            required
          />

          <button type="submit">Ejecutar SQL</button>
        </div>
      </form>
    </div>
     {result && (
        <div className="result-section">
          {result.success && (
            <div className="success">
              ✅ Comando ejecutado correctamente en `{dbName}`
            </div>
          )}
      {!result.success && (
  <div className="error">
    ❌ Error al ejecutar SQL:
    <br />
    <code>{result.message}</code>
  </div>
)}


          <div className="analysis">
            <h2>Análisis Léxico</h2>
            <ul>
              {result.lexical?.map((token, idx) => (
                <li key={idx}>
                  <strong>{token.value}</strong> — {token.type}
                </li>
              ))}
            </ul>

            <h2>Análisis Sintáctico</h2>
            <p>{result.syntactic || "No disponible"}</p>

            <h2>Análisis Semántico</h2>
            <p>{result.semantic || "No disponible"}</p>
          </div>
        </div>
      )}  
     </div>
  );
}

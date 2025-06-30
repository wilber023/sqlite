import React, { useState,useRef  } from 'react';
import { formatSQLText, getAutocompleteSuggestions } from './sqlConstants';

import './App.css';

export default function App() {
  const [formData, setFormData] = useState({
    createDB: '',
    useDB: '',
    createTable: '',
    insertData: '',
    modifyData: '',
    deleteDB: ''
  });

  const [lexicalResults, setLexicalResults] = useState([]);
  const [syntacticResults, setSyntacticResults] = useState(null);
  const [databaseInfo, setDatabaseInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
 const [suggestions, setSuggestions] = useState({});
const [activeSuggestion, setActiveSuggestion] = useState({});
const [showSuggestions, setShowSuggestions] = useState({});
const inputRefs = useRef({});
const handleCustomInputChange = (e) => {
  const { name, value } = e.target;
  
  // Formatear el texto (convertir comandos SQL a mayúsculas)
  const formattedValue = formatSQLText(value);
  
  // Crear evento sintético con el valor formattado
  const syntheticEvent = {
    target: {
      name,
      value: formattedValue
    }
  };
  
  // Llamar al manejador original
  handleInputChange(syntheticEvent);
  
  // Obtener sugerencias de autocompletado
  const newSuggestions = getAutocompleteSuggestions(name, value);
  setSuggestions(prev => ({
    ...prev,
    [name]: newSuggestions
  }));
  
  // Mostrar sugerencias si hay texto y sugerencias disponibles
  setShowSuggestions(prev => ({
    ...prev,
    [name]: value.length > 0 && newSuggestions.length > 0
  }));
  
  // Resetear sugerencia activa
  setActiveSuggestion(prev => ({
    ...prev,
    [name]: 0
  }));
};

const handleKeyDown = (e, fieldName) => {
  const fieldSuggestions = suggestions[fieldName] || [];
  const isShowingSuggestions = showSuggestions[fieldName];
  
  if (!isShowingSuggestions || fieldSuggestions.length === 0) return;
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setActiveSuggestion(prev => ({
        ...prev,
        [fieldName]: Math.min((prev[fieldName] || 0) + 1, fieldSuggestions.length - 1)
      }));
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      setActiveSuggestion(prev => ({
        ...prev,
        [fieldName]: Math.max((prev[fieldName] || 0) - 1, 0)
      }));
      break;
      
    case 'Enter':
      e.preventDefault();
      const selectedSuggestion = fieldSuggestions[activeSuggestion[fieldName] || 0];
      if (selectedSuggestion) {
        applySuggestion(fieldName, selectedSuggestion);
      }
      break;
      
    case 'Escape':
      setShowSuggestions(prev => ({
        ...prev,
        [fieldName]: false
      }));
      break;
  }
};

const applySuggestion = (fieldName, suggestion) => {
  const syntheticEvent = {
    target: {
      name: fieldName,
      value: suggestion + ' '
    }
  };
  
  handleInputChange(syntheticEvent);
  
  setShowSuggestions(prev => ({
    ...prev,
    [fieldName]: false
  }));
  
  if (inputRefs.current[fieldName]) {
    inputRefs.current[fieldName].focus();
  }
};

const handleBlur = (fieldName) => {
  setTimeout(() => {
    setShowSuggestions(prev => ({
      ...prev,
      [fieldName]: false
    }));
  }, 150);//http://localhost:8080/api
}; 
  const API_BASE_URL = 'https://compiladores-f15k.onrender.com/api'; // Cambia esto a tu URL de API

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showMessage = (msg = false ) => {
    setMessage(msg );
    setTimeout(() => setMessage(''), 5000);
  };

  const executeQuery = async (endpoint, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        showMessage(result.message);
        return result.data;
      } else {
        // Si es error de tabla/BD existente, solo mostrar warning
        const isExistsError = result.message && (
          result.message.includes('ya existe') || 
          result.message.includes('already exists')
        );
        
        if (isExistsError) {
          showMessage(`Advertencia: ${result.message}`, false);
          return 'exists';
        } else {
          showMessage(result.message, true);
          return null;
        }
      }
    } catch (error) {
      showMessage(`Error de conexión: ${error.message}`, true);
      return null;
    }
  };

  // ANÁLISIS LÉXICO - Solo muestra tokens, NO ejecuta comandos
  const handleLexicalAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/lexical-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        setLexicalResults(result.data);
        showMessage('Análisis léxico completado');
        // NO ejecutar comandos aquí - solo mostrar tokens
      } else {
        showMessage(result.message, true);
      }
    } catch (error) {
      showMessage(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  // ANÁLISIS SINTÁCTICO - Analiza sintaxis Y ejecuta comandos de BD
  const handleSyntacticAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/syntactic-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        setSyntacticResults(result.data);
        showMessage('Análisis sintáctico completado');
        
        // AHORA SÍ ejecutar comandos después del análisis sintáctico
        await executeCommands();
      } else {
        // Mostrar error específico del análisis sintáctico
        setSyntacticResults(result.data || result.errors || result.message);
        showMessage(`Error en análisis sintáctico: ${result.message}`, true);
        console.error('Detalles del error sintáctico:', result);
      }
    } catch (error) {
      showMessage(`Error: ${error.message}`, true);
      console.error('Error de conexión:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeCommands = async () => {
    // NOTA: No ejecutar CREATE DATABASE aquí porque ya se ejecutó en el análisis sintáctico
    // Solo ejecutar USE DATABASE para conectar a la BD ya creada
    
    // Usar base de datos
    if (formData.useDB) {
      const dbName = extractDatabaseName(formData.useDB);
      if (dbName) {
        await executeQuery('/use-database', { database: dbName });
        await loadDatabaseInfo();
      }
    }

    // Crear tabla (solo si no existe)
    if (formData.createTable) {
      const result = await executeQuery('/create-table', { query: formData.createTable });
      if (result !== null) {
        await loadDatabaseInfo();
      }
    }

    // Insertar datos
    if (formData.insertData) {
      await executeQuery('/insert-data', { query: formData.insertData });
      await loadDatabaseInfo();
    }

    // Modificar datos
    if (formData.modifyData) {
      await executeQuery('/modify-data', { query: formData.modifyData });
      await loadDatabaseInfo();
    }
  };

  const handleDeleteDatabase = async () => {
    if (!formData.deleteDB) {
      showMessage('Ingresa el nombre de la base de datos a eliminar', true);
      return;
    }

    const dbName = extractDatabaseName(formData.deleteDB);
    if (dbName) {
      const data = await executeQuery('/delete-database', { database: dbName });
      if (data) {
        setDatabaseInfo(null);
        setFormData(prev => ({ ...prev, deleteDB: '' }));
      }
    }
  };

  const loadDatabaseInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/database-info`);
      const result = await response.json();
      
      if (result.success) {
        setDatabaseInfo(result.data);
      }
    } catch (error) {
      console.error('Error al cargar información de la base de datos:', error);
    }
  };

  const extractDatabaseName = (command) => {
    if (!command) return null;
    
    const words = command.trim().split(/\s+/);
    console.log('Parsing command:', command, 'Words:', words);
    
    // Para "CREATE DATABASE nombre" o "USE DATABASE nombre" o "DROP DATABASE nombre"
    if (words.length >= 3 && words[1].toUpperCase() === 'DATABASE') {
      const dbName = words[2];
      console.log('Extracted DB name:', dbName);
      return dbName;
    }
    
    // Si no sigue el patrón esperado, tomar la última palabra como fallback
    const fallback = words[words.length - 1];
    console.log('Using fallback DB name:', fallback);
    return fallback;
  };

  const renderTokens = (tokens, title) => (
    <div className="token-section">
      <h4>{title}</h4>
      <div className="tokens-container">
        {tokens.map((token, index) => (
          <span 
            key={index} 
            className={`token token-${token.type.toLowerCase()}`}
          >
            {token.value} <small>({token.type})</small>
          </span>
        ))}
      </div>
    </div>
  );

  const renderTableData = (table) => (
    <div key={table.name} className="table-info">
      <h4>Tabla: {table.name}</h4>
      <div className="columns-info">
        <h5>Columnas:</h5>
        <ul>
          {table.columns.map((col, index) => (
            <li key={index}>{col.name} ({col.type})</li>
          ))}
        </ul>
      </div>
      {table.data && table.data.length > 0 && (
        <div className="table-data">
          <h5>Datos:</h5>
          <table>
            <thead>
              <tr>
                {table.columns.map((col, index) => (
                  <th key={index}>{col.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {table.columns.map((col, colIndex) => (
                    <td key={colIndex}>{row[col.name]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="App">
      <h1>SQLite Example</h1>
      <p>Analizador léxico y sintáctico con base de datos SQLite</p>
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      <section className='form-section'>
        <div className="input-group relative">
  <input 
    ref={el => inputRefs.current['createDB'] = el}
    type="text" 
    name="createDB"
    value={formData.createDB}
    onChange={handleCustomInputChange}
    onKeyDown={(e) => handleKeyDown(e, 'createDB')}
    onBlur={() => handleBlur('createDB')}
    placeholder="CREATE DATABASE nombre_bd"
    autoComplete="off"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  {showSuggestions['createDB'] && suggestions['createDB'] && suggestions['createDB'].length > 0 && (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 max-h-40 overflow-y-auto z-50 shadow-lg rounded-b-md">
      {suggestions['createDB'].map((suggestion, index) => (
        <div
          key={index}
          className={`px-3 py-2 cursor-pointer border-b border-gray-100 text-sm font-mono transition-colors duration-150 ${
            index === (activeSuggestion['createDB'] || 0) 
              ? 'bg-blue-100 text-blue-900 border-blue-200' 
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => applySuggestion('createDB', suggestion)}
          onMouseEnter={() => setActiveSuggestion(prev => ({ ...prev, ['createDB']: index }))}
        >
          {suggestion}
        </div>
      ))}
    </div>
  )}
  <small className="text-gray-600 text-xs">Ejemplo: CREATE DATABASE mi_empresa</small>
</div>

<div className="input-group relative">
  <input 
    ref={el => inputRefs.current['useDB'] = el}
    type="text" 
    name="useDB"
    value={formData.useDB}
    onChange={handleCustomInputChange}
    onKeyDown={(e) => handleKeyDown(e, 'useDB')}
    onBlur={() => handleBlur('useDB')}
    placeholder="USE DATABASE nombre_bd"
    autoComplete="off"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  {showSuggestions['useDB'] && suggestions['useDB'] && suggestions['useDB'].length > 0 && (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 max-h-40 overflow-y-auto z-50 shadow-lg rounded-b-md">
      {suggestions['useDB'].map((suggestion, index) => (
        <div
          key={index}
          className={`px-3 py-2 cursor-pointer border-b border-gray-100 text-sm font-mono transition-colors duration-150 ${
            index === (activeSuggestion['useDB'] || 0) 
              ? 'bg-green-100 text-green-900 border-green-200' 
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => applySuggestion('useDB', suggestion)}
          onMouseEnter={() => setActiveSuggestion(prev => ({ ...prev, ['useDB']: index }))}
        >
          {suggestion}
        </div>
      ))}
    </div>
  )}
  <small className="text-gray-600 text-xs">Ejemplo: USE DATABASE mi_empresa</small>
</div>

<div className="input-group relative">
  <input 
    ref={el => inputRefs.current['createTable'] = el}
    type="text" 
    name="createTable"
    value={formData.createTable}
    onChange={handleCustomInputChange}
    onKeyDown={(e) => handleKeyDown(e, 'createTable')}
    onBlur={() => handleBlur('createTable')}
    placeholder="CREATE TABLE nombre (campo TIPO)"
    autoComplete="off"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  {showSuggestions['createTable'] && suggestions['createTable'] && suggestions['createTable'].length > 0 && (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 max-h-40 overflow-y-auto z-50 shadow-lg rounded-b-md">
      {suggestions['createTable'].map((suggestion, index) => (
        <div
          key={index}
          className={`px-3 py-2 cursor-pointer border-b border-gray-100 text-sm font-mono transition-colors duration-150 ${
            index === (activeSuggestion['createTable'] || 0) 
              ? 'bg-purple-100 text-purple-900 border-purple-200' 
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => applySuggestion('createTable', suggestion)}
          onMouseEnter={() => setActiveSuggestion(prev => ({ ...prev, ['createTable']: index }))}
        >
          {suggestion}
        </div>
      ))}
    </div>
  )}
  <small className="text-gray-600 text-xs">Ejemplo: CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nombre TEXT)</small>
</div>

<div className="input-group relative">
  <input 
    ref={el => inputRefs.current['insertData'] = el}
    type="text" 
    name="insertData"
    value={formData.insertData}
    onChange={handleCustomInputChange}
    onKeyDown={(e) => handleKeyDown(e, 'insertData')}
    onBlur={() => handleBlur('insertData')}
    placeholder="INSERT INTO tabla VALUES (...)"
    autoComplete="off"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  {showSuggestions['insertData'] && suggestions['insertData'] && suggestions['insertData'].length > 0 && (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 max-h-40 overflow-y-auto z-50 shadow-lg rounded-b-md">
      {suggestions['insertData'].map((suggestion, index) => (
        <div
          key={index}
          className={`px-3 py-2 cursor-pointer border-b border-gray-100 text-sm font-mono transition-colors duration-150 ${
            index === (activeSuggestion['insertData'] || 0) 
              ? 'bg-yellow-100 text-yellow-900 border-yellow-200' 
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => applySuggestion('insertData', suggestion)}
          onMouseEnter={() => setActiveSuggestion(prev => ({ ...prev, ['insertData']: index }))}
        >
          {suggestion}
        </div>
      ))}
    </div>
  )}
  <small className="text-gray-600 text-xs">Ejemplo: INSERT INTO usuarios (nombre) VALUES ('Juan')</small>
</div>

<div className="input-group relative">
  <input 
    ref={el => inputRefs.current['modifyData'] = el}
    type="text" 
    name="modifyData"
    value={formData.modifyData}
    onChange={handleCustomInputChange}
    onKeyDown={(e) => handleKeyDown(e, 'modifyData')}
    onBlur={() => handleBlur('modifyData')}
    placeholder="UPDATE/DELETE comandos"
    autoComplete="off"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  {showSuggestions['modifyData'] && suggestions['modifyData'] && suggestions['modifyData'].length > 0 && (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 max-h-40 overflow-y-auto z-50 shadow-lg rounded-b-md">
      {suggestions['modifyData'].map((suggestion, index) => (
        <div
          key={index}
          className={`px-3 py-2 cursor-pointer border-b border-gray-100 text-sm font-mono transition-colors duration-150 ${
            index === (activeSuggestion['modifyData'] || 0) 
              ? 'bg-orange-100 text-orange-900 border-orange-200' 
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => applySuggestion('modifyData', suggestion)}
          onMouseEnter={() => setActiveSuggestion(prev => ({ ...prev, ['modifyData']: index }))}
        >
          {suggestion}
        </div>
      ))}
    </div>
  )}
  <small className="text-gray-600 text-xs">Ejemplo: UPDATE usuarios SET nombre='Pedro' WHERE id=1</small>
</div>

<div className="input-group delete-section relative">
  <input 
    ref={el => inputRefs.current['deleteDB'] = el}
    type="text" 
    name="deleteDB"
    value={formData.deleteDB}
    onChange={handleCustomInputChange}
    onKeyDown={(e) => handleKeyDown(e, 'deleteDB')}
    onBlur={() => handleBlur('deleteDB')}
    placeholder="DROP DATABASE nombre_bd"
    autoComplete="off"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
  />
  {showSuggestions['deleteDB'] && suggestions['deleteDB'] && suggestions['deleteDB'].length > 0 && (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 max-h-40 overflow-y-auto z-50 shadow-lg rounded-b-md">
      {suggestions['deleteDB'].map((suggestion, index) => (
        <div
          key={index}
          className={`px-3 py-2 cursor-pointer border-b border-gray-100 text-sm font-mono transition-colors duration-150 ${
            index === (activeSuggestion['deleteDB'] || 0) 
              ? 'bg-red-100 text-red-900 border-red-200' 
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => applySuggestion('deleteDB', suggestion)}
          onMouseEnter={() => setActiveSuggestion(prev => ({ ...prev, ['deleteDB']: index }))}
        >
          {suggestion}
        </div>
      ))}
    </div>
  )}
  <button 
  style={{ marginTop: '10px', backgroundColor: '#f87171', color: '#fff', height: '40px', width: '100%',  }}
    onClick={handleDeleteDatabase}
     disabled={loading}
  >
    Eliminar Base de Datos
  </button>
  <small className="text-gray-600 text-xs">Ejemplo: DROP DATABASE mi_empresa</small>
</div>

        <div className='buttons'>
          <button 
            onClick={handleLexicalAnalysis}
            disabled={loading}
          >
            {loading ? 'Analizando...' : 'Análisis Léxico (Solo Tokens)'}
          </button>
          <button 
            onClick={handleSyntacticAnalysis}
            disabled={loading}
          >
            {loading ? 'Analizando...' : 'Análisis Sintáctico + Ejecutar BD'}
          </button>
        </div>
      </section>

      <section className="results-section">
        <h2>Resultados del análisis léxico</h2>
        {lexicalResults.length > 0 ? (
          <div className="analysis-results">
            {lexicalResults.map((result, index) => (
              <div key={index} className="statement-analysis">
                <h3>{result.statement}</h3>
                {renderTokens(result.tokens, "Todos los tokens")}
                {renderTokens(result.keywords, "Palabras reservadas")}
              </div>
            ))}
          </div>
        ) : (
          <p>Los resultados del análisis léxico se mostrarán aquí.</p>
        )}

        {syntacticResults && (
          <div className="syntactic-results">
            <h3>Análisis Sintáctico</h3>
            {typeof syntacticResults === 'string' ? (
              <div className="error-message">
                <p>{syntacticResults}</p>
              </div>
            ) : (
              <pre>{JSON.stringify(syntacticResults, null, 2)}</pre>
            )}
          </div>
        )}
      </section>

      <section className="database-section">
        <h2>Base de datos creada</h2>
        {databaseInfo ? (
          <div className="database-info">
            <h3>Base de datos: {databaseInfo.name}</h3>
            {databaseInfo.tables && databaseInfo.tables.length > 0 ? (
              <div className="tables-container">
                {databaseInfo.tables.map(renderTableData)}
              </div>
            ) : (
              <p>No hay tablas en esta base de datos.</p>
            )}
          </div>
        ) : (
          <div>
            <p>Aquí se mostrará la base de datos creada junto con los campos que contenga la base de datos</p>
          </div>
        )}
      </section>
    </div>
  );
}
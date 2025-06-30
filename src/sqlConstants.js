// sqlConstants.js - Constantes y funciones para autocompletado SQL

// Comandos SQL disponibles para autocompletado
export const SQL_COMMANDS = {
  createDB: [
    'CREATE DATABASE',
    'CREATE DATABASE IF NOT EXISTS',
    'CREATE SCHEMA',
    'CREATE SCHEMA IF NOT EXISTS'
  ],
  useDB: [
    'USE DATABASE',
    'USE SCHEMA',
    'USE',
    'CONNECT TO'
  ],
  createTable: [
    'CREATE TABLE',
    'CREATE TABLE IF NOT EXISTS',
    'CREATE TEMPORARY TABLE',
    'CREATE TEMP TABLE'
  ],
  insertData: [
    'INSERT INTO',
    'INSERT OR REPLACE INTO',
    'INSERT OR IGNORE INTO',
    'REPLACE INTO'
  ],
  modifyData: [
    'UPDATE',
    'DELETE FROM',
    'DELETE',
    'MERGE INTO',
    'UPSERT'
  ],
  deleteDB: [
    'DROP DATABASE',
    'DROP DATABASE IF EXISTS',
    'DROP SCHEMA',
    'DROP SCHEMA IF EXISTS'
  ]
};

// Tipos de datos comunes para autocompletado
export const DATA_TYPES = [
  'INTEGER',
  'TEXT',
  'VARCHAR',
  'CHAR',
  'BOOLEAN',
  'DATETIME',
  'DATE',
  'TIME',
  'DECIMAL',
  'FLOAT',
  'DOUBLE',
  'BLOB',
  'REAL'
];

// Palabras clave adicionales
export const SQL_KEYWORDS = [
  'PRIMARY KEY',
  'FOREIGN KEY',
  'NOT NULL',
  'UNIQUE',
  'DEFAULT',
  'AUTO_INCREMENT',
  'REFERENCES',
  'ON DELETE CASCADE',
  'ON UPDATE CASCADE',
  'WHERE',
  'ORDER BY',
  'GROUP BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'JOIN',
  'INNER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL JOIN',
  'UNION',
  'SELECT',
  'FROM',
  'AS',
  'DISTINCT',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX'
];

// Función para convertir texto a mayúsculas (comandos SQL)
export const formatSQLText = (text) => {
  const words = text.split(' ');
  const formattedWords = words.map(word => {
    // Lista de palabras que deben estar en mayúsculas
    const sqlKeywords = [
      ...Object.values(SQL_COMMANDS).flat(),
      ...DATA_TYPES,
      ...SQL_KEYWORDS
    ].map(keyword => keyword.toLowerCase());
    
    const lowerWord = word.toLowerCase();
    
    // Si la palabra es un comando SQL, convertirla a mayúsculas
    if (sqlKeywords.some(keyword => keyword.includes(lowerWord) || lowerWord.includes(keyword))) {
      return word.toUpperCase();
    }
    
    // Si es una palabra común de SQL, también a mayúsculas
    const commonSQLWords = ['create', 'database', 'table', 'insert', 'into', 'values', 'update', 'delete', 'from', 'where', 'set', 'drop', 'use', 'select'];
    if (commonSQLWords.includes(lowerWord)) {
      return word.toUpperCase();
    }
    
    return word; // Mantener nombres de tablas, campos y valores en su formato original
  });
  
  return formattedWords.join(' ');
};

// Función para obtener sugerencias de autocompletado
export const getAutocompleteSuggestions = (fieldName, currentValue) => {
  const commands = SQL_COMMANDS[fieldName] || [];
  const allSuggestions = [...commands, ...DATA_TYPES, ...SQL_KEYWORDS];
  
  if (!currentValue.trim()) {
    return commands; // Mostrar comandos principales si el campo está vacío
  }
  
  const upperValue = currentValue.toUpperCase();
  
  // Filtrar sugerencias que coincidan con el texto actual
  return allSuggestions.filter(suggestion => 
    suggestion.toUpperCase().startsWith(upperValue) || 
    suggestion.toUpperCase().includes(upperValue)
  ).slice(0, 5); // Limitar a 5 sugerencias
};
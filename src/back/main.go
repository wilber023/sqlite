package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	 
	"regexp"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

type SQLRequest struct {
	DBName string `json:"dbName"`
	SQL    string `json:"sql"`
}

type Token struct {
	Value string `json:"value"`
	Type  string `json:"type"`
}

type SQLResponse struct {
	Success   bool    `json:"success"`
	Message   string  `json:"message"`
	Lexical   []Token `json:"lexical"`
	Syntactic string  `json:"syntactic"`
	Semantic  string  `json:"semantic"`
}

func main() {
	http.HandleFunc("/execute-sql", handleSQLExecution)
	fmt.Println("🚀 API escuchando en http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleSQLExecution(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}

	var req SQLRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Error al leer el JSON", http.StatusBadRequest)
		return
	}

	// Ejecutar SQL
	response := SQLResponse{}
	lexical := lexicalAnalysis(req.SQL)
	response.Lexical = lexical

	syntaxValid := validateSyntax(req.SQL)
	if syntaxValid {
		response.Syntactic = "Sintaxis válida."
	} else {
		response.Syntactic = "Error de sintaxis detectado."
		response.Success = false
		response.Message = "Sintaxis inválida."
		writeJSON(w, response)
		return
	}

	if !strings.HasSuffix(req.DBName, ".db") {
		req.DBName += ".db"
	}

	db, err := sql.Open("sqlite3", req.DBName)
	if err != nil {
		response.Success = false
		response.Message = "Error al abrir la base de datos: " + err.Error()
		writeJSON(w, response)
		return
	}
	defer db.Close()

	_, err = db.Exec(req.SQL)
	if err != nil {
		response.Success = false
		response.Message = "Error ejecutando SQL: " + err.Error()
		writeJSON(w, response)
		return
	}

	response.Success = true
	response.Message = "Comando ejecutado correctamente."
	response.Semantic = "El comando fue semánticamente correcto en contexto SQLite."

	writeJSON(w, response)
}

func writeJSON(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}

func lexicalAnalysis(sql string) []Token {
	reservedWords := map[string]bool{
		"CREATE": true, "TABLE": true, "PRIMARY": true, "KEY": true,
		"INTEGER": true, "TEXT": true, "AUTOINCREMENT": true, "NOT": true,
		"NULL": true, "UNIQUE": true, "DEFAULT": true, "CURRENT_TIMESTAMP": true,
	}

	// Extraer tokens simples (palabras y signos de puntuación)
	re := regexp.MustCompile(`[a-zA-Z_][a-zA-Z0-9_]*|\(|\)|,|;`)
	matches := re.FindAllString(sql, -1)

	var tokens []Token
	for _, word := range matches {
		upper := strings.ToUpper(word)
		tokType := "IDENTIFICADOR"
		if reservedWords[upper] {
			tokType = "PALABRA_RESERVADA"
		} else if word == "(" || word == ")" || word == "," || word == ";" {
			tokType = "SIMBOLO"
		}
		tokens = append(tokens, Token{Value: word, Type: tokType})
	}

	return tokens
}

func validateSyntax(sql string) bool {
	// Validación mínima: comienza con CREATE TABLE
	sql = strings.TrimSpace(strings.ToUpper(sql))
	return strings.HasPrefix(sql, "CREATE TABLE")
}

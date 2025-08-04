package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

var db *sql.DB
var jwtKey = []byte("my_secret_key")

type User struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Mobile  string `json:"mobile"`
	Address string `json:"address"`
	Age     int    `json:"age"`
}

type AuthUser struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"`
	Role     string `json:"role"`
}

type Claims struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	var err error
	// db, err = sql.Open("mysql", "root:root@tcp(127.0.0.1:3306)/gotestdb")
	db, err = sql.Open("mysql", "root:root@tcp(127.0.0.1:3306)/gotestdb?charset=utf8mb4&parseTime=True&loc=Local")

	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connected to MySQL database!")

	createUsersTable()
	createAuthUserTable()
	createBlacklistTable()

	r := mux.NewRouter()

	// ✅ Authentication Routes
	r.HandleFunc("/register", registerHandler).Methods("POST")
	r.HandleFunc("/login", loginHandler).Methods("POST")
	r.Handle("/logout", authMiddleware(http.HandlerFunc(logoutHandler))).Methods("POST")
	r.Handle("/profile", authMiddleware(http.HandlerFunc(profileHandler))).Methods("GET")
	r.Handle("/account/update", authMiddleware(http.HandlerFunc(updateAccountHandler))).Methods("PUT")
	r.Handle("/account/delete", authMiddleware(http.HandlerFunc(deleteAccountHandler))).Methods("DELETE")

	// ✅ User CRUD Routes
	r.Handle("/users", authMiddleware(http.HandlerFunc(createUserHandler))).Methods("POST")
	r.Handle("/all_users", authMiddleware(http.HandlerFunc(getAllUsersHandler))).Methods("GET")
	r.Handle("/users/{id}", authMiddleware(http.HandlerFunc(getUserHandler))).Methods("GET")
	r.Handle("/users/{id}", authMiddleware(http.HandlerFunc(updateUserHandler))).Methods("PUT")
	r.Handle("/users/{id}", authMiddleware(http.HandlerFunc(deleteUserHandler))).Methods("DELETE")


	// ✅ Allow OPTIONS for all routes to fix preflight CORS
	r.PathPrefix("/").Methods("OPTIONS").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.WriteHeader(http.StatusOK)
	})

	// ✅ Start server with CORS middleware
	fmt.Println("Server running at http://localhost:5000")
	log.Fatal(http.ListenAndServe(":5000", corsMiddleware(r)))
}

func createUsersTable() {
	query := `CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(50),
		email VARCHAR(50),
		mobile VARCHAR(15),
		address VARCHAR(100),
		age INT)`
	db.Exec(query)
}

func createAuthUserTable() {
	query := `CREATE TABLE IF NOT EXISTS auth_users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(50) UNIQUE,
		email VARCHAR(100) UNIQUE,
		password VARCHAR(255),
		role ENUM('admin','user') DEFAULT 'user',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
	db.Exec(query)
}

func createBlacklistTable() {
	query := `CREATE TABLE IF NOT EXISTS token_blacklist (
		id INT AUTO_INCREMENT PRIMARY KEY,
		token TEXT NOT NULL,
		blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
	db.Exec(query)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	var user AuthUser
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	result, err := db.Exec(`INSERT INTO auth_users (username,email,password,role) VALUES (?, ?, ?, ?)`,
		user.Username, user.Email, string(hash), user.Role)
	if err != nil {
		http.Error(w, "User exists or error", http.StatusConflict)
		return
	}
	user.ID, _ = result.LastInsertId()
	user.Password = ""
	json.NewEncoder(w).Encode(user)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var input AuthUser
	json.NewDecoder(r.Body).Decode(&input)

	var user AuthUser
	var hash string
	err := db.QueryRow(`SELECT id, username, email, password, role FROM auth_users WHERE email = ?`,
		input.Email).Scan(&user.ID, &user.Username, &user.Email, &hash, &user.Role)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(input.Password)) != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	exp := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	}
	token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(jwtKey)

	http.SetCookie(w, &http.Cookie{Name: "token", Value: token, Expires: exp, HttpOnly: true})
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	auth := r.Header.Get("Authorization")
	if !strings.HasPrefix(auth, "Bearer ") {
		http.Error(w, "No token", http.StatusBadRequest)
		return
	}
	token := strings.TrimPrefix(auth, "Bearer ")
	_, err := db.Exec("INSERT INTO token_blacklist (token) VALUES (?)", token)
	if err != nil {
		http.Error(w, "Logout error", http.StatusInternalServerError)
		return
	}
	w.Write([]byte(`{"message":"Logged out"}`))
}

func isTokenBlacklisted(token string) bool {
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM token_blacklist WHERE token = ?)", token).Scan(&exists)
	return err == nil && exists
}

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(auth, "Bearer ")

		if isTokenBlacklisted(tokenStr) {
			http.Error(w, "Token invalidated", http.StatusUnauthorized)
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "claims", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func profileHandler(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*Claims)
	var user AuthUser
	err := db.QueryRow("SELECT id, username, email, role FROM auth_users WHERE id = ?", claims.UserID).
		Scan(&user.ID, &user.Username, &user.Email, &user.Role)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(user)
}

func updateAccountHandler(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*Claims)
	var input AuthUser
	json.NewDecoder(r.Body).Decode(&input)
	_, err := db.Exec("UPDATE auth_users SET username = ?, email = ?, role = ? WHERE id = ?",
		input.Username, input.Email, input.Role, claims.UserID)
	if err != nil {
		http.Error(w, "Update error", http.StatusInternalServerError)
		return
	}
	w.Write([]byte(`{"message":"Account updated successfully"}`))
}

func deleteAccountHandler(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*Claims)
	_, err := db.Exec("DELETE FROM auth_users WHERE id = ?", claims.UserID)
	if err != nil {
		http.Error(w, "Delete error", http.StatusInternalServerError)
		return
	}
	w.Write([]byte(`{"message":"Account deleted successfully"}`))
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	json.NewDecoder(r.Body).Decode(&user)
	result, err := db.Exec("INSERT INTO users (name,email,mobile,address,age) VALUES (?, ?, ?, ?, ?)",
		user.Name, user.Email, user.Mobile, user.Address, user.Age)
	if err != nil {
		http.Error(w, "Insert failed", http.StatusInternalServerError)
		return
	}
	user.ID, _ = result.LastInsertId()
	json.NewEncoder(w).Encode(user)
}

func getUserHandler(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	user := User{}
	err := db.QueryRow("SELECT id, name, email, mobile, address, age FROM users WHERE id = ?", id).
		Scan(&user.ID, &user.Name, &user.Email, &user.Mobile, &user.Address, &user.Age)
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(user)
}

func getAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, email, mobile, address, age FROM users")
	if err != nil {
		http.Error(w, "Query failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Mobile, &user.Address, &user.Age); err != nil {
			http.Error(w, "Scan failed", http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "Rows error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}



func updateUserHandler(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	var user User
	json.NewDecoder(r.Body).Decode(&user)
	user.ID = id
	_, err := db.Exec("UPDATE users SET name=?, email=?, mobile=?, address=?, age=? WHERE id=?",
		user.Name, user.Email, user.Mobile, user.Address, user.Age, user.ID)
	if err != nil {
		http.Error(w, "Update failed", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(user)
}



func deleteUserHandler(w http.ResponseWriter, r *http.Request) {
	// جلب معرف المستخدم
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		fmt.Println("❌ Failed to parse ID:", idStr)
		return
	}

	// تنفيذ الحذف
	result, err := db.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		http.Error(w, "Delete failed", http.StatusInternalServerError)
		fmt.Println("❌ Database error:", err)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "User not found", http.StatusNotFound)
		fmt.Println("⚠️ No user with ID:", id)
		return
	}

	// تأكيد الحذف
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"User deleted successfully"}`))
	fmt.Println("✅ Deleted user with ID:", id)
}


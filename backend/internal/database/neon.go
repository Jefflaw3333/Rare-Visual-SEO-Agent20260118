package database

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
)

type NeonDB struct {
	db *sql.DB
}

func NewNeonDB() *NeonDB {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		println("WARNING: DATABASE_URL not set, DB features disabled")
		return &NeonDB{db: nil}
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		fmt.Printf("Error opening DB: %v\n", err)
		return &NeonDB{db: nil}
	}

	// Try to create table if not exists (Simple migration)
	_, _ = db.Exec(`
		CREATE TABLE IF NOT EXISTS request_logs (
			id SERIAL PRIMARY KEY,
			user_id TEXT,
			endpoint TEXT,
			status_code INT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)

	return &NeonDB{db: db}
}

func (d *NeonDB) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Wrap ResponseWriter to capture status code
		rw := NewResponseWriter(w)
		next.ServeHTTP(rw, r)

		if d.db != nil {
			userID, _ := r.Context().Value("user_id").(string)
			// Non-blocking log
			go func() {
				// Re-create context/connection handling in production
				_, err := d.db.Exec(`
					INSERT INTO request_logs (user_id, endpoint, status_code, created_at)
					VALUES ($1, $2, $3, $4)
				`, userID, r.URL.Path, rw.statusCode, start)
				if err != nil {
					fmt.Printf("Log error: %v\n", err)
				}
			}()
		}
	})
}

// ResponseWriter wrapper to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func NewResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{w, http.StatusOK}
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

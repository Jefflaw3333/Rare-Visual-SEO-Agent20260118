package database

import (
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
	db.Exec(`
		CREATE TABLE IF NOT EXISTS request_logs (
			id SERIAL PRIMARY KEY,
			user_id TEXT,
			endpoint TEXT,
			status_code INT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	// Add Redemptions table to track usage
	db.Exec(`
		CREATE TABLE IF NOT EXISTS redemptions (
			id SERIAL PRIMARY KEY,
			user_id VARCHAR(255),
			code VARCHAR(50),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, code)
		)
	`)

	return &NeonDB{db: db}
}

// Redeem a promo code
func (d *NeonDB) RedeemPromoCode(userID string, code string) (int, error) {
	if d.db == nil {
		return 0, fmt.Errorf("database feature disabled")
	}

	// 1. Validate Code (Hardcoded for now as requested)
	var bonusCredits int
	if code == "test01" {
		bonusCredits = 10
	} else {
		return 0, fmt.Errorf("invalid promo code")
	}

	// 2. Start Transaction
	tx, err := d.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// 3. Check if already used
	var exists bool
	err = tx.QueryRow("SELECT exists(SELECT 1 FROM redemptions WHERE user_id=$1 AND code=$2)", userID, code).Scan(&exists)
	if err != nil {
		return 0, err
	}
	if exists {
		return 0, fmt.Errorf("code already redeemed")
	}

	// 4. Record Redemption
	_, err = tx.Exec("INSERT INTO redemptions (user_id, code) VALUES ($1, $2)", userID, code)
	if err != nil {
		return 0, err
	}

	// 5. Add Credits (Ensure user exists first just in case, though GetCredits handles it, but for locking row...)
	_, err = tx.Exec("INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", userID)
	if err != nil {
		return 0, err
	}

	var newBalance int
	err = tx.QueryRow("UPDATE users SET credits = credits + $1 WHERE id=$2 RETURNING credits", bonusCredits, userID).Scan(&newBalance)
	if err != nil {
		return 0, err
	}

	return newBalance, tx.Commit()
}

// Check if user exists, if not create with default credits
func (d *NeonDB) EnsureUser(userID string) error {
	if d.db == nil {
		return nil // DB disabled
	}
	var exists bool
	err := d.db.QueryRow("SELECT exists(SELECT 1 FROM users WHERE id=$1)", userID).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		_, err = d.db.Exec("INSERT INTO users (id) VALUES ($1)", userID)
		return err
	}
	return nil
}

// Get user credits
func (d *NeonDB) GetCredits(userID string) (int, error) {
	if d.db == nil {
		return 9999, nil // Unlimited if no DB
	}
	var credits int
	err := d.db.QueryRow("SELECT credits FROM users WHERE id=$1", userID).Scan(&credits)
	if err == sql.ErrNoRows {
		// Try to create user on fly if missing
		d.EnsureUser(userID)
		return 10, nil
	}
	return credits, err
}

// Deduct 1 credit. Returns true if successful, false if insufficient funds
func (d *NeonDB) DeductCredit(userID string) (bool, error) {
	if d.db == nil {
		return true, nil
	}

	tx, err := d.db.Begin()
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	var credits int
	err = tx.QueryRow("SELECT credits FROM users WHERE id=$1 FOR UPDATE", userID).Scan(&credits)
	if err != nil {
		// Create user if not exists
		if err == sql.ErrNoRows {
			_ = tx.Rollback()
			d.EnsureUser(userID)
			// Retry once? Or just fail this time.
			// Simpler: Just fail and let next request handle it correctly
			return false, fmt.Errorf("user not found, try again")
		}
		return false, err
	}

	if credits <= 0 {
		return false, nil // Insufficient funds
	}

	_, err = tx.Exec("UPDATE users SET credits = credits - 1 WHERE id=$1", userID)
	if err != nil {
		return false, err
	}

	return true, tx.Commit()
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

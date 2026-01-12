package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"saas-backend/internal/auth"
	"saas-backend/internal/database"
	"saas-backend/internal/proxy"
	"saas-backend/internal/ratelimit"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if exists (local dev)
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	// Initialize dependencies
	db := database.NewNeonDB()
	limiter := ratelimit.NewRedisLimiter()
	clerkAuth := auth.NewClerkAuth()

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // Configure strictly for prod
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public routes
	r.Group(func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		})
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"running", "message":"RareVisual Backend API is online. Please visit the frontend application."}`))
		})
	})
	// Protected Routes
	r.Group(func(r chi.Router) {
		r.Use(clerkAuth.Middleware) // 1. Verify Identity
		r.Use(limiter.Middleware)   // 2. Rate Limit
		r.Use(db.Middleware)        // 3. Log usage to DB

		// Get Credits (Read-Only)
		r.Get("/api/user/credits", func(w http.ResponseWriter, r *http.Request) {
			userID, _ := r.Context().Value("user_id").(string)
			credits, err := db.GetCredits(userID)
			if err != nil {
				http.Error(w, "Failed to fetch credits", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			// Manual JSON string construction to avoid importing encoding/json if not already there,
			// but better to import it for robustness. Let's assume user is okay with simple string for now or I add import.
			// Actually I should check imports. 'log', 'net/http', 'os' are there. 'encoding/json' is NOT.
			// I will use fmt.Sprintf for simplicity or run a separate replace to add import.
			// Let's rely on adding the import in a separate block or verify if I can add it here.
			// Chi router allows regex replaces so I will do two blocks.
			w.Write([]byte(fmt.Sprintf(`{"credits": %d}`, credits)))
		})

		// Generation which costs credits
		r.With(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				userID, _ := r.Context().Value("user_id").(string)
				if userID == "" {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}

				success, err := db.DeductCredit(userID)
				if err != nil {
					log.Printf("Credit Error: %v", err)
					http.Error(w, "Server Error", http.StatusInternalServerError)
					return
				}
				if !success {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusPaymentRequired)
					w.Write([]byte(`{"error": "Insufficient credits", "code": "NO_CREDITS"}`))
					return
				}
				next.ServeHTTP(w, r)
			})
		}).Post("/api/generate-content", proxy.HandleGeminiProxy)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}

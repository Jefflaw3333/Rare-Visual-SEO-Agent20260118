package main

import (
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

	// Routes
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// Protected Routes
	r.Group(func(r chi.Router) {
		r.Use(clerkAuth.Middleware) // 1. Verify Identity
		r.Use(limiter.Middleware)   // 2. Rate Limit
		r.Use(db.Middleware)        // 3. Log usage to DB

		// Proxy endpoints
		r.Post("/api/generate-content", proxy.HandleGeminiProxy)
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

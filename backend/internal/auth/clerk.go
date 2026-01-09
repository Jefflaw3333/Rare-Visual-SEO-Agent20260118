package auth

import (
	"context"
	"net/http"
	"os"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
)

type ClerkAuth struct{}

func NewClerkAuth() *ClerkAuth {
	key := os.Getenv("CLERK_SECRET_KEY")
	if key == "" {
		// Log warning but don't crash in dev if not set immediately
		println("WARNING: CLERK_SECRET_KEY is not set")
	}
	clerk.SetKey(key)
	return &ClerkAuth{}
}

func (c *ClerkAuth) Middleware(next http.Handler) http.Handler {
	// Use Clerk's official middleware
	// It adds user info to the context
	return clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Custom verification if needed, or just ensure claims exist
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok {
			// If strict mode is needed, return 401 here if Clerk didn't populate context
			// But WithHeaderAuthorization usually handles 401 if token is invalid
			// Let's double check if we can get user ID
			http.Error(w, "Unauthorized: No session found", http.StatusUnauthorized)
			return
		}
		
		// Inject UserID into context for downstream usage (e.g. rate limit, db)
		ctx := context.WithValue(r.Context(), "user_id", claims.Subject)
		next.ServeHTTP(w, r.WithContext(ctx))
	}))
}

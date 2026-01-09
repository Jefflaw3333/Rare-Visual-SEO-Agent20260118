package ratelimit

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisLimiter struct {
	client *redis.Client
}

func NewRedisLimiter() *RedisLimiter {
	opt, err := redis.ParseURL(os.Getenv("UPSTASH_REDIS_URL"))
	if err != nil {
		println("WARNING: Invalid UPSTASH_REDIS_URL, rate limiting disabled")
		return &RedisLimiter{client: nil}
	}
	return &RedisLimiter{
		client: redis.NewClient(opt),
	}
}

func (l *RedisLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if l.client == nil {
			next.ServeHTTP(w, r)
			return
		}

		userID, ok := r.Context().Value("user_id").(string)
		if !ok {
			// Should be caught by auth middleware, but fallback
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Rate Limit: 10 requests per minute
		key := fmt.Sprintf("ratelimit:%s", userID)
		limit := int64(10)
		window := time.Minute

		// Simple fixed window counter
		count, err := l.client.Incr(context.Background(), key).Result()
		if err != nil {
			// Fail open if Redis is down
			next.ServeHTTP(w, r)
			return
		}

		if count == 1 {
			l.client.Expire(context.Background(), key, window)
		}

		if count > limit {
			w.Header().Set("Retry-After", "60")
			http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

# Build Stage
FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod go.sum* ./
# Download dependencies if go.sum exists, otherwise just go.mod
RUN go mod download || true

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server/main.go

# Runtime Stage
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/server .

# Expose port
EXPOSE 8080

# Environment variables should be injected by DigitalOcean App Platform
CMD ["./server"]

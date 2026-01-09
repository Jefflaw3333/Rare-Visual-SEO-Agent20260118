package proxy

import (
	"bytes"
	"io"
	"net/http"
	"os"
)

// HandleGeminiProxy forwards requests to Google Gemini API
// It assumes the frontend sends the body expected by Gemini
func HandleGeminiProxy(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		http.Error(w, "Server Configuration Error: Missing API Key", http.StatusInternalServerError)
		return
	}

	// Target URL: The frontend is calling /api/generate-content
	// Real URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent
	// Simplification: We will support a specific model hardcoded or getting it from a query param.
	// For this MVP, let's look at the body or just default to gemini-pro if not specified? 
	// Actually, easier strategy: Frontend sends the FULL data, we just forward to a specific endpoint.
	// Let's proxy to the model specified in the query param 'model' or default.
	
	model := r.URL.Query().Get("model")
	if model == "" {
		model = "gemini-3-pro-preview"
	}

	targetURL := "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey
	
	// Create Proxy Request
	proxyReq, err := http.NewRequest(r.Method, targetURL, r.Body)
	if err != nil {
		http.Error(w, "Failed to create proxy request", http.StatusInternalServerError)
		return
	}
	
	// Copy headers (important for Content-Type)
	proxyReq.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		http.Error(w, "Failed to contact Gemini API", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Copy Response Headers
	for k, v := range resp.Header {
		w.Header()[k] = v
	}
	w.WriteHeader(resp.StatusCode)

	// Stream Response Body
	io.Copy(w, resp.Body)
}

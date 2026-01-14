package shopify

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type BlogPost struct {
	Title   string `json:"title"`
	Body    string `json:"body_html"` // Shopify uses body_html
	Author  string `json:"author,omitempty"`
	Tags    string `json:"tags,omitempty"`
	Summary string `json:"summary_html,omitempty"`
}

type ArticleRequest struct {
	Article BlogPost `json:"article"`
}

// PublishPost creates a new blog post on a Shopify store
func PublishPost(storeURL, accessToken, blogID string, post BlogPost) (string, error) {
	// Normalize Store URL (e.g., "shop.myshopify.com")
	storeURL = strings.TrimPrefix(storeURL, "https://")
	storeURL = strings.TrimPrefix(storeURL, "http://")
	storeURL = strings.TrimSuffix(storeURL, "/")

	// API Endpoint: https://{store_name}/admin/api/2023-10/blogs/{blog_id}/articles.json
	// If blogID is not provided, we need to find one or default to the first one available?
	// The user must provide a Blog ID usually, or we can fetch list first.
	// For MVP, let's assume Blog ID is provided or required.
	// If we want to be smarter, we could implement "List Blogs" later.

	if blogID == "" {
		return "", fmt.Errorf("blog_id is required")
	}

	url := fmt.Sprintf("https://%s/admin/api/2023-10/blogs/%s/articles.json", storeURL, blogID)

	payload, err := json.Marshal(ArticleRequest{Article: post})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Shopify-Access-Token", accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("shopify API error: %s", resp.Status)
	}

	// Parse response to return URL or ID?
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "Published, but failed to parse response", nil
	}

	// Try to extract the handle or ID to construct a public URL if possible?
	// Usually response is { "article": { "id": ..., "handle": ... } }
	// We can just return "Success"
	return "Successfully published to Shopify", nil
}

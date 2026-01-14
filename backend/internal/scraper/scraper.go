package scraper

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/PuerkitoBio/goquery"
)

type ScrapedImage struct {
	URL string `json:"url"`
	Alt string `json:"alt"`
}

// ScrapeImages fetches all <img> tags from the given URL
func ScrapeImages(targetURL string) ([]ScrapedImage, error) {
	// Basic validation
	_, err := url.ParseRequestURI(targetURL)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %v", err)
	}

	// Fetch HTML
	resp, err := http.Get(targetURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("received non-200 status code: %d", resp.StatusCode)
	}

	// Parse HTML
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %v", err)
	}

	var images []ScrapedImage
	uniqueURLs := make(map[string]bool)

	doc.Find("img").Each(func(i int, s *goquery.Selection) {
		src, exists := s.Attr("src")
		if !exists || src == "" {
			return
		}

		// Resolve relative URLs
		resolvedURL := resolveURL(targetURL, src)
		if resolvedURL == "" {
			return
		}

		// Deduplicate
		if uniqueURLs[resolvedURL] {
			return
		}

		alt, _ := s.Attr("alt")

		// Filter out tiny icons/tracking pixels (heuristic)
		// We can't really know dimensions without downloading, but we can skip obvious SVG icons or weird paths if needed.
		// For now, accept all valid image URLs.

		images = append(images, ScrapedImage{
			URL: resolvedURL,
			Alt: alt,
		})
		uniqueURLs[resolvedURL] = true
	})

	// Limit to reasonable amount
	if len(images) > 20 {
		images = images[:20]
	}

	return images, nil
}

func resolveURL(baseURL string, relativeURL string) string {
	u, err := url.Parse(relativeURL)
	if err != nil {
		return ""
	}
	base, err := url.Parse(baseURL)
	if err != nil {
		return ""
	}
	return base.ResolveReference(u).String()
}

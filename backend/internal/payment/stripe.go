package payment

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
)

type PaymentHandler struct {
	ResultURL string
}

func NewPaymentHandler() *PaymentHandler {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	// Use Frontend URL for redirects. Default to localhost for dev if not set.
	frontend := os.Getenv("FRONTEND_URL")
	if frontend == "" {
		frontend = "http://localhost:5173" // Default Dev URL
		// Ideally pass in the actual production URL environment variable
	}
	return &PaymentHandler{
		ResultURL: frontend,
	}
}

func (h *PaymentHandler) HandleCreateCheckoutSession(w http.ResponseWriter, r *http.Request) {
	userId, _ := r.Context().Value("user_id").(string)
	if userId == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		PackageID string `json:"packageId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid Body", http.StatusBadRequest)
		return
	}

	var name string
	var amount int64 // in cents
	var credits int

	// Define Packages (Keep in sync with Frontend TIERS)
	switch req.PackageID {
	case "tier_basic":
		name = "10 Credits (Basic)"
		amount = 490 // $4.90
		credits = 10
	case "tier_standard":
		name = "50 Credits (Standard)"
		amount = 1990 // $19.90
		credits = 50
	case "tier_pro":
		name = "100 Credits (Pro)"
		amount = 3490 // $34.90
		credits = 100
	default:
		http.Error(w, "Invalid Package ID", http.StatusBadRequest)
		return
	}

	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModePayment)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency: stripe.String("usd"),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name: stripe.String(name),
					},
					UnitAmount: stripe.Int64(amount),
				},
				Quantity: stripe.Int64(1),
			},
		},
		Metadata: map[string]string{
			"user_id": userId,
			"credits": fmt.Sprintf("%d", credits),
		},
		SuccessUrl: stripe.String(h.ResultURL + "?payment=success"),
		CancelUrl:  stripe.String(h.ResultURL + "?payment=cancel"),
	}

	s, err := session.New(params)
	if err != nil {
		http.Error(w, "Stripe Error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url": s.URL,
	})
}

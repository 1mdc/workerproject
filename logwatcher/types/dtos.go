package types

import "time"

type PeonBid struct {
	Buyer string    `json:"buyer"`
	Value uint64    `json:"value"`
	Time  time.Time `json:"time"`
}

type Peon struct {
	PeonId     uint           `json:"peon_id"`
	Owner      string         `json:"owner"`
	Transfers  []PeonTransfer `json:"transfers"`
	Efficiency uint           `json:"efficiency"`
	Purchases  []PeonPurchase `json:"purchases"`
	Bids       []PeonBid      `json:"bids"`
	CreatedAt  time.Time      `json:"created_at"`
}

type PeonTransfer struct {
	From string    `json:"from"`
	To   string    `json:"to"`
	Time time.Time `json:"time"`
}

type PeonPurchase struct {
	From  string    `json:"from"`
	To    string    `json:"to"`
	Value uint64    `json:"value"`
	Time  time.Time `json:"time"`
}

type PeonCountDto struct {
	Peons uint `json:"peons"`
}

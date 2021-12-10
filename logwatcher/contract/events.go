package contract

import (
	"github.com/ethereum/go-ethereum/common"
	"math/big"
)

type BidEvent struct {
	PeonId uint
	Buyer  common.Address
	Amount *big.Int
}

type AcceptBidEvent struct {
	PeonId uint
	Buyer  common.Address
}

type PeonMintedEvent struct {
	PeonId     uint
	Efficiency uint
}

type CancelEvent struct {
	PeonId uint
	Buyer  common.Address
}

type TransferEvent struct {
	From    common.Address
	To      common.Address
	TokenId uint
}

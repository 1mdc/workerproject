package repositories

import (
	"com.peon/logwatcher/types"
	"gorm.io/gorm"
	"time"
)

type BiddingTable struct {
	PeonId         uint   `gorm:"primaryKey"`
	BiddingAddress string `gorm:"primaryKey"`
	BiddingAmount  uint64
	CreatedAt      time.Time
}

func GetBidValue(db *gorm.DB, peonId uint, address string) (uint64, error) {
	row := new(BiddingTable)
	result := db.Where("peon_id = ? AND LOWER(bidding_address) = LOWER(?)", peonId, address).First(row)
	return row.BiddingAmount, result.Error
}

func DeleteBidding(db *gorm.DB, peonId uint, address string) error {
	result := db.Where("peon_id = ? AND LOWER(bidding_address) = LOWER(?)", peonId, address).Delete(&BiddingTable{})
	return result.Error
}

func InsertBidding(db *gorm.DB, bid *BiddingTable) (int, error) {
	result := db.Create(bid)
	return int(result.RowsAffected), result.Error
}

func GetAllBids(db *gorm.DB, peonId uint) ([]types.PeonBid, error) {
	data := make([]types.PeonBid, 0)
	rows := make([]BiddingTable, 0)
	result := db.Where("peon_id = ?", peonId).Order("created_at desc").Limit(20).Find(&rows)
	for _, row := range rows {
		data = append(data, types.PeonBid{
			Buyer: row.BiddingAddress,
			Value: row.BiddingAmount,
			Time:  row.CreatedAt,
		})
	}
	return data, result.Error
}

func GetBiddingsByAddress(db *gorm.DB, address string) ([]BiddingTable, error) {
	data := make([]BiddingTable, 0)
	result := db.Where("LOWER(bidding_address) = LOWER(?)", address).Find(&data)
	return data, result.Error
}

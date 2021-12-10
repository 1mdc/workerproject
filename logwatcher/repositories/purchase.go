package repositories

import (
	"gorm.io/gorm"
	"time"
)

type PurchaseTable struct {
	Id          uint `gorm:"primaryKey"`
	PeonId      uint
	FromAddress string
	ToAddress   string
	Value       uint64
	CreatedAt   time.Time
}

func InsertPurchase(db *gorm.DB, purchase *PurchaseTable) (int, error) {
	result := db.Create(purchase)
	return int(result.RowsAffected), result.Error
}

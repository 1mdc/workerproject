package repositories

import (
	ptypes "com.peon/logwatcher/types"
	"gorm.io/gorm"
	"time"
)

var (
	zeroAddress = "0x0000000000000000000000000000000000000000"
)

type TransferLogTable struct {
	TransactionId string `gorm:"primaryKey"`
	PeonId        uint   `gorm:"primaryKey"`
	FromAddress   string
	BlockNumber   uint64 `gorm:"index"`
	ToAddress     string `gorm:"index"`
	CreatedAt     time.Time
}

func InsertTransferLog(db *gorm.DB, log *TransferLogTable) (int, error) {
	result := db.Create(log)
	return int(result.RowsAffected), result.Error
}

func PeonCount(db *gorm.DB) (uint, error) {
	var count uint = 0
	row := db.Raw("SELECT COUNT(*) FROM (SELECT DISTINCT peon_id FROM transfer_log_tables WHERE from_address=?)", zeroAddress).Row()
	err := row.Scan(&count)
	return count, err
}

func GetNewPeons(db *gorm.DB) ([]uint, error) {
	rows, err := db.Raw("SELECT peon_id FROM transfer_log_tables WHERE from_address=? ORDER BY created_at DESC LIMIT 10", zeroAddress).Rows()
	data := make([]uint, 0)
	for rows.Next() {
		var peonId uint = 0
		rows.Scan(&peonId)
		data = append(data, peonId)
	}
	return data, err
}

func GetAllPurchases(db *gorm.DB, peonId uint) ([]ptypes.PeonPurchase, error) {
	data := make([]ptypes.PeonPurchase, 0)
	rows := make([]PurchaseTable, 0)
	result := db.Where("peon_id = ?", peonId).Order("created_at desc").Limit(20).Find(&rows)
	for _, row := range rows {
		data = append(data, ptypes.PeonPurchase{
			From:  row.FromAddress,
			To:    row.ToAddress,
			Value: row.Value,
			Time:  row.CreatedAt,
		})
	}
	return data, result.Error
}

func GetAllTransfers(db *gorm.DB, peonId uint) ([]ptypes.PeonTransfer, error) {
	data := make([]ptypes.PeonTransfer, 0)
	rows := make([]TransferLogTable, 0)
	result := db.Where("peon_id = ?", peonId).Order("created_at desc").Limit(20).Find(&rows)
	for _, row := range rows {
		data = append(data, ptypes.PeonTransfer{
			From: row.FromAddress,
			To:   row.ToAddress,
			Time: row.CreatedAt,
		})
	}
	return data, result.Error
}

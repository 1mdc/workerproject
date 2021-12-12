package repositories

import (
	"com.peon/logwatcher/clock"
	ptypes "com.peon/logwatcher/types"
	"errors"
	"gorm.io/gorm"
	"time"
)

type PeonOwnerTable struct {
	PeonId       uint   `gorm:"primaryKey"`
	OwnerAddress string `gorm:"primaryKey"`
	Efficiency   uint
	CreatedAt    time.Time
}

func SetPeonOwner(db *gorm.DB, peonId uint, owner string) error {
	result := db.Where("peon_id = ?", peonId).First(&PeonOwnerTable{})
	if result.Error != nil && errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return db.Create(&PeonOwnerTable{
			PeonId:       peonId,
			OwnerAddress: owner,
			CreatedAt:    clock.Now(),
		}).Error
	} else {
		return db.Model(&PeonOwnerTable{}).Where("peon_id = ?", peonId).Update("owner_address", owner).Error
	}
}

func GetRandomPeons(db *gorm.DB) ([]uint, error) {
	rows := make([]uint, 0)
	result := db.Raw("select peon_id from peon_owner_tables ORDER BY random() LIMIT 20").Scan(&rows)
	return rows, result.Error
}

func GetPeon(db *gorm.DB, peonId uint) (*ptypes.Peon, error) {
	owner, err := GetOwnerOfPeon(db, peonId)
	if err != nil {
		return nil, err
	}
	transfers, err := GetAllTransfers(db, peonId)
	if err != nil {
		return nil, err
	}
	purchases, err := GetAllPurchases(db, peonId)
	if err != nil {
		return nil, err
	}
	bids, err := GetAllBids(db, peonId)
	if err != nil {
		return nil, err
	}
	return &ptypes.Peon{
		PeonId:     peonId,
		Owner:      owner.OwnerAddress,
		Transfers:  transfers,
		Efficiency: owner.Efficiency,
		Purchases:  purchases,
		Bids:       bids,
		CreatedAt:  owner.CreatedAt,
	}, nil
}

func SetPeonEff(db *gorm.DB, peonId uint, eff uint) error {
	result := db.Where("peon_id = ?", peonId).First(&PeonOwnerTable{})
	if result.Error != nil && errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return db.Create(&PeonOwnerTable{
			PeonId:     peonId,
			Efficiency: eff,
			CreatedAt:  clock.Now(),
		}).Error
	} else {
		return db.Model(&PeonOwnerTable{}).Where("peon_id = ?", peonId).Update("efficiency", eff).Error
	}
}

func GetOwnerOfPeon(db *gorm.DB, peonId uint) (*PeonOwnerTable, error) {
	row := new(PeonOwnerTable)
	result := db.Where("peon_id = ?", peonId).First(row)
	return row, result.Error
}

func GetOwnedPeons(db *gorm.DB, address string) ([]uint, error) {
	rows := make([]PeonOwnerTable, 0)
	data := make([]uint, 0)
	result := db.Where("LOWER(owner_address) = LOWER(?)", address).Find(&rows)
	for _, row := range rows {
		data = append(data, row.PeonId)
	}
	return data, result.Error
}

package repositories

import (
	"gorm.io/gorm"
	"strconv"
)

type AppConfig struct {
	Name  string `gorm:"primaryKey"`
	Value string
}

func UpdateCheckpoint(db *gorm.DB, blockNumber uint64) error {
	result := db.Save(&AppConfig{
		Name:  "block_number",
		Value: strconv.FormatUint(blockNumber, 10),
	})
	return result.Error
}

func CreateCheckpoint(db *gorm.DB, blockNumber uint64) error {
	conf := new(AppConfig)
	db.Where("name = ?", "block_number").First(conf)
	if conf.Value == "" {
		result := db.Create(&AppConfig{
			Name:  "block_number",
			Value: strconv.FormatUint(blockNumber, 10),
		})
		return result.Error
	}
	return nil
}

func GetLastCheckpoint(db *gorm.DB) (uint64, error) {
	conf := new(AppConfig)
	result := db.Where("name = ?", "block_number").First(conf)
	blockNumber, err := strconv.ParseUint(conf.Value, 10, 64)
	if err != nil {
		return 0, err
	}
	return blockNumber, result.Error
}

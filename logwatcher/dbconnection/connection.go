package dbconnection

import (
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"log"
	"os"
)

func GetDbConnection() (*gorm.DB, error) {
	stdLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			// SlowThreshold:             time.Second, // Slow SQL threshold
			LogLevel:                  logger.Info, // Log level
			IgnoreRecordNotFoundError: true,        // Ignore ErrRecordNotFound error for logger
			Colorful:                  false,       // Disable color
		},
	)
	return gorm.Open(postgres.Open(fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable", "localhost", "test", "test", "peonproject")), &gorm.Config{Logger: stdLogger})
}

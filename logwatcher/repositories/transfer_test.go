package repositories

import (
	"com.peon/logwatcher/dbconnection"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

var (
	now = time.Now()
)

func TestInsertTransferLog(t *testing.T) {
	db, _ := dbconnection.GetDbConnection("file::memory:?cache=shared")
	_, err := InsertTransferLog(db, &TransferLogTable{
		TransactionId: "1",
		PeonId:        1,
		FromAddress:   "0x123",
		BlockNumber:   100,
		ToAddress:     "0x222",
		CreatedAt:     now,
	})
	assert.NotNil(t, err)
}

func TestPeonCount(t *testing.T) {
	db, _ := dbconnection.GetDbConnection("file::memory:?cache=shared")
	InsertTransferLog(db, &TransferLogTable{
		TransactionId: "1",
		PeonId:        1,
		FromAddress:   "0x0000000000000000000000000000000000000000",
		BlockNumber:   100,
		ToAddress:     "0x222",
		CreatedAt:     now,
	})
	count, _ := PeonCount(db)
	assert.Equal(t, uint(1), count)
}

package api

import (
	"com.peon/logwatcher/dbconnection"
	"com.peon/logwatcher/repositories"
	"com.peon/logwatcher/types"
	"embed"
	"encoding/json"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

//go:embed endpoint_test.go
var testFile embed.FS

func TestRunServer(t *testing.T) {
	db, _ := dbconnection.GetDbConnection("")
	server := CreateServerResource(db, testFile)

	t.Run("count peons", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/count-peons", nil)
		recorder := httptest.NewRecorder()
		PeonCount = func(db *gorm.DB) (uint, error) {
			return 10, nil
		}
		server.ServeHTTP(recorder, request)
		assert.Equal(t, 200, recorder.Code)
		data, _ := ioutil.ReadAll(recorder.Body)
		responseObj := new(types.PeonCountDto)
		json.Unmarshal(data, &responseObj)
		assert.Equal(t, &types.PeonCountDto{
			Peons: 10,
		}, responseObj)
	})

	t.Run("market", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/market", nil)
		recorder := httptest.NewRecorder()
		GetRandomPeons = func(db *gorm.DB) ([]uint, error) {
			return []uint{4, 10}, nil
		}
		server.ServeHTTP(recorder, request)
		assert.Equal(t, 200, recorder.Code)
		data, _ := ioutil.ReadAll(recorder.Body)
		responseObj := make([]uint, 0)
		json.Unmarshal(data, &responseObj)
		assert.Equal(t, []uint{4, 10}, responseObj)
	})

	t.Run("get bid by address", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/bids/0x123", nil)
		recorder := httptest.NewRecorder()
		now := time.Now()
		GetBidsByAddress = func(db *gorm.DB, address string) ([]repositories.BiddingTable, error) {
			assert.Equal(t, "0x123", address)
			return []repositories.BiddingTable{
				{PeonId: 1, BiddingAddress: "0x0001", BiddingAmount: 1000, CreatedAt: now},
				{PeonId: 2, BiddingAddress: "0x0001", BiddingAmount: 2000, CreatedAt: now},
			}, nil
		}
		server.ServeHTTP(recorder, request)
		assert.Equal(t, 200, recorder.Code)
		data, _ := ioutil.ReadAll(recorder.Body)
		responseObj := make([]uint, 0)
		json.Unmarshal(data, &responseObj)
		assert.Equal(t, []uint{1, 2}, responseObj)
	})

	t.Run("get owned peons", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/owned-peons/0x123", nil)
		recorder := httptest.NewRecorder()
		GetOwnedPeons = func(db *gorm.DB, address string) ([]uint, error) {
			assert.Equal(t, "0x123", address)
			return []uint{
				1,
				2,
			}, nil
		}
		server.ServeHTTP(recorder, request)
		assert.Equal(t, 200, recorder.Code)
		data, _ := ioutil.ReadAll(recorder.Body)
		responseObj := make([]uint, 0)
		json.Unmarshal(data, &responseObj)
		assert.Equal(t, []uint{1, 2}, responseObj)
	})

	t.Run("get peon details", func(t *testing.T) {
		request, _ := http.NewRequest("GET", "/peons/1", nil)
		recorder := httptest.NewRecorder()
		now := time.Now().UTC()
		GetPeon = func(db *gorm.DB, peonId uint) (*types.Peon, error) {
			assert.Equal(t, uint(1), peonId)
			return &types.Peon{
				PeonId:     0,
				Owner:      "0x123",
				Transfers:  []types.PeonTransfer{},
				Efficiency: 0,
				Purchases:  []types.PeonPurchase{},
				Bids:       []types.PeonBid{},
				CreatedAt:  now,
			}, nil
		}
		server.ServeHTTP(recorder, request)
		assert.Equal(t, 200, recorder.Code)
		data, _ := ioutil.ReadAll(recorder.Body)
		responseObj := new(types.Peon)
		json.Unmarshal(data, &responseObj)
		assert.Equal(t, &types.Peon{
			PeonId:     0,
			Owner:      "0x123",
			Transfers:  []types.PeonTransfer{},
			Efficiency: 0,
			Purchases:  []types.PeonPurchase{},
			Bids:       []types.PeonBid{},
			CreatedAt:  now,
		}, responseObj)
	})
}

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"log"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"time"
)

func main() {
	stdLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			// SlowThreshold:             time.Second, // Slow SQL threshold
			LogLevel:                  logger.Info, // Log level
			IgnoreRecordNotFoundError: true,        // Ignore ErrRecordNotFound error for logger
			Colorful:                  false,       // Disable color
		},
	)
	client, err := ethclient.Dial("ws://localhost:8545")
	db, err := gorm.Open(postgres.Open(fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable", "localhost", "test", "test", "peonproject")), &gorm.Config{Logger: stdLogger})
	if err != nil {
		panic(err)
	}
	err = db.AutoMigrate(&AppConfig{}, &BiddingTable{}, &TransferLogTable{}, &PurchaseTable{})
	if err != nil {
		logrus.Errorf("Unable to save migrate DB")
	}
	contractAddress := "0xFA19ee6FB6D4C49C044409dc6A94941BE3A2e9C9"
	watchTheLog(db, client, contractAddress)
}

func watchTheLog(db *gorm.DB, client *ethclient.Client, addressToListen string) {
	contractAddress := common.HexToAddress(addressToListen)
	lastCheckpoint, err := getLastCheckpoint(db)
	var checkpoint uint64 = 0
	if err != nil || lastCheckpoint == 0 {
		ck, err := client.BlockNumber(context.Background())
		if err != nil {
			panic("Unable get last block number")
		}
		checkpoint = ck
		err = createCheckpoint(db, ck)
		if err != nil {
			logrus.Errorf("Unable to save checkpoint %d", ck)
		}
	} else {
		checkpoint = lastCheckpoint
	}

	logrus.Infof("Listening from block number %d", checkpoint)
	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(checkpoint)),
		Addresses: []common.Address{contractAddress},
	}
	logChannel := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logChannel)
	if err != nil {
		panic(err)
	}
	bidEventHash := crypto.Keccak256Hash([]byte("BidEvent(uint,address)"))
	logrus.Infof("watching bidEventHash: %s", bidEventHash)
	acceptEventHash := crypto.Keccak256Hash([]byte("AcceptBidEvent(uint,address)"))
	logrus.Infof("watching acceptEventHash: %s", acceptEventHash)
	cancelEventHash := crypto.Keccak256Hash([]byte("CancelEvent(uint,address)"))
	logrus.Infof("watching cancelEventHash: %s", cancelEventHash)
	transferEventHash := crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)"))
	logrus.Infof("watching transferEventHash: %s", transferEventHash)

	router := mux.NewRouter()
	router.HandleFunc("/peons/count", func(w http.ResponseWriter, r *http.Request) {
		count, err := PeonCount(db)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error(err)
		} else {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(&PeonCountDto{
				peons: count,
			})
		}
	})
	router.HandleFunc("/owned-peons/{address}", func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		ownerAddress, exist := params["address"]
		if !exist {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error("Missing address parameter")
			return
		}
		peonIds, err := GetOwnedPeons(db, ownerAddress)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error(err)
			return
		}
		json.NewEncoder(w).Encode(peonIds)
	})
	router.HandleFunc("/peons", func(w http.ResponseWriter, r *http.Request) {
		newPeons, err := GetNewPeons(db)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error(err)
			return
		}
		json.NewEncoder(w).Encode(newPeons)
	})
	router.HandleFunc("/peons/{peonId}", func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		peonIdStr, exist := params["peonId"]
		if !exist {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error("Missing peonId parameter")
			return
		}
		peonId, err := strconv.Atoi(peonIdStr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error(err)
			return
		}
		peon, err := GetPeon(db, uint(peonId))
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error(err)
			return
		}
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error(err)
			return
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(peon)
	})
	loggedRouter := handlers.LoggingHandler(os.Stdout, router)
	logrus.Info("Server is running at :8080...")

	headersOK := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type"})
	originsOK := handlers.AllowedOrigins([]string{"*"})
	methodsOK := handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS", "DELETE", "PUT"})
	corsedRouter := handlers.CORS(headersOK, originsOK, methodsOK)(loggedRouter)

	compressedRouter := handlers.CompressHandler(corsedRouter)
	http.ListenAndServe(":8080", compressedRouter)

	logrus.Infof("Listen to event at %s", bidEventHash)
	for {
		select {
		case err := <-sub.Err():
			logrus.Fatal(err)
		case vLog := <-logChannel:
			topicHex := vLog.Topics[0].Hex()
			switch topicHex {
			case bidEventHash.Hex():
				event := &BidEvent{
					PeonId: uint(vLog.Topics[1].Big().Int64()),
					Buyer:  common.HexToAddress(vLog.Topics[2].Hex()),
					Amount: vLog.Topics[3].Big(),
				}
				logrus.Infof("BidEvent: %#v\n", event)
				_, err := InsertBidding(db, &BiddingTable{
					PeonId:         event.PeonId,
					BiddingAddress: event.Buyer.String(),
					BiddingAmount:  event.Amount.Uint64(),
					CreatedAt:      time.Now(),
				})
				if err != nil {
					logrus.Errorf("Unable to save event %#v\n", event)
				}
			case acceptEventHash.Hex():
				event := &AcceptBidEvent{
					PeonId: uint(vLog.Topics[1].Big().Int64()),
					Buyer:  common.HexToAddress(vLog.Topics[2].Hex()),
				}
				logrus.Infof("AcceptBidEvent: %#v\n", event)
				err := DeleteBidding(db, event.PeonId, event.Buyer.String())
				if err != nil {
					logrus.Errorf("Unable to save event %#v\n", event)
				}
				ownerAddress, err := GetOwnerOfPeon(db, event.PeonId)
				if err != nil {
					logrus.Errorf("Unable to find owner %#v\n", event)
				} else {
					value, err := GetBidValue(db, event.PeonId, event.Buyer.String())
					if err != nil {
						logrus.Errorf("Unable to find bid value %#v\n", event)
					} else {
						_, err := InsertPurchase(db, &PurchaseTable{
							PeonId:      event.PeonId,
							FromAddress: ownerAddress,
							ToAddress:   event.Buyer.String(),
							Value:       value,
							CreatedAt:   time.Now(),
						})
						if err != nil {
							logrus.Errorf("Unable to insert new purchase %#v\n", event)
						}
					}
				}
			case cancelEventHash.Hex():
				event := &CancelEvent{
					PeonId: uint(vLog.Topics[1].Big().Int64()),
					Buyer:  common.HexToAddress(vLog.Topics[2].Hex()),
				}
				logrus.Infof("CancelEvent: %#v\n", event)
				err := DeleteBidding(db, event.PeonId, event.Buyer.String())
				if err != nil {
					logrus.Errorf("Unable to save event %#v\n", event)
				}
			case transferEventHash.Hex():
				event := &TransferEvent{
					From:    common.HexToAddress(vLog.Topics[1].Hex()),
					To:      common.HexToAddress(vLog.Topics[2].Hex()),
					TokenId: uint(vLog.Topics[3].Big().Int64()),
				}
				logrus.Infof("TransferEvent: %#v\n", event)
				_, err := InsertTransferLog(db, &TransferLogTable{
					TransactionId: vLog.TxHash.String(),
					BlockNumber:   vLog.BlockNumber,
					PeonId:        event.TokenId,
					FromAddress:   event.From.String(),
					ToAddress:     event.To.String(),
					CreatedAt:     time.Now(),
				})
				if err != nil {
					logrus.Errorf("Unable to save event %#v\n", event)
				}
				err = SetPeonOwner(db, event.TokenId, event.To.String())
				if err != nil {
					logrus.Errorf("Unable to update new owner %#v\n", event)
				}
			default:
				logrus.Infof("Unknown even: %s\n", topicHex)
			}
			err := updateCheckpoint(db, vLog.BlockNumber)
			if err != nil {
				logrus.Errorf("Unable to save checkpoint %d", vLog.BlockNumber)
			}
		default:
			time.Sleep(15 * time.Second)
			ck, err := client.BlockNumber(context.Background())
			if err != nil {
				logrus.Error("Unable get last block number")
			}
			err = updateCheckpoint(db, ck)
			if err != nil {
				logrus.Errorf("Unable to save checkpoint %d", ck)
			}
		}
	}
}

func GetPeon(db *gorm.DB, peonId uint) (*Peon, error) {
	lastTransfer, err := GetLastTransfer(db, peonId)
	if err != nil {
		return nil, err
	}
	firstTransfer, err := GetFirstTransfer(db, peonId)
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
	return &Peon{
		PeonId:        peonId,
		Owner:         lastTransfer.ToAddress,
		Transfers:     transfers,
		Purchases:     purchases,
		Bids:          bids,
		TransferredAt: lastTransfer.CreatedAt,
		CreatedAt:     firstTransfer.CreatedAt,
	}, nil
}

func GetAllTransfers(db *gorm.DB, peonId uint) ([]PeonTransfer, error) {
	data := make([]PeonTransfer, 0)
	rows := make([]TransferLogTable, 0)
	result := db.Where("peon_id = ?", peonId).Order("created_at desc").Limit(20).Find(&rows)
	for _, row := range rows {
		data = append(data, PeonTransfer{
			From: row.FromAddress,
			To:   row.ToAddress,
		})
	}
	return data, result.Error
}

func GetAllPurchases(db *gorm.DB, peonId uint) ([]PeonPurchase, error) {
	data := make([]PeonPurchase, 0)
	rows := make([]PurchaseTable, 0)
	result := db.Where("peon_id = ?", peonId).Order("created_at desc").Limit(20).Find(&rows)
	for _, row := range rows {
		data = append(data, PeonPurchase{
			From:  row.FromAddress,
			To:    row.ToAddress,
			Value: row.Value,
		})
	}
	return data, result.Error
}

func GetAllBids(db *gorm.DB, peonId uint) ([]PeonBid, error) {
	data := make([]PeonBid, 0)
	rows := make([]BiddingTable, 0)
	result := db.Where("peon_id = ?", peonId).Order("created_at desc").Limit(20).Find(&rows)
	for _, row := range rows {
		data = append(data, PeonBid{
			Buyer: row.BiddingAddress,
			Value: row.BiddingAmount,
		})
	}
	return data, result.Error
}

func GetOwnerOfPeon(db *gorm.DB, peonId uint) (string, error) {
	row := new(PeonOwnerTable)
	result := db.Where("peon_id = ?", peonId).First(row)
	return row.OwnerAddress, result.Error
}

func GetOwnedPeons(db *gorm.DB, address string) ([]uint, error) {
	rows := make([]PeonOwnerTable, 0)
	data := make([]uint, 0)
	db.Where("owner_address", address).Find(&rows)
	for _, row := range rows {
		data = append(data, row.PeonId)
	}
	return data, nil
}

func GetNewPeons(db *gorm.DB) ([]uint, error) {
	rows, err := db.Raw("SELECT peon_id FROM transfer_log_tables WHERE from_address=? ORDER BY created_at DESC LIMIT 10", "0x0000000000000000000000000000000000000000").Rows()
	data := make([]uint, 0)
	for rows.Next() {
		var peonId uint = 0
		rows.Scan(&peonId)
		data = append(data, peonId)
	}
	return data, err
}

func PeonCount(db *gorm.DB) (uint, error) {
	var count uint = 0
	row := db.Raw("SELECT COUNT(*) FROM (SELECT DISTINCT peon_id FROM transfer_log_tables WHERE from_address=?)", "0x0000000000000000000000000000000000000000").Row()
	err := row.Scan(&count)
	return count, err
}

func InsertTransferLog(db *gorm.DB, log *TransferLogTable) (int, error) {
	result := db.Create(log)
	return int(result.RowsAffected), result.Error
}

func InsertBidding(db *gorm.DB, bid *BiddingTable) (int, error) {
	result := db.Create(bid)
	return int(result.RowsAffected), result.Error
}

func InsertPurchase(db *gorm.DB, purchase *PurchaseTable) (int, error) {
	result := db.Create(purchase)
	return int(result.RowsAffected), result.Error
}

func DeleteBidding(db *gorm.DB, peonId uint, address string) error {
	result := db.Where("peon_id = ? AND buyer = ?", peonId, address).Delete(&BiddingTable{})
	return result.Error
}

func getLastCheckpoint(db *gorm.DB) (uint64, error) {
	conf := new(AppConfig)
	result := db.Where("name = ?", "block_number").First(conf)
	blockNumber, err := strconv.ParseUint(conf.Value, 10, 64)
	if err != nil {
		return 0, err
	}
	return blockNumber, result.Error
}

func GetLastTransfer(db *gorm.DB, peonId uint) (*TransferLogTable, error) {
	row := new(TransferLogTable)
	result := db.Where("peon_id = ?", peonId).Order("block_number desc").First(row)
	return row, result.Error
}

func GetFirstTransfer(db *gorm.DB, peonId uint) (*TransferLogTable, error) {
	row := new(TransferLogTable)
	result := db.Where("peon_id = ?", peonId).Order("block_number asc").First(row)
	return row, result.Error
}

func GetBidValue(db *gorm.DB, peonId uint, address string) (uint64, error) {
	row := new(BiddingTable)
	result := db.Where("peon_id = ? AND bidding_address = ?", peonId, address).First(row)
	return row.BiddingAmount, result.Error
}

func SetPeonOwner(db *gorm.DB, peonId uint, owner string) error {
	rows, err := db.Where("peon_id = ?", peonId).Rows()
	if err != nil {
		return err
	}
	if rows.Next() {
		db.Where("peon_id = ?", peonId).Update("owner_address", owner)
	} else {
		db.Create(&PeonOwnerTable{
			PeonId:       peonId,
			OwnerAddress: owner,
		})
	}
	return nil
}

func updateCheckpoint(db *gorm.DB, blockNumber uint64) error {
	result := db.Save(&AppConfig{
		Name:  "block_number",
		Value: strconv.FormatUint(blockNumber, 10),
	})
	return result.Error
}

func createCheckpoint(db *gorm.DB, blockNumber uint64) error {
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

type BidEvent struct {
	PeonId uint
	Buyer  common.Address
	Amount *big.Int
}

type AcceptBidEvent struct {
	PeonId uint
	Buyer  common.Address
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

type AppConfig struct {
	Name  string `gorm:"primaryKey"`
	Value string
}

type BiddingTable struct {
	PeonId         uint   `gorm:"primaryKey"`
	BiddingAddress string `gorm:"primaryKey"`
	BiddingAmount  uint64
	CreatedAt      time.Time
}

type TransferLogTable struct {
	TransactionId string `gorm:"primaryKey"`
	PeonId        uint   `gorm:"primaryKey"`
	FromAddress   string
	BlockNumber   uint64 `gorm:"index"`
	ToAddress     string `gorm:"index"`
	CreatedAt     time.Time
}

type PeonOwnerTable struct {
	PeonId       uint   `gorm:"primaryKey"`
	OwnerAddress string `gorm:"primaryKey"`
}

type PurchaseTable struct {
	Id          uint `gorm:"primaryKey"`
	PeonId      uint
	FromAddress string
	ToAddress   string
	Value       uint64
	CreatedAt   time.Time
}

type Peon struct {
	PeonId        uint
	Owner         string
	Transfers     []PeonTransfer
	Purchases     []PeonPurchase
	Bids          []PeonBid
	TransferredAt time.Time
	CreatedAt     time.Time
}

type PeonTransfer struct {
	From string
	To   string
}

type PeonPurchase struct {
	From  string
	To    string
	Value uint64
}

type PeonBid struct {
	Buyer string
	Value uint64
}

type PeonCountDto struct {
	peons uint
}

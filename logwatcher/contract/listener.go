package contract

import (
	"com.peon/logwatcher/clock"
	"com.peon/logwatcher/repositories"
	"context"
	"errors"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
	"math"
	"math/big"
	"time"
)

var (
	bidEventHash        = crypto.Keccak256Hash([]byte("BidEvent(uint256,address,uint256)"))
	acceptEventHash     = crypto.Keccak256Hash([]byte("AcceptBidEvent(uint256,address)"))
	cancelEventHash     = crypto.Keccak256Hash([]byte("CancelEvent(uint256,address)"))
	transferEventHash   = crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)"))
	peonMintedEventHash = crypto.Keccak256Hash([]byte("PeonMintedEvent(uint256,uint256)"))
)

func ListenToEvents(db *gorm.DB, client *ethclient.Client, addressToListen string, startBlock uint64) {
	contractAddress := common.HexToAddress(addressToListen)

	logrus.Infof("watching bidEventHash: %s", bidEventHash)
	logrus.Infof("watching acceptEventHash: %s", acceptEventHash)
	logrus.Infof("watching cancelEventHash: %s", cancelEventHash)
	logrus.Infof("watching transferEventHash: %s", transferEventHash)
	logrus.Infof("watching peonMintedEventHash: %s", peonMintedEventHash)
	logrus.Infof("Listen to event at %s", bidEventHash)
	for {
		err := db.Transaction(func(tx *gorm.DB) error {
			err := listenToBlock(db, client, startBlock, contractAddress)
			if err != nil {
				time.Sleep(15 * time.Second)
			}
			return err
		})
		if err != nil {
			logrus.Error("error while doing transaction")
		}
	}
}

func listenToBlock(db *gorm.DB, client *ethclient.Client, startBlock uint64, contractAddress common.Address) error {
	checkpoint, toCheckpoint, err := getFetchCheckpoint(db, client, startBlock)
	if err != nil {
		logrus.Error("unable to fetch checkpoint: ", err)
		return err
	} else {
		logrus.Infof("fetching from block number %d to %d", checkpoint+1, toCheckpoint)
		vLogs, err := client.FilterLogs(context.Background(), ethereum.FilterQuery{
			FromBlock: big.NewInt(int64(checkpoint + 1)),
			ToBlock:   big.NewInt(int64(toCheckpoint)),
			Addresses: []common.Address{contractAddress},
		})
		if err != nil {
			logrus.Error(err)
			return err
		} else {
			logrus.Infof("found %d logs", len(vLogs))
			for _, vLog := range vLogs {
				err := readLog(db, vLog)
				if err != nil {
					return err
				}
			}
			err := repositories.UpdateCheckpoint(db, toCheckpoint)
			if err != nil {
				logrus.Errorf("Unable to save checkpoint %d: %#v", toCheckpoint, err)
				return err
			}
			return nil
		}
	}
}

func getFetchCheckpoint(db *gorm.DB, client *ethclient.Client, startBlock uint64) (uint64, uint64, error) {
	lastCheckpoint, err := repositories.GetLastCheckpoint(db, startBlock)
	if err != nil {
		logrus.Error("Unable get last block number from db")
		return 0, 0, err
	}
	logrus.Info("found cached checkpoint ", lastCheckpoint)
	onchainCheckpoint, err := client.BlockNumber(context.Background())
	if err != nil {
		logrus.Error("Unable get last block number from onchain")
		return 0, 0, err
	}
	logrus.Info("found onchain checkpoint ", onchainCheckpoint)
	if lastCheckpoint >= onchainCheckpoint {
		return 0, 0, errors.New("already on latest block number")
	}
	var checkpoint uint64
	if lastCheckpoint == 0 {
		checkpoint = startBlock
		err = repositories.CreateCheckpoint(db, startBlock)
		if err != nil {
			logrus.Errorf("Unable to save checkpoint %d", startBlock)
		}
	} else {
		checkpoint = lastCheckpoint
	}
	toBlock := uint64(math.Min(float64(onchainCheckpoint), 252)) // 1 hour batch per fetch
	return checkpoint, toBlock, err
}

func readLog(db *gorm.DB, vLog types.Log) error {
	topicHex := vLog.Topics[0].Hex()
	switch topicHex {
	case bidEventHash.Hex():
		event := &BidEvent{
			PeonId: uint(vLog.Topics[1].Big().Int64()),
			Buyer:  common.HexToAddress(vLog.Topics[2].Hex()),
			Amount: vLog.Topics[3].Big(),
		}
		logrus.Infof("BidEvent: %#v", event)
		_, err := repositories.InsertBidding(db, &repositories.BiddingTable{
			PeonId:         event.PeonId,
			BiddingAddress: event.Buyer.String(),
			BiddingAmount:  event.Amount.Uint64(),
			CreatedAt:      clock.Now(),
		})
		if err != nil {
			logrus.Errorf("Unable to save event %#v: %#v", event, err)
			return err
		}
		return nil
	case peonMintedEventHash.Hex():
		event := &PeonMintedEvent{
			PeonId:     uint(vLog.Topics[1].Big().Uint64()),
			Efficiency: uint(vLog.Topics[2].Big().Uint64()),
		}
		logrus.Infof("PeonMintedEvent: %#v", event)
		err := repositories.SetPeonEff(db, event.PeonId, event.Efficiency)
		if err != nil {
			logrus.Errorf("Unable to save peon efficiency %#v: %#v", event, err)
			return err
		}
		return nil
	case acceptEventHash.Hex():
		event := &AcceptBidEvent{
			PeonId: uint(vLog.Topics[1].Big().Int64()),
			Buyer:  common.HexToAddress(vLog.Topics[2].Hex()),
		}
		logrus.Infof("AcceptBidEvent: %#v", event)

		value, err := repositories.GetBidValue(db, event.PeonId, event.Buyer.String())
		if err != nil {
			logrus.Errorf("Unable to find bid value %#v: %#v", event, err)
			return err
		} else {
			err := repositories.DeleteBidding(db, event.PeonId, event.Buyer.String())
			if err != nil {
				logrus.Errorf("Unable to save event %#v: %#v", event, err)
				return err
			}
			ownerAddress, err := repositories.GetOwnerOfPeon(db, event.PeonId)
			if err != nil {
				logrus.Errorf("Unable to find owner %#v: %#v", event, err)
				return err
			} else {
				_, err := repositories.InsertPurchase(db, &repositories.PurchaseTable{
					PeonId:      event.PeonId,
					FromAddress: ownerAddress.OwnerAddress,
					ToAddress:   event.Buyer.String(),
					Value:       value,
					CreatedAt:   clock.Now(),
				})
				if err != nil {
					logrus.Errorf("Unable to insert new purchase %#v: %#v", event, err)
					return err
				}
			}
		}
		return nil
	case cancelEventHash.Hex():
		event := &CancelEvent{
			PeonId: uint(vLog.Topics[1].Big().Int64()),
			Buyer:  common.HexToAddress(vLog.Topics[2].Hex()),
		}
		logrus.Infof("CancelEvent: %#v", event)
		err := repositories.DeleteBidding(db, event.PeonId, event.Buyer.String())
		if err != nil {
			logrus.Errorf("Unable to save event %#v: %#v", event, err)
			return err
		}
		return nil
	case transferEventHash.Hex():
		event := &TransferEvent{
			From:    common.HexToAddress(vLog.Topics[1].Hex()),
			To:      common.HexToAddress(vLog.Topics[2].Hex()),
			TokenId: uint(vLog.Topics[3].Big().Int64()),
		}
		logrus.Infof("TransferEvent: %#v", event)
		_, err := repositories.InsertTransferLog(db, &repositories.TransferLogTable{
			TransactionId: vLog.TxHash.String(),
			BlockNumber:   vLog.BlockNumber,
			PeonId:        event.TokenId,
			FromAddress:   event.From.String(),
			ToAddress:     event.To.String(),
			CreatedAt:     clock.Now(),
		})
		if err != nil {
			logrus.Errorf("Unable to save event %#v: %#v", event, err)
			return err
		}
		err = repositories.SetPeonOwner(db, event.TokenId, event.To.String())
		if err != nil {
			logrus.Errorf("Unable to update new owner %#v: %#v", event, err)
			return err
		}
		return nil
	default:
		logrus.Infof("Unknown even: %s", topicHex)
		return nil
	}
}

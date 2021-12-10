package contract

import (
	"com.peon/logwatcher/clock"
	"com.peon/logwatcher/repositories"
	"context"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
	"time"
)

func ListenToEvents(db *gorm.DB, client *ethclient.Client, addressToListen string) {
	contractAddress := common.HexToAddress(addressToListen)
	lastCheckpoint, err := repositories.GetLastCheckpoint(db)
	var checkpoint uint64 = 0
	if err != nil || lastCheckpoint == 0 {
		ck, err := client.BlockNumber(context.Background())
		if err != nil {
			panic("Unable get last block number")
		}
		checkpoint = ck
		err = repositories.CreateCheckpoint(db, ck)
		if err != nil {
			logrus.Errorf("Unable to save checkpoint %d", ck)
		}
	} else {
		checkpoint = lastCheckpoint
	}

	logrus.Infof("Listening from block number %d", checkpoint)
	query := ethereum.FilterQuery{
		//FromBlock: big.NewInt(int64(checkpoint)),
		//ToBlock:   nil,
		Addresses: []common.Address{contractAddress},
	}
	logChannel := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logChannel)
	if err != nil {
		panic(err)
	}
	bidEventHash := crypto.Keccak256Hash([]byte("BidEvent(uint256,address)"))
	logrus.Infof("watching bidEventHash: %s", bidEventHash)
	acceptEventHash := crypto.Keccak256Hash([]byte("AcceptBidEvent(uint256,address)"))
	logrus.Infof("watching acceptEventHash: %s", acceptEventHash)
	cancelEventHash := crypto.Keccak256Hash([]byte("CancelEvent(uint256,address)"))
	logrus.Infof("watching cancelEventHash: %s", cancelEventHash)
	transferEventHash := crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)"))
	logrus.Infof("watching transferEventHash: %s", transferEventHash)
	peonMintedEventHash := crypto.Keccak256Hash([]byte("PeonMintedEvent(uint256,uint256)"))
	logrus.Infof("watching peonMintedEventHash: %s", peonMintedEventHash)
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
				logrus.Infof("BidEvent: %#v: %#v", event, err)
				_, err := repositories.InsertBidding(db, &repositories.BiddingTable{
					PeonId:         event.PeonId,
					BiddingAddress: event.Buyer.String(),
					BiddingAmount:  event.Amount.Uint64(),
					CreatedAt:      clock.Now(),
				})
				if err != nil {
					logrus.Errorf("Unable to save event %#v: %#v", event, err)
				}
			case peonMintedEventHash.Hex():
				event := &PeonMintedEvent{
					PeonId:     uint(vLog.Topics[1].Big().Uint64()),
					Efficiency: uint(vLog.Topics[2].Big().Uint64()),
				}
				logrus.Infof("PeonMintedEvent: %#v: %#v", event, err)
				err := repositories.SetPeonEff(db, event.PeonId, event.Efficiency)
				if err != nil {
					logrus.Errorf("Unable to save peon efficiency %#v: %#v", event, err)
				}
			case acceptEventHash.Hex():
				event := &AcceptBidEvent{
					PeonId: uint(vLog.Topics[1].Big().Int64()),
					Buyer:  common.HexToAddress(vLog.Topics[2].Hex()),
				}
				logrus.Infof("AcceptBidEvent: %#v: %#v", event, err)
				err := repositories.DeleteBidding(db, event.PeonId, event.Buyer.String())
				if err != nil {
					logrus.Errorf("Unable to save event %#v: %#v", event, err)
				}
				ownerAddress, err := repositories.GetOwnerOfPeon(db, event.PeonId)
				if err != nil {
					logrus.Errorf("Unable to find owner %#v: %#v", event, err)
				} else {
					value, err := repositories.GetBidValue(db, event.PeonId, event.Buyer.String())
					if err != nil {
						logrus.Errorf("Unable to find bid value %#v: %#v", event, err)
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
						}
					}
				}
			case cancelEventHash.Hex():
				event := &CancelEvent{
					PeonId: uint(vLog.Topics[1].Big().Int64()),
					Buyer:  common.HexToAddress(vLog.Topics[2].Hex()),
				}
				logrus.Infof("CancelEvent: %#v\n", event)
				err := repositories.DeleteBidding(db, event.PeonId, event.Buyer.String())
				if err != nil {
					logrus.Errorf("Unable to save event %#v: %#v", event, err)
				}
			case transferEventHash.Hex():
				event := &TransferEvent{
					From:    common.HexToAddress(vLog.Topics[1].Hex()),
					To:      common.HexToAddress(vLog.Topics[2].Hex()),
					TokenId: uint(vLog.Topics[3].Big().Int64()),
				}
				logrus.Infof("TransferEvent: %#v: %#v", event, err)
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
				}
				err = repositories.SetPeonOwner(db, event.TokenId, event.To.String())
				if err != nil {
					logrus.Errorf("Unable to update new owner %#v: %#v", event, err)
				}
			default:
				logrus.Infof("Unknown even: %s: %#v", topicHex, err)
			}
			err := repositories.UpdateCheckpoint(db, vLog.BlockNumber)
			if err != nil {
				logrus.Errorf("Unable to save checkpoint %d: %#v", vLog.BlockNumber, err)
			}
		default:
			time.Sleep(15 * time.Second)
			ck, err := client.BlockNumber(context.Background())
			if err != nil {
				logrus.Error("Unable get last block number: %#v", err)
			}
			err = repositories.UpdateCheckpoint(db, ck)
			if err != nil {
				logrus.Errorf("Unable to save checkpoint %d: %#v", ck, err)
			}
		}
	}
}

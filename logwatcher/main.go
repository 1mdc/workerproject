package main

import (
	"com.peon/logwatcher/api"
	"com.peon/logwatcher/contract"
	"com.peon/logwatcher/dbconnection"
	"com.peon/logwatcher/repositories"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/sirupsen/logrus"
)

func main() {
	client, err := ethclient.Dial("ws://localhost:8545")
	db, err := dbconnection.GetDbConnection()
	if err != nil {
		panic(err)
	}
	err = db.AutoMigrate(&repositories.AppConfig{}, &repositories.BiddingTable{}, &repositories.TransferLogTable{}, &repositories.PurchaseTable{}, &repositories.PeonOwnerTable{})
	if err != nil {
		logrus.Errorf("Unable to save migrate DB")
	}
	contractAddress := "0x800100C928eE467283D3B1c7a75f68f56B7899E5"
	go contract.ListenToEvents(db, client, contractAddress)
	api.RunServer(db)
}

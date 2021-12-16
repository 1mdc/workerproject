package main

import (
	"com.peon/logwatcher/api"
	"com.peon/logwatcher/contract"
	"com.peon/logwatcher/dbconnection"
	"com.peon/logwatcher/repositories"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/sirupsen/logrus"
	"os"
)

func main() {
	client, err := ethclient.Dial("http://localhost:8545")
	db, err := dbconnection.GetDbConnection()
	if err != nil {
		panic(err)
	}
	err = db.AutoMigrate(&repositories.AppConfig{}, &repositories.BiddingTable{}, &repositories.TransferLogTable{}, &repositories.PurchaseTable{}, &repositories.PeonOwnerTable{})
	if err != nil {
		logrus.Errorf("Unable to save migrate DB")
	}
	contractAddress := os.Getenv("PEON_ADDRESS")
	go contract.ListenToEvents(db, client, contractAddress, 0)
	api.RunServer(db)
}

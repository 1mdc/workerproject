package main

import (
	"com.peon/logwatcher/api"
	"com.peon/logwatcher/contract"
	"com.peon/logwatcher/dbconnection"
	"com.peon/logwatcher/repositories"
	"embed"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/sirupsen/logrus"
	"io/fs"
	"log"
	"os"
	"strconv"
)

//go:embed build
var reactRootFolder embed.FS

func main() {
	appPort := getAppPort()
	contractAddress := os.Getenv("PEON_ADDRESS")
	if contractAddress == "" {
		panic("PEON_ADDRESS is not found")
	}
	networkRpc := os.Getenv("NETWORK_RPC_ENDPOINT")
	if networkRpc == "" {
		panic("NETWORK_RPC_ENDPOINT is not found")
	}
	startBlockNumberStr, err := strconv.Atoi(os.Getenv("START_BLOCK_NUMBER"))
	if err != nil {
		panic(err)
	}
	startBlockNumber := uint64(startBlockNumberStr)
	listenIntervalStr, err := strconv.Atoi(os.Getenv("LISTEN_INTERVAL"))
	if err != nil {
		panic(err)
	}
	listenInterval := uint(listenIntervalStr)
	client, err := ethclient.Dial(networkRpc)
	dbConnectionString := os.Getenv("DB_CONNECTION")
	if dbConnectionString == "" {
		panic("DB_CONNECTION is not found")
	}
	db, err := dbconnection.GetDbConnection(dbConnectionString)
	if err != nil {
		panic(err)
	}
	err = db.AutoMigrate(&repositories.AppConfig{}, &repositories.BiddingTable{}, &repositories.TransferLogTable{}, &repositories.PurchaseTable{}, &repositories.PeonOwnerTable{})
	if err != nil {
		logrus.Errorf("Unable to save migrate DB")
	}
	batchSizeStr, err := strconv.Atoi(os.Getenv("BATCH_SIZE"))
	if err != nil {
		panic(err)
	}
	batchSize := uint64(batchSizeStr)
	go contract.ListenToEvents(db, client, contractAddress, startBlockNumber, listenInterval, batchSize)
	reactBuildFolder, err := fs.Sub(reactRootFolder, "build")
	if err != nil {
		log.Fatal(err)
	}
	api.RunServer(db, appPort, reactBuildFolder)
}

func getAppPort() uint {
	appPortStr := os.Getenv("PORT")
	if appPortStr == "" {
		return 8080
	} else {
		appPort, err := strconv.Atoi(appPortStr)
		if err != nil {
			panic(err)
		}
		return uint(appPort)
	}
}

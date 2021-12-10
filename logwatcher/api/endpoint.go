package api

import (
	"com.peon/logwatcher/repositories"
	ptypes "com.peon/logwatcher/types"
	"encoding/json"
	"errors"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
	"net/http"
	"os"
	"strconv"
)

func RunServer(db *gorm.DB) {
	router := mux.NewRouter()
	router.HandleFunc("/count-peons", func(w http.ResponseWriter, r *http.Request) {
		count, err := repositories.PeonCount(db)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error(err)
		} else {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(&ptypes.PeonCountDto{
				Peons: count,
			})
		}
	})
	router.HandleFunc("/bidding-peons/{address}", func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		address, exist := params["address"]
		if !exist {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error("Missing address parameter")
			return
		}
		biddings, err := repositories.GetBiddingsByAddress(db, address)
		peonIds := make([]uint, 0)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error(err)
			return
		}
		for _, bid := range biddings {
			peonIds = append(peonIds, bid.PeonId)
		}
		json.NewEncoder(w).Encode(peonIds)
	})
	router.HandleFunc("/owned-peons/{address}", func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		ownerAddress, exist := params["address"]
		if !exist {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error("Missing address parameter")
			return
		}
		peonIds, err := repositories.GetOwnedPeons(db, ownerAddress)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			logrus.Error(err)
			return
		}
		json.NewEncoder(w).Encode(peonIds)
	})
	router.HandleFunc("/peons", func(w http.ResponseWriter, r *http.Request) {
		newPeons, err := repositories.GetNewPeons(db)
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
		peon, err := repositories.GetPeon(db, uint(peonId))
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				w.WriteHeader(http.StatusNotFound)
				return
			} else {
				w.WriteHeader(http.StatusBadRequest)
				logrus.Error(err)
				return
			}
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
}

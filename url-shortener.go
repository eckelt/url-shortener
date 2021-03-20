package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"bytes"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

const CODE_LENGTH int = 4

func generateCode(n int) string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[r.Intn(len(letters))]
	}
	return string(b)
}

func generateCodeFrom(url string, length int) string {
	h := sha256.New()
	h.Write([]byte(url))
	return (hex.EncodeToString((h.Sum(nil)))[0:length])
}

func message(trigger string, token string, content string) {

	req := map[string]string{"value1": content, "value2": "", "value3": ""}
	jsonData, _ := json.Marshal(req)

	_, err := http.Post(fmt.Sprintf("https://maker.ifttt.com/trigger/%s/with/key/%s", trigger, token), "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println(err)
	}

}

func decodeHandler(response http.ResponseWriter, request *http.Request, db Database) {
	code := mux.Vars(request)["code"]
	url, err := db.Get(code)
	if err != nil {
		http.Error(response, `{"error": "No such URL"}`, http.StatusNotFound)
		return
	}

	http.Redirect(response, request, url, http.StatusPermanentRedirect)
}

func encodeHandler(response http.ResponseWriter, request *http.Request, db Database, baseURL string) {
	decoder := json.NewDecoder(request.Body)
	var data struct {
		URL  string `json:"url"`
		Code string `json:"code"`
	}
	err := decoder.Decode(&data)
	if err != nil {
		http.Error(response, `{"error": "Unable to parse json"}`, http.StatusBadRequest)
		return
	}

	if !govalidator.IsURL(data.URL) {
		http.Error(response, `{"error": "Not a valid URL"}`, http.StatusBadRequest)
		return
	}

	if len(data.Code) < 2 {
		data.Code = generateCodeFrom(data.URL, CODE_LENGTH)
	}

	_, code, err := db.Save(data.URL, data.Code)
	if err != nil {
		log.Println(err)
		return
	}

	resp := map[string]string{"url": baseURL + code, "code": code, "error": ""}
	jsonData, _ := json.Marshal(resp)
	response.Write(jsonData)

}

func main() {

	if os.Getenv("BASE_URL") == "" {
		log.Fatal("BASE_URL environment variable must be set")
	}
	if os.Getenv("DB_PATH") == "" {
		log.Fatal("DB_PATH environment variable must be set")
	}
	db := sqlite{Path: path.Join(os.Getenv("DB_PATH"), "db.sqlite")}
	db.Init()

	baseURL := os.Getenv("BASE_URL")

	trigger := os.Getenv("TRIGGER")
	token := os.Getenv("TOKEN")
	if trigger ==  "" || token == "" {
		log.Println("TOKEN or TRIGGER not found in ENV. No notifiations will be sent.")
	} else {
		log.Println("Send startup notification" + token + trigger)
		message(trigger, token, "URL-Shortener started")
	}

	r := mux.NewRouter()
	r.HandleFunc("/save",
		func(response http.ResponseWriter, request *http.Request) {
			encodeHandler(response, request, db, baseURL)
		}).Methods("POST")
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("public"))))
	r.HandleFunc("/{code}", func(response http.ResponseWriter, request *http.Request) {
		trigger := os.Getenv("TRIGGER")
		token := os.Getenv("TOKEN")
		code := mux.Vars(request)["code"]
		if trigger ==  "" || token == "" {
			log.Println("TOKEN or TRIGGER not found in ENV. No notifiations will be sent.")
		} else {
			message(trigger, token, code)
		}

		decodeHandler(response, request, db)
	})
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("public")))
	log.Println("Starting url-shortener on port :1337")
	log.Fatal(http.ListenAndServe(":1337", handlers.LoggingHandler(os.Stdout, r)))
}

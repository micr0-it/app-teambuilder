import { loadPlayers, savePlayers } from "./storage.js";
import { Player } from "./Models/Player.js";
import { TeamBuilder } from "./Models/TeamBuilder.js";

const rosterList = document.querySelector("#rosterList");

const btnBuild = document.querySelector("#btnBuild");
const btnSavePlyr = document.querySelector("#btnSavePlayer");
const selectedCountEl = document.querySelector("#selectedCount");
const buildHint = document.querySelector("#buildHint");
const ratingInput = document.querySelector("#rngRating");
const ratingOutput = document.querySelector("#ratingValue");
const playerForm = document.querySelector("#playerForm");
const nameInput = document.querySelector("#txtName");
const selectPosition = document.querySelector("#selPosition");
const algoTabs = document.querySelector(".algo-tabs");


const POSITION_LABELS = { GK: "KL", DEF: "DF", MID: "OS", FWD: "FV" };
const MATCH_SIZE = 12;   //6'ya 6:

runEvents();

let players = await loadPlayers();

let selectedPlayerId; //edit fonksiyon kontrolü için lazım,
let matchPlayers = [];
//let snakeTeam1, snakeTeam2, bestTeam1, bestTeam2; bunları tek bir objede tutacagım
let results = {};
let activeAlgo = "best";
function runEvents() {
    document.addEventListener("DOMContentLoaded", showRosterUI);
    rosterList.addEventListener("change", updateSelectionUI);
    rosterList.addEventListener("click", removePlayer);
    rosterList.addEventListener("click", editPlayer);
    ratingInput.addEventListener("input", changeRating);
    playerForm.addEventListener("submit", addPlayer);
    btnBuild.addEventListener("click", createTeams);
    algoTabs.addEventListener("click", snakeOrBest);
}


function createTeams() {
    const checkedBox = rosterList.querySelectorAll("input:checked");
    
    const checkedBoxes  = [...checkedBox];
    //işaretli checkbox'ları oyuncu nesnelerine çevir
    
    /**
     * map her checkbox için fonksiyonu bir kere çalıştırır 
     * ve fonksiyonun return ettiği değerlerden yeni bir dizi oluşturur. 
     * 12 checkbox girer, 12 oyuncu çıkar.
     * return’ü unutursan dizi 12 tane undefined ile dolar.
     */
    matchPlayers = checkedBoxes.map(function (checkbox) {
    const rosterLi = checkbox.closest(".roster-item");               //1) satırına çık
    const playerId = Number(rosterLi.dataset.id);                    //2) id'yi sayı olarak oku
    return players.find(player => player.id === playerId);           //3) oyuncuyu bul ve döndür
});

    console.log(matchPlayers[0]); 
    const goalkeepers = matchPlayers.filter((player) => player.position === "GK");
    console.log(goalkeepers);
    
    if (goalkeepers.length === 2) {
        buildTeams(goalkeepers,matchPlayers);
    }
    
}

//SEKME TIKLAMASI: sadece tıklamayı karşılar, ekranı showResults günceller
function snakeOrBest(e) {
    
    const tab = e.target.closest(".algo-tab");
    if (!tab) {
        return;   //sekmelerin arasındaki boşluğa tıklandı
    }

    //anahtarlar data-algo ile aynı olduğu için if'e gerek yok: "snake" ya da "best"
    activeAlgo = tab.dataset.algo;

    showResults();
}

function buildTeams(goalkeepers,e) {
    const teamBuilder = new TeamBuilder(matchPlayers,goalkeepers); //jste ctora verılen parametre sıraları onemlı
    const best = teamBuilder.buildBestOfAll();
    const snake = teamBuilder.buildSnakeDraft();
    // [snakeTeam1,snakeTeam2]= snake;
    // [bestTeam1,bestTeam2]= best;
    /**
     * results.snake = ...: Objeye yeni bir anahtar ekleyip ona değer atıyor. 
     * Anahtar yoksa oluşturuyor, varsa üzerine yazıyor. 
     * Kullanıcı “Takımları kur”a ikinci kez bastığında eski sonuçlar yenileriyle değişir.
     */
    
    results.snake = teamBuilder.buildSnakeDraft();
    results.best = teamBuilder.buildBestOfAll();
    showResults(); 
}



//Şimdi forma kişi ekleme kısmı gelecek.
//Eventi butona değil forma baglayacagız kullanıcı enter kullanırsa da form post olsun
//preventDefault ile sayfa yenilemesinin önüne gececeğiz


//Oyuncu Güncelleme Kısmı UI VE STORAGE
//Burada butona bastık ve edite girdik
//Forma iki tane aksiyon bağlı form bunun edit veya add oldugunu anlaması ıcın
//Id tanımladık let tıklanınca ıd degıskenıne atama yaptık
//Buradaki fonksiyon forma bilgileri doldurdu
//Kaydete basınca aslında ekleme fonksiyonu üzerinden submit olacak orada da eğer
//let ile tanımlı id değişkeninde veri varsa guncelleme kısmı calısacak
function editPlayer(e) {
    const editButton = e.target.closest(".btn-edit");
    if(editButton){
        const rosterLi = editButton.closest(".roster-item");
        const selectedPlayer = players.find((player) => player.id === Number(rosterLi.dataset.id));
        nameInput.value = selectedPlayer.name;
        selectPosition.value = selectedPlayer.position;
        ratingOutput.value = selectedPlayer.rating;
        ratingInput.value = selectedPlayer.rating;
        
        selectedPlayerId = selectedPlayer.id;
        playerForm.classList.add("is-editing");
        btnSavePlyr.textContent = "Kaydet";
    }
}

//Oyuncu Silme Kısmı UI VE STORAGE

function removePlayer(e) {
    const deleteButton = e.target.closest(".btn-delete");
    if (deleteButton) {
        
        const rosterLi = deleteButton.closest(".roster-item");
        /**
         * “Düzenlerken aynı oyuncu silinirse” durumu henüz ele alınmamış. 
         * Şunu dene: bir oyuncunun kalemine bas, sonra aynı oyuncunun çöp kutusuna bas, sonra “Kaydet”e bas. 
         * rosterLi bulunamayacağı için null.querySelector hatası alırsın.
         *  removePlayer’da, silinen oyuncunun id’si selectedPlayerId’ye eşitse resetForm’u çağırman yeterli.
         */

        if (Number(rosterLi.dataset.id) === selectedPlayerId) {
            resetForm();
        }

        //Burada Storage'den sileceğiz bize value değer lazım bunu da rosterLi'teki id alarak yapalım
        removePlayerStorage(Number(rosterLi.dataset.id));
        rosterLi.remove();
        updateSelectionUI();
    }
}
function removePlayerStorage(playerId) {
    const index = players.findIndex(function(player) {
        return player.id === playerId;
    });

    if(index !== -1){
        
        players.splice(index,1)
        savePlayers(players);
    }

}
// Oyuncu Ekleme Kısmı UI / STORAGE /
function addPlayer(e){
    
    e.preventDefault(); //Submit farklı bir sayfaya yönlendirmesin diye yaptık. En başa aldık, aşağıda hata olsa bile sayfa yenilenmesin
    const inputText = nameInput.value.trim();
    const playerPosition= selectPosition.value;
    const playerRating = Number(ratingInput.value); 
    
    if (inputText===""){
        alert("Oyuncu bilgilerini eksiksiz doldurun");
        return;
    }


    if(selectedPlayerId!==null){
        
        //storage guncelleme
    
        const selectedPlayer = players.find((player) => player.id === selectedPlayerId);
        selectedPlayer.name = inputText;
        selectedPlayer.position= playerPosition;
        selectedPlayer.rating = playerRating; 
        savePlayers(players);



        //ui güncelleme
        //a) güncellenecek satırı id'sinden bul
        const rosterLi = rosterList.querySelector(`.roster-item[data-id="${selectedPlayerId}"]`);

        //b) satırın içindeki üç elemanı yeni değerlerle güncelle
        rosterLi.querySelector(".pick-name").textContent = selectedPlayer.name;
        rosterLi.querySelector(".pick-rating").textContent = selectedPlayer.rating;

        const spanPosition = rosterLi.querySelector(".pos");
        spanPosition.textContent = POSITION_LABELS[selectedPlayer.position];   //ekranda görünen: "DF"
        spanPosition.dataset.pos = selectedPlayer.position;                    //rengi belirleyen: "DEF"
    }


    else{
        const newPlayer = new Player(Date.now(),inputText,playerPosition,playerRating);
        //Storage ekleme
        players.push(newPlayer);
        savePlayers(players);
        //UI Ekleme
        addRosterHTMLElement(newPlayer);
        //Seçili kişilerin güncellenmesi
        updateSelectionUI();
    }
    resetForm();
    
}

function addRosterHTMLElement(player) {
//     <li class="roster-item" data-id="3">
//                     <label class="pick">
//                         <input type="checkbox" checked>
//                         <span class="pos" data-pos="GK">KL</span>
//                         <span class="pick-name">Tolga</span>
//                         <span class="pick-rating">6</span>
//                     </label>
//                     <button type="button" class="icon-btn btn-edit" aria-label="Tolga'yı düzenle"><i class="fa-solid fa-pen"></i></button>
//                     <button type="button" class="icon-btn btn-delete" aria-label="Tolga'yı sil"><i class="fa-solid fa-trash-can"></i></button>
//    </li>

   
    const li = document.createElement("li");
    li.className = "roster-item";
    li.dataset.id = player.id;
    const label = document.createElement("label");
    label.className = "pick";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const spanPosition = document.createElement("span");
    spanPosition.className = "pos";
    spanPosition.dataset.pos = player.position;
    spanPosition.textContent = POSITION_LABELS[player.position];
    const spanName = document.createElement("span");
    spanName.className = "pick-name";
    spanName.textContent = player.name;
    const spanRating = document.createElement("span");
    spanRating.className = "pick-rating";
    spanRating.textContent = player.rating;
    const editButton  = document.createElement("button");
    editButton.type = "button";
    editButton.className = "icon-btn btn-edit";
    editButton.ariaLabel=`${player.name} kişisini düzenle`;
    const iEdit = document.createElement("i");
    iEdit.className = "fa-solid fa-pen";
    const clearButton  = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "icon-btn btn-delete";
    clearButton.ariaLabel=`${player.name} kişisini sil`;
    const iClear = document.createElement("i");
    iClear.className = "fa-solid fa-trash-can";
    editButton.appendChild(iEdit);
    clearButton.appendChild(iClear);
    label.appendChild(checkbox); 
    label.appendChild(spanPosition);
    label.appendChild(spanName);
    label.appendChild(spanRating);

    li.appendChild(label);
    li.appendChild(editButton);
    li.appendChild(clearButton);

    rosterList.appendChild(li);

}

//Gösterim Kısmı UI
function updateSelectionUI() {
    //işaretli checkbox sayısı
    const selectedCount = rosterList.querySelectorAll("input:checked").length;
    
    //sayaç: "9 / 12 seçildi"
    selectedCountEl.innerHTML = `<strong>${selectedCount}</strong> / ${MATCH_SIZE} seçildi`;
    selectedCountEl.classList.toggle("is-ready", selectedCount === MATCH_SIZE);

    //buton: sadece tam 12'de aktif
    btnBuild.disabled = selectedCount !== MATCH_SIZE;

    //ipucu yazısı
    if (selectedCount < MATCH_SIZE) {
        buildHint.textContent = `Takım kurmak için ${MATCH_SIZE - selectedCount} oyuncu daha seç.`;
    } else if (selectedCount > MATCH_SIZE) {
        buildHint.textContent = `${selectedCount - MATCH_SIZE} oyuncu fazla. Bugün gelmeyenlerin işaretini kaldır.`;
    } else {
        buildHint.textContent = "";   //boşken CSS gizler (.hint:empty)
    }
}

function showRosterUI() {
    rosterList.innerHTML = ""; //HTML'deki örnek oyuncuları temizle
    players.forEach(player => addRosterHTMLElement(player));
    updateSelectionUI();   //başlangıç durumu: "0 / 12 seçildi"
    
}

//EKRANI GÜNCELLER: e almaz, hem buildTeams'ten hem sekmeden çağrılır
function showResults() {
    //henüz takım kurulmadıysa gösterecek bir şey yok
    if (!results[activeAlgo]) {
        return;
    }

    //sekmelerin görünümü: seçili olana is-active, diğerinden kaldır
    algoTabs.querySelectorAll(".algo-tab").forEach(function (tab) {
        const isActive = tab.dataset.algo === activeAlgo;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive);   //ekran okuyucular için
    });

    //seçili algoritmanın takımları
    const [teamA, teamB] = results[activeAlgo];
    console.log(activeAlgo, teamA, teamB);

    //sonraki adımlar: sahayı çiz, toplamları ve karşılaştırma tablosunu doldur
}

//Yardımcı Fonksiyonlar
function changeRating(e) {
    //output html elementinin value özelliği textContent ile aynı şey.
    ratingOutput.value = e.target.value;
}


function resetForm() {
    selectedPlayerId = null;
    playerForm.reset();
    playerForm.classList.remove("is-editing");
    btnSavePlyr.textContent = "Ekle";
}
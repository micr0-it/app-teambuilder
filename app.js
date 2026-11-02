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



const POSITION_LABELS = { GK: "KL", DEF: "DF", MID: "OS", FWD: "FV" };
const MATCH_SIZE = 12;   //6'ya 6:

runEvents();

let players = await loadPlayers();




function runEvents() {
    document.addEventListener("DOMContentLoaded", showRosterUI);
    rosterList.addEventListener("change", updateSelectionUI);
    rosterList.addEventListener("click", removePlayer);
    ratingInput.addEventListener("input", changeRating);
    playerForm.addEventListener("submit", addPlayer);
}



//Şimdi forma kişi ekleme kısmı gelecek.
//Eventi butona değil forma baglayacagız kullanıcı enter kullanırsa da form post olsun
//preventDefault ile sayfa yenilemesinin önüne gececeğiz


//Oyuncu Silme Kısmı UI VE STORAGE

function removePlayer(e) {
    const deleteButton = e.target.closest(".btn-delete");
    if (deleteButton) {
        const rosterLi = deleteButton.closest(".roster-item");
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

    if(index != -1){
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
        nameInput.value="";
    }
    
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



//Yardımcı Fonksiyonlar
function changeRating(e) {
    //output html elementinin value özelliği textContent ile aynı şey.
    ratingOutput.value = e.target.value;
}



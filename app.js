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


const POSITION_LABELS = { GK: "KL", DEF: "DF", MID: "OS", FWD: "FV" };
const MATCH_SIZE = 12;   //6'ya 6:

runEvents();

let players = await loadPlayers();




function runEvents() {
    document.addEventListener("DOMContentLoaded", showRosterUI);
    rosterList.addEventListener("change", updateSelectionUI);
    ratingInput.addEventListener("input", changeRating);
}



//Şimdi forma kişi ekleme kısmı gelecek.
//Eventi butona değil forma baglayacagız kullanıcı enter kullanırsa da form post olsun
//preventDefault ile sayfa yenilemesinin önüne gececeğiz


function changeRating(e) {
    //output html elementinin value özelliği textContent ile aynı şey.
    ratingOutput.value = e.target.value;
}



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
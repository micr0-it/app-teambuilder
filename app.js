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
const resultsSection = document.querySelector("#results");
const pitch = document.querySelector("#pitch");
const totalA = document.querySelector("#totalA");
const totalB = document.querySelector("#totalB");
const snakeDiffCell = document.querySelector("#snakeDiff");
const bestDiffCell = document.querySelector("#bestDiff");
const snakeOutCell = document.querySelector("#snakeOut");
const bestOutCell = document.querySelector("#bestOut");
const gkDialog = document.querySelector("#gkDialog");
const gkForm = document.querySelector("#gkForm");
const gkTitle = document.querySelector("#gkTitle");
const gkText = document.querySelector("#gkText");
const gkOptions = document.querySelector("#gkOptions");
const btnCancelGK = document.querySelector("#btnCancelGK");


const POSITION_LABELS = { GK: "KL", DEF: "DF", MID: "OS", FWD: "FV" };
const MATCH_SIZE = 12;   //6'ya 6:


let gkNeeded=null; //Kaç kişi seçilmesi gerekiyor (sayı).
let gkFixed = null; //Zaten kesin kaleci olanlar (dizi). Eksik durumunda listedeki gerçek kaleci, fazla durumunda boş dizi, çünkü orada hepsi seçimden geliyor.
let players = await loadPlayers();

let selectedPlayerId = null; //edit fonksiyon kontrolü için lazım,
let matchPlayers = [];
//let snakeTeam1, snakeTeam2, bestTeam1, bestTeam2; bunları tek bir objede tutacagım
let results = {};
let activeAlgo = "best";
runEvents();
function runEvents() {
    document.addEventListener("DOMContentLoaded", showRosterUI);
    rosterList.addEventListener("change", updateSelectionUI);
    rosterList.addEventListener("click", removePlayer);
    rosterList.addEventListener("click", editPlayer);
    ratingInput.addEventListener("input", changeRating);
    playerForm.addEventListener("submit", addPlayer);
    btnBuild.addEventListener("click", createTeams);
    algoTabs.addEventListener("click", snakeOrBest);
    gkForm.addEventListener("submit", confirmGoalkeepers);
    btnCancelGK.addEventListener("click", closeGkDialog);
}


function createTeams() {
    const checkedBox = rosterList.querySelectorAll("input:checked");

    const checkedBoxes = [...checkedBox];
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

    const goalkeepers = matchPlayers.filter((player) => player.position === "GK");
    console.log(goalkeepers);

    if (goalkeepers.length === 2) {
        buildTeams(goalkeepers);
    }
    else{
        openGkDialog(goalkeepers);
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

function buildTeams(goalkeepers) {
    const teamBuilder = new TeamBuilder(matchPlayers, goalkeepers); //jste ctora verılen parametre sıraları onemlı
    const best = teamBuilder.buildBestOfAll();
    const snake = teamBuilder.buildSnakeDraft();
    // [snakeTeam1,snakeTeam2]= snake;
    // [bestTeam1,bestTeam2]= best;
    /**
     * results.snake = ...: Objeye yeni bir anahtar ekleyip ona değer atıyor. 
     * Anahtar yoksa oluşturuyor, varsa üzerine yazıyor. 
     * Kullanıcı “Takımları kur”a ikinci kez bastığında eski sonuçlar yenileriyle değişir.
     */

    results.snake = snake;
    results.best = best;
    fillCompareTable();
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
    if (editButton) {
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
    const index = players.findIndex(function (player) {
        return player.id === playerId;
    });

    if (index !== -1) {

        players.splice(index, 1)
        savePlayers(players);
    }

}
// Oyuncu Ekleme Kısmı UI / STORAGE /
function addPlayer(e) {

    e.preventDefault(); //Submit farklı bir sayfaya yönlendirmesin diye yaptık. En başa aldık, aşağıda hata olsa bile sayfa yenilenmesin
    const inputText = nameInput.value.trim();
    const playerPosition = selectPosition.value;
    const playerRating = Number(ratingInput.value);

    if (inputText === "") {
        alert("Oyuncu bilgilerini eksiksiz doldurun");
        return;
    }


    if (selectedPlayerId !== null) {

        //storage guncelleme

        const selectedPlayer = players.find((player) => player.id === selectedPlayerId);
        selectedPlayer.name = inputText;
        selectedPlayer.position = playerPosition;
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


    else {
        const newPlayer = new Player(Date.now(), inputText, playerPosition, playerRating);
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
    const spanPosition = createPositionBadge(player.position);
    const spanName = document.createElement("span");
    spanName.className = "pick-name";
    spanName.textContent = player.name;
    const spanRating = document.createElement("span");
    spanRating.className = "pick-rating";
    spanRating.textContent = player.rating;
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "icon-btn btn-edit";
    editButton.ariaLabel = `${player.name} kişisini düzenle`;
    const iEdit = document.createElement("i");
    iEdit.className = "fa-solid fa-pen";
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "icon-btn btn-delete";
    clearButton.ariaLabel = `${player.name} kişisini sil`;
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
    // console.log(activeAlgo, teamA, teamB);

    const line = pitch.querySelectorAll(".line");
    //Bu olmazsa sekme değiştirdikçe çipler üst üste birikir.
    line.forEach(element => {
        element.innerHTML = ""
    });
    drawTeam(teamA, "A");
    drawTeam(teamB, "B");
    totalA.textContent = teamA.totalRating; // getter parantezsiz
    totalB.textContent = teamB.totalRating; // getter parantezsiz
    resultsSection.hidden = false;

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

//item => { player, slot }
function createChipItem(item) {
    const { player, slot, ...otherInfos } = item;
    const div = document.createElement("div");
    div.className = "chip";
    const spanRating = document.createElement("span");
    const spanName = document.createElement("span");
    spanRating.className = "chip-rating";
    spanRating.textContent = player.rating;
    spanName.className = "chip-name";
    spanName.textContent = player.name;
    
    div.appendChild(spanRating);
    div.appendChild(spanName);

    if (player.position !== slot) {
        div.classList.add("is-out");
        const spanChipNote = document.createElement("span");
        spanChipNote.className = "chip-note"
        spanChipNote.textContent = `${POSITION_LABELS[player.position]}→${POSITION_LABELS[slot]}`;
        div.appendChild(spanChipNote);
    }
    return div;
}

function drawTeam(team, letter) {
    //letter ya "A" ya "B" olacak.
    const half = pitch.querySelector(`.half[data-team="${letter}"]`);
    //lineup: [{ player, slot }, ...] -> her eleman bir oyuncu ve oynadığı yer
    team.lineup.forEach(function (item) {
        //pitch'te değil half'ta arıyoruz: yoksa hep A'nın hattı bulunur
        //slot'a göre: Deniz OS ama DF'de oynuyorsa DEF hattına gider
        const line = half.querySelector(`.line[data-line="${item.slot}"]`);

        //createChip çipi üretip döndürür, ekleme işini burada yapıyoruz
        line.appendChild(createChipItem(item));
    });
}

function fillCompareTable() {

    //her algoritmanın sonucu iki takımlık bir dizi: [A, B]
    const [snakeA, snakeB] = results.snake;
    const [bestA, bestB] = results.best;

    //puan farkı: hangi takım güçlü olursa olsun pozitif olsun diye Math.abs
    const snakeDiff = Math.abs(snakeA.totalRating - snakeB.totalRating);
    const bestDiff = Math.abs(bestA.totalRating - bestB.totalRating);

    //mevki dışı: iki takımdakilerin toplamı (getter -> parantez yok)
    const snakeOut = snakeA.outOfPositionCount + snakeB.outOfPositionCount;
    const bestOut = bestA.outOfPositionCount + bestB.outOfPositionCount;

    //sayıları hücrelere yaz
    snakeDiffCell.textContent = snakeDiff;
    bestDiffCell.textContent = bestDiff;
    snakeOutCell.textContent = snakeOut;
    bestOutCell.textContent = bestOut;

    //düşük olan daha iyi: koşul true ise is-better eklenir, false ise kaldırılır
    //eşitse ikisi de false -> hiçbiri vurgulanmaz
    snakeDiffCell.classList.toggle("is-better", snakeDiff < bestDiff);
    bestDiffCell.classList.toggle("is-better", bestDiff < snakeDiff);
    snakeOutCell.classList.toggle("is-better", snakeOut < bestOut);
    bestOutCell.classList.toggle("is-better", bestOut < snakeOut);

}

function openGkDialog(goalkeepers) {
    let candidates;
    if (goalkeepers.length<2) {
        gkNeeded = 2 - goalkeepers.length;
        gkFixed = goalkeepers;
        candidates = matchPlayers.filter(player => player.position !== "GK");
        gkTitle.textContent = "Kaleye kim geçecek?";
         if (goalkeepers.length === 0) {
            gkText.textContent = "Gelenler arasında kaleci yok. 2 oyuncu seç.";
        } else {
            gkText.textContent = `Sadece 1 kaleci var (${goalkeepers[0].name}). 1 oyuncu daha seç.`;
        }
    }
    else {
        //FAZLA: kalecilerden hangi ikisinin kalede oynayacağı seçilecek
        gkNeeded = 2;
        gkFixed = [];                        //kimse kesin değil, ikisi de seçimden gelecek
        candidates = goalkeepers;

        gkTitle.textContent = "Hangi ikisi kalede?";
        gkText.textContent = `${goalkeepers.length} kaleci var. Kalede oynayacak 2'sini seç, diğerleri sahada oynar.`;
    }
    //iki durumda da aynı: eski seçenekleri temizle, yenilerini ekle, aç
    gkOptions.innerHTML = "";   //yoksa her açılışta liste uzar
    candidates.forEach(player => addGkOption(player));

    gkDialog.showModal();
}

//mevki rozeti: <span class="pos" data-pos="DEF">DF</span>
//hem kadroda hem kaleci dialog'unda kullanılıyor -> üretir ve döndürür, eklemez
function createPositionBadge(position) {
    const badge = document.createElement("span");
    badge.className = "pos";
    badge.dataset.pos = position;                     //rengi belirleyen: "DEF"
    badge.textContent = POSITION_LABELS[position];    //ekranda görünen: "DF"
    return badge;
}

//<li><label><input type="checkbox" value="9"> Arda <span class="pos" data-pos="MID">OS</span></label></li>
function addGkOption(player) {
    const li = document.createElement("li");
    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = player.id;   //string olarak saklanır -> onayda Number(checkbox.value)

    //append: hem eleman hem string alır, birden fazla parametreyi sırayla ekler
    //player.name bir string -> tarayıcı onu metin düğümü (text node) olarak ekler
    label.append(checkbox, player.name, createPositionBadge(player.position));

    li.appendChild(label);
    gkOptions.appendChild(li);
}

//ONAY: form method="dialog" olduğu için submit olunca dialog kendiliğinden kapanır
//seçim yanlışsa preventDefault ile kapanmayı durduruyoruz
function confirmGoalkeepers(e) {
    const checkedBoxes = [...gkOptions.querySelectorAll("input:checked")];

    //1) sayı kontrolü: tam gkNeeded kadar seçilmeli
    if (checkedBoxes.length !== gkNeeded) {
        e.preventDefault();   //dialog açık kalsın
        gkText.textContent = `Tam ${gkNeeded} oyuncu seçmelisin. Şu an ${checkedBoxes.length} seçili.`;
        return;
    }

    //2) checkbox -> oyuncu: value string olduğu için Number
    const chosen = checkedBoxes.map(function (checkbox) {
        const playerId = Number(checkbox.value);
        return matchPlayers.find(player => player.id === playerId);
    });

    //3) kesin olanlar + seçilenler
    //eksik durumu: [Emre] + [Can] -> 2 kişi
    //fazla durumu: [] + [Emre, Tolga] -> 2 kişi
    const finalGoalkeepers = [...gkFixed, ...chosen];

    //4) preventDefault yok -> dialog kendisi kapanır
    buildTeams(finalGoalkeepers);
}


//VAZGEÇ: type="button" olduğu için formu submit etmez, kapatmayı biz yapıyoruz
function closeGkDialog() {
    gkDialog.close();
}
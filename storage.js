import { Player } from "./Models/Player.js";
import { TeamBuilder } from "./Models/TeamBuilder.js";


//düz objeyi Player nesnesine çeviren yardımcı
function toPlayer(p) {
    return new Player(p.id, p.name, p.position, p.rating);
}

//kadroyu yükler: localStorage'da varsa oradan, yoksa players.json'dan
export async function loadPlayers() {
    const savedPlayers = localStorage.getItem("players");
    if (savedPlayers !== null) {
        const data = JSON.parse(savedPlayers);
        return data.map(toPlayer);
    }

    const response = await fetch("players.json");
    if (!response.ok) {
        throw new Error("Kadro yüklenemedi: " + response.status);
    }
    const data = await response.json();
    const players = data.map(toPlayer);

    localStorage.setItem("players", JSON.stringify(players));
    return players;
}


const players = await loadPlayers();

//isimden oyuncu nesnesini bulur, yoksa anlaşılır hata verir
function byName(name) {
    const player = players.find(p => p.name === name);
    if (!player) {
        throw new Error(`Kadroda böyle bir oyuncu yok: ${name}`);
    }
    return player;
}

//takımı okunabilir şekilde yazdırır: "Tayfun (GK)", mevki dışıysa "Mert (DEF→FWD)"
function lineupText(team) {
    return team.lineup.map(function (item) {
        if (item.player.position === item.slot) {
            return `${item.player.name} (${item.slot})`;
        }
        return `${item.player.name} (${item.player.position}→${item.slot})`;
    }).join(", ");
}

//aynı 12 oyuncuyla iki algoritmayı çalıştırıp sonuçları yan yana gösterir - testler
function compare(title, names) {
    const builder = new TeamBuilder(names.map(byName));

    const [snakeA, snakeB] = builder.buildSnakeDraft();
    const [bestA, bestB] = builder.buildBestOfAll();

    console.log(`--- ${title} ---`);

    console.log("Yılan usulü  →", snakeA.totalRating, snakeB.totalRating,
                "| mevki dışı:", snakeA.outOfPositionCount + snakeB.outOfPositionCount,
                "| skor:", builder.score(snakeA, snakeB));
    console.log("   A:", lineupText(snakeA));
    console.log("   B:", lineupText(snakeB));

    console.log("Tümünü dene  →", bestA.totalRating, bestB.totalRating,
                "| mevki dışı:", bestA.outOfPositionCount + bestB.outOfPositionCount,
                "| skor:", builder.score(bestA, bestB));
    console.log("   A:", lineupText(bestA));
    console.log("   B:", lineupText(bestB));
}


//TEST 1: mevkiler dizilime tam uyuyor (4 DEF, 4 MID, 2 FWD)
// compare("Dengeli kadro", ["Tayfun", "Tolga", "Can", "Serkan", "Kaan", "Onur",
//                           "Arda", "Deniz", "Ozan", "Barış", "Cenk", "Efe"]);

// //TEST 2: mevkiler dizilime uymuyor (3 DEF, 5 MID, 2 FWD)
// compare("Zor kadro (3 DEF, 5 MID, 2 FWD)", ["Tayfun", "Tolga", "Can", "Onur", "Mert",
//                           "Arda", "Barış", "Deniz", "Yusuf", "Ozan", "Cenk", "Hakan"]);

// //TEST 3: hata kontrolü - 3 kaleci gönderiyoruz, anlaşılır bir hata mesajı vermeli
// try {
//     compare("3 kaleci (hata vermeli)", ["Tayfun", "Tolga", "Burak", "Can", "Onur", "Mert",
//                           "Arda", "Barış", "Deniz", "Yusuf", "Cenk", "Hakan"]);
// } catch (err) {
//     console.log("Beklenen hata:", err.message);
// }

//kadroyu kaydeder (ekleme, düzenleme ve silmeden sonra app.js çağıracak)
export function savePlayers(players) {
    localStorage.setItem("players", JSON.stringify(players));
}
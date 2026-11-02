import { Team } from "./Team.js";

//arr içinden k elemanlı tüm kombinasyonları döndürür
//örnek: getCombinations([A, B, C], 2) → [[A, B], [A, C], [B, C]]
function getCombinations(arr, k) {
    const result = [];

    //start: seçime nereden devam edileceği, current: şu ana kadar seçilenler
    function pick(start, current) {
        //yeterince seçtiysek bu kombinasyonu kaydet ve geri dön
        if (current.length === k) {
            result.push([...current]);   //kopyasını kaydet (current değişmeye devam edecek)
            return;
        }

        //kalan her eleman için: onu seç, devamını seç, sonra seçimi geri al
        for (let i = start; i < arr.length; i++) {
            current.push(arr[i]);        //seç
            pick(i + 1, current);        //geri kalanı seç (kendini çağırıyor)
            current.pop();               //geri al, sıradakini dene
        }
    }

    pick(0, []);
    return result;
}

export class TeamBuilder {
    //players     : maça gelen oyuncular (Player nesneleri)
    //goalkeepers : bu maçta kalede oynayacak 2 oyuncu (Player nesneleri)
    //              verilmezse (null) mevkisi GK olanlar kullanılır
    //formation   : gönderilmezse varsayılan 1-2-2-1
    constructor(players, goalkeepers = null, formation = { GK: 1, DEF: 2, MID: 2, FWD: 1 }) {
        this.players = players;
        this.goalkeepers = goalkeepers;
        this.formation = formation;
    }

    //bir takımdaki oyuncu sayısı: dizilimden hesaplanır (1+2+2+1 = 6)
    //getter: parantezsiz okunur -> this.teamSize
    get teamSize() {
        return Object.values(this.formation).reduce((a, b) => a + b, 0);
    }

    //iki algoritmanın ortak kontrolü: sorun yoksa bu maçın kalecilerini (iyisi önde) döndürür
    checkPlayers() {
        if (this.players.length !== this.teamSize * 2) {
            throw new Error(`${this.teamSize * 2} oyuncu gerekli, gelen: ${this.players.length}`);
        }

        //kaleciler dışarıdan verildiyse onlar, verilmediyse mevkisi GK olanlar
        //?? (nullish): soldaki null/undefined ise sağdakini kullan
        const goalkeepers = this.goalkeepers ?? this.players.filter(p => p.position === "GK");

        if (goalkeepers.length !== 2) {
            throw new Error(`Tam 2 kaleci gerekli, gelen: ${goalkeepers.length}`);
        }

        //every: dizideki HER eleman koşulu sağlıyorsa true
        if (!goalkeepers.every(gk => this.players.includes(gk))) {
            throw new Error("Kaleciler maç kadrosundan seçilmeli");
        }

        //[...goalkeepers]: kopyasını sırala, dışarıdan gelen dizinin sırası bozulmasın
        return [...goalkeepers].sort((a, b) => b.rating - a.rating);
    }

    //saha oyuncuları: kaleye seçilmeyen HERKES (sahada oynayan kaleciler dahil)
    getOutfield(goalkeepers) {
        return this.players.filter(p => !goalkeepers.includes(p));
    }

    //oyuncuları dizilime en az mevki dışı olacak şekilde yerleştirir
    //goalkeeper: verilirse önce o oyuncu kaleye konur (mevkisi ne olursa olsun)
    assignSlots(players, teamName, goalkeeper = null) {
        const team = new Team(teamName);

        //1) boş yerleri listeye çevir: ["GK", "DEF", "DEF", "MID", "MID", "FWD"]
        //Object.entries objeyi [anahtar, değer] çiftlerine çevirir: [["GK", 1], ["DEF", 2], ...]
        //function ([position, count]) -> destructuring: ["DEF", 2] dizisini iki değişkene ayırır
        const emptySlots = [];
        Object.entries(this.formation).forEach(function ([position, count]) {
            for (let i = 0; i < count; i++) {
                emptySlots.push(position);
            }
        });

        //2) kaleci belliyse önce onu kaleye koy, o yeri listeden çıkar
        //   kaleye geçen bir defansçı (DEF -> GK) outOfPositionCount'ta kendiliğinden mevki dışı sayılır
        let others = players;
        if (goalkeeper) {
            team.addPlayer(goalkeeper, "GK");
            emptySlots.splice(emptySlots.indexOf("GK"), 1);
            others = players.filter(p => p !== goalkeeper);
        }

        //3) birinci tur: herkes kendi mevkisinde yer varsa oraya
        const leftovers = [];   //kendi mevkisinde yer bulamayanlar
        others.forEach(function (player) {
            const index = emptySlots.indexOf(player.position);   //kendi mevkimde boş yer var mı?

            if (index !== -1) {
                team.addPlayer(player, player.position);   //kendi yerinde oynuyor
                emptySlots.splice(index, 1);               //o yer artık dolu, listeden çıkar
            } else {
                leftovers.push(player);                    //yer yok, kenara ayır (sahadaki kaleci de buraya düşer)
            }
        });

        //4) ikinci tur: dışarıda kalanlar boş kalan yerlere (mevki dışı)
        //leftovers ve emptySlots her zaman aynı uzunlukta: i. oyuncu i. boş yere
        leftovers.forEach(function (player, index) {
            team.addPlayer(player, emptySlots[index]);
        });

        return team;
    }

    //ALGORİTMA 1 - Yılan usulü (açgözlü / greedy):
    //her oyuncuyu o an toplam puanı düşük olan takıma verir. Hızlı ama en iyiyi garanti etmez.
    buildSnakeDraft() {
        const goalkeepers = this.checkPlayers();
        const outfield = this.getOutfield(goalkeepers);
        const teamSize = this.teamSize;

        //grupların o anki toplam puanı (gruplar henüz Team değil, düz dizi)
        const sum = (group) => group.reduce((total, p) => total + p.rating, 0);

        //1) kaleciler: iyisi A'ya, diğeri B'ye
        const groupA = [goalkeepers[0]];
        const groupB = [goalkeepers[1]];

        //bir oyuncuyu doğru gruba veren kural (aşağıda iki yerde kullanılıyor)
        const give = (player) => {
            if (groupA.length >= teamSize) {
                groupB.push(player);                //A doldu
            } else if (groupB.length >= teamSize) {
                groupA.push(player);                //B doldu
            } else if (sum(groupA) <= sum(groupB)) {
                groupA.push(player);                //A zayıf (ya da eşit) → A'ya
            } else {
                groupB.push(player);                //B zayıf → B'ye
            }
        };

        //2) saha oyuncularını mevki mevki dağıt
        //mevkiler dizilimden alınıyor: ["DEF", "MID", "FWD"]
        const outfieldPositions = Object.keys(this.formation).filter(pos => pos !== "GK");

        outfieldPositions.forEach((position) => {
            outfield
                .filter(p => p.position === position)
                .sort((a, b) => b.rating - a.rating)   //büyükten küçüğe
                .forEach(give);
        });

        //3) hiçbir mevki grubuna girmeyenler (sahada oynayan kaleciler) en sona
        outfield
            .filter(p => !outfieldPositions.includes(p.position))
            .sort((a, b) => b.rating - a.rating)
            .forEach(give);

        //4) grupları takıma çevir (kaleciyi de söyleyerek)
        const teamA = this.assignSlots(groupA, "A Takımı", goalkeepers[0]);
        const teamB = this.assignSlots(groupB, "B Takımı", goalkeepers[1]);
        return [teamA, teamB];
    }

    //ALGORİTMA 2 - Tüm kombinasyonları dene (kaba kuvvet / brute force):
    //10 saha oyuncusunu 5'e 5 bölmenin 252 yolunu dener. Her zaman en iyiyi bulur.
    buildBestOfAll() {
        const goalkeepers = this.checkPlayers();
        const outfield = this.getOutfield(goalkeepers);

        let bestScore = Infinity;   //"sonsuz": ilk denenen her bölünme bundan iyi olur
        let bestTeams = null;

        //saha oyuncularından (takım boyutu - 1 kaleci) kadarını seçmenin tüm yolları
        getCombinations(outfield, this.teamSize - 1).forEach((chosen) => {
            //seçilmeyenler B'ye gider
            //includes nesneleri referansla karşılaştırır: oyuncuları kopyalamadığımız için çalışıyor
            const rest = outfield.filter(p => !chosen.includes(p));

            //...chosen (spread): diziyi açar -> [kaleci, oyuncu1, oyuncu2, ...] tek dizi olur
            const teamA = this.assignSlots([goalkeepers[0], ...chosen], "A Takımı", goalkeepers[0]);
            const teamB = this.assignSlots([goalkeepers[1], ...rest], "B Takımı", goalkeepers[1]);
            const currentScore = this.score(teamA, teamB);

            //şimdiye kadarkilerden daha iyiyse en iyi olarak sakla
            if (currentScore < bestScore) {
                bestScore = currentScore;
                bestTeams = [teamA, teamB];
            }
        });

        return bestTeams;
    }

    //bir bölünmenin ne kadar iyi olduğunu ölçer: DÜŞÜK skor = DAHA İYİ
    score(teamA, teamB) {
        const outOfPosition = teamA.outOfPositionCount + teamB.outOfPositionCount;
        const ratingDiff = Math.abs(teamA.totalRating - teamB.totalRating);

        //mevki uyumu puan dengesinden önemli: 100, olası en büyük puan farkından (54) büyük
        return outOfPosition * 100 + ratingDiff;
    }
}
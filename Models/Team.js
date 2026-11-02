export class Team {
    constructor(name) {
        this.name = name;   //"A Takımı" gibi
        this.lineup = [];   //[{ player, slot }] -> oyuncu ve bu maçta oynadığı yer
    }

    addPlayer(player, slot) {
        this.lineup.push({ player, slot });
    }

    //türetilen bilgiler: saklanmıyor, her okunduğunda lineup'tan hesaplanıyor
    //reduce bir dizinin tüm elemanlarını tek bir değer haline getirmek (indirgemek) için kullanılan oldukça güçlü ve esnek bir dizi (array) metodudur.
    //yani dizideki toplam ratingi yazıyor
    //sum bir önceki toplam üzerine item player rating ekliyor 0ıncı indexten itibaren
    get totalRating() {
        return this.lineup.reduce((sum, item) => sum + item.player.rating, 0);
    }

    get outOfPositionCount() {
        return this.lineup.filter(item => item.player.position !== item.slot).length;
    }
}
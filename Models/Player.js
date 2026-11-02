export class Player {
    static POSITIONS = ["GK", "DEF", "MID", "FWD"]; //tüm oyuncular için ortak, sınıfa ait (static)

    constructor(id, name, position, rating) {
        //bozuk veri baştan girmesin
        if (!Player.POSITIONS.includes(position)) {
            throw new Error(`Geçersiz mevki: ${position}`);
        }
        if (rating < 1 || rating > 10) {
            throw new Error(`Puan 1-10 arası olmalı: ${rating}`);
        }

        this.id = id;
        this.name = name;
        this.position = position;
        this.rating = rating;
    }
}
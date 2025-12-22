// data/weekly.ts

// Kategoriler
export type WeeklyCategory = "movie" | "music" | "book";

// Her bir hafta için kayıt
export type WeeklyItem = {
  id: string;
  weekLabel: string;
  teaser: string;
  title: string;
  description: string;
};

// Her kategori için bir ARŞİV listesi
export const weeklyArchive: Record<WeeklyCategory, WeeklyItem[]> = {
  movie: [
    // 
    //
    {
      id: "2025-11-26-movie-2",
      weekLabel: "10–16 Kasım 2025",
      teaser: "Bu haftanın ilham veren yapımı: Schindler'in Listesi",
      title: "Haftanın Dizi / Film Önerisi: Schindler'in Listesi",
      description:
        "Usta yönetmen Steven Spielberg, Schindler'in Listesi ile seni tarihin acımasız yıllarına götürüyor. Yapım, Oskar Schindler'in gerçek hayat hikâyesini beyaz perdeye taşıyor. Schindler'in Nazi Almanyası'nda yaşanan korkunç katliamdan yüzlerce insanı kurtarmak için tüm servetini riske atması, izlerken içini titreten ama bir o kadar da umut veren bir hikâye sunuyor."
    },
    // ⬇️ ÖNCEKİ HAFTA → Frankenstein
    {
      id: "2025-11-19-movie-1",
      weekLabel: "17–23 Kasım 2025",
      teaser:
        "Bu haftanın ilham veren yapımı: Guillermo del Toro'nun Frankenstein yorumu, tanıdık bir hikâyeyi bambaşka bir gözle izletiyor.",
      title: "Haftanın Dizi / Film Önerisi: Frankenstein",
      description:
        "\"Uzun zamandır iyi bir film izlemedim.\" diyorsan 2025 yapımı Frankenstein harika bir seçenek. Gotik bilim kurgu ile dramanın güçlü bir şekilde harmanlandığı bu yapım, yaşamın ne olduğunu, anlamını ve değerini sorgulatan derin bir hikâye sunuyor."
    }, 
    {
      id: "2025-11-28-movie-2",
      weekLabel: "24–30 Kasım 2025",
      teaser: "Bu haftanın ilham veren yapımı: Grace and Frenkie, 20 dakikalık bölümleriyle seni sımsıcak saracak eğlenceli bir komedi dizisi.",
      title: "Haftanın Dizi / Film Önerisi: Grace and Frenkie",
      description:
        "Eşlerinin eşcinsel olduğu gerçeği karşısında 75 yaşında yapayalnız kalan Grace and Frenkie'nin yepyeni dünyası, senin de bir parçan hâline gelecek. İster yemek yerken ister yorucu bir günün ardından isterseniz de hafta sonunuza renk katmak için bu diziyi listenize mutlaka ekle!"
    },
  ],

  music: [
    {
      id: "2025-11-25-music-ornek",
      weekLabel: "24–30 Kasım 2025",
      teaser: "Ruhunu besleyecek sakin bir çalma listesi.",
      title: "Haftanın Müzik Önerisi: (Şarkı / Playlist Adı)",
      description:
        "Buraya şarkının ya da çalma listesinin adını, sanatçıyı ve hangi ruh hâline iyi geldiğini yaz."
    }
    // Yeni haftalar için yeni objeler ekle
  ],

  book: [
    {
      id: "2025-11-25-book-ornek",
      weekLabel: "24–30 Kasım 2025",
      teaser: "Sakin bir akşamda sana eşlik edecek kitap.",
      title: "Haftanın Kitap Önerisi: (Kitap Adı)",
      description:
        "Buraya kitabın adını, yazarını, türünü ve neden önerdiğini yaz."
    }
    // Yeni haftalar için yeni objeler ekle
  ]
};

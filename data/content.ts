// data/content.ts

export type CategoryId =
  | "healthyEating"
  | "relationships"
  | "wellbeing"
  | "sport"
  | "fashion"
  | "beauty"
  | "astrology"
  | "travel"
  | "home";

export type ArticleSection = {
  id: string;
  title: string;
  body: string;
  imageKey?: string; // burç görseli vs için
};

export type Article = {
  id: string;
  category: CategoryId;
  title: string;
  summary: string;
  body: string;
  date: string;
  mainImageKey?: string; // 🔹 YENİ EKLEDİK
  sections?: {
    id: string;
    title: string;
    body: string;
    imageKey?: string;
  }[];
};

export const articles: Article[] = [
  // 🥗 Sağlıklı beslenme – salata tarifi
{
  id: "he_sample_1",
  category: "healthyEating",
  title: "Sağlıklı, Doyurucu, Vegan ve Glütensiz Salata Tarifi",
  summary: "Sağlıklı ve doyurucu öğünlerin yeni favori tarifi!",
  body: `Artık tükettiğimiz gıdaların sağlığımız üzerindeki rolünü çok daha iyi biliyoruz. Ancak sağlıklı, özellikle de glütensiz öğünlerin lezzetli olmadığı yönünde yaygın ve hatalı bir inanış var. Oysa birkaç küçük dokunuş ve doğru tatları bir araya getirmek sandığınızdan çok daha leziz sonuçlar almanızı sağlayabilir.

Hafif bir öğün dendiği zaman akıllara ilk olarak salata gelir. Ancak her zaman klasik salatalarla yetinmenize gerek yok. İşte doyurucu, protein açısından zengin, vegan ve glüten içermeyen lezzetli mi lezzetli salata tarifi!

Malzemeler

• 1/2 su bardağı haşlanmış nohut,
• 1/2 su bardağı haşlanmış yeşil mercimek,
• 1 su bardağı haşlanmış kinoa,
• 1 adet domates,
• 1/2 bağ maydanoz,
• 1/2 bağ tere,
• 1/2 bağ roka,
• 1 adet kırmızı soğan.

Salata sosu için
• Zeytinyağı,
• Limon suyu,
• Tuz,
• Nar ekşisi (İsteğe bağlı)

Hazırlanışı

• Haşladığınız bakliyatları geniş bir karıştırma kâsesine alın.
• İyice yıkadığınız yeşillikleri istediğiniz büyüklükte doğrayıp kâseye ekleyin. 
• Dilerseniz salatanıza haşlanmış pancar ve avokado gibi malzemeleri de ekleyebilirsiniz.
• Domatesi küp küp, soğanı ise ay şeklinde doğrayıp kâseye ilave edin.
• Uygun bir kavanoza dilediğiniz miktarda zeytinyağını, limon suyunu ve tuzu ekleyin. Damak tadınıza uyuyorsa 1 tatlı kaşığı nar ekşisi de koyabilirsiniz. Ardından kavanozun kapağını kapatarak sosu güzelce sallayın.
• Son olarak sosu da salatanın üzerine ilave edin ve güzelce karıştırın. Afiyet olsun!`,
  date: "2025-11-24",
  mainImageKey: "he_sample_1", // 🔹 contentImages’te he_sample_1 ekleyeceksin
},

// 🔮 Astroloji – Astrolojik Çakra Rehberi
{
  id: "ast_01",
  category: "astrology",
  title: "Enerjinizi Burcunuza Göre Dengeleyin: Astrolojik Çakra Rehberi",
  summary:
    "Burcunuzun zorlandığı alanları keşfederek kendinizle yeniden bağ kurun.",
  body: `Her burcun enerji haritası benzersiz. Dolayısıyla ihtiyaç duyduğu şifa alanı ve denge noktası da farklı. Çakra sistemi, burcunuzun en çok zorlandığı veya aşırıya kaçtığı alana ışık tutarak kendinize yeniden bağlanmanız için mükemmel bir rehber sunar.

Astroloji ve çakra sistemi arasında düşündüğümüzden çok daha güçlü bir bağ var. Çünkü her burç, kendine özgü bir enerji merkeziyle daha yoğun etkileşim içinde. Ancak bu yoğunluk her zaman pozitif değil. Bazen aşırı bir dengesizlik yaratır ve bizi yoran döngülere sokar. İşte tam da bu yüzden burcunuza uygun çakrayla çalışmak hem ruhunuzu dengelemek hem enerji alanınızı toparlamak için harika bir başlangıç.

Hazırsanız hangi çakranın sizi yeniden merkeze taşıyacağını birlikte keşfedelim!

Burçlara Göre Dengeleme ve Şifa Rehberi`,
  date: "2025-11-24",
  mainImageKey: "ast_01_main_01", // 🔹 contentImages’te var
  sections: [
    {
      id: "koc",
      title: "Koç: Solar Pleksus (Karın) Çakrası",
      body: `Sen sürekli hareket hâlinde, hızlı düşünen ve hızlı yaşayan birisiniz. Liderlik enerjinizi sürekli dışarıya yönlendirmeniz, zamanla içsel bir boşluk yaratabilir. Solar Pleksus çakranızı dengelemek, liderlik enerjinizi daha sağlıklı ve kontrollü yönlendirmenizi sağlayabilir.

Pratik Öneri: Sarı tonlardaki kristalleri kullanmak, karın bölgesine odaklanan nefes egzersizleri yapmak sizi sakin ama güçlü bir merkeze davet edebilir.`,
      imageKey: "ast_01_koc",
    },
    {
      id: "boga",
      title: "Boğa: Kök Çakra",
      body: `Sizin için huzur lüks değil, temel bir ihtiyaç. Bu nedenle huzurunuz sarsıldığında tüm sisteminiz çöküyormuş gibi hissedebilirsiniz. Kök çakranız güçlü olduğunda değişim sizi korkutmaz.

Pratik Öneri: Toprakla temas kurmak, çıplak ayakla yürüyüş yapmak ve kırmızı renklerle çevrelenmek size iyi gelebilir. Unutmayın, bazen sadece çimenlere uzanmak bile yeniden köklenmek için yeterlidir.`,
      imageKey: "ast_01_boga",
    },
    {
      id: "ikizler",
      title: "İkizler: Boğaz Çakrası",
      body: `Zihniniz sürekli açık kanalda yayın yapan bir radyo gibidir. Sizin için her fikir, her bilgi değerlidir. Ama bu akış bazen karmaşaya yol açabilir. Boğaz çakranızı dengelemek, ifade gücünüzü netleştirebilir.

Pratik Öneri: Belki her düşündüğünüzü paylaşmak zorunda değilsinizdir. Günlük tutmak, yazmak ya da sadece derin bir sessizlikle kalmak bile sizi yeniden merkeze döndürüp ifade netliğinizi artırabilir.`,
      imageKey: "ast_01_ikizler",
    },
    {
      id: "yengec",
      title: "Yengeç: Kalp Çakrası",
      body: `Sevgi, sizin temel diliniz ve yaşam kaynağınız. Ama bazen karşılıksız verdikçe tükeniyorsunuz. Kalp çakranızı şefkatle dengelemek, sizi öncelikle kendinize açar.

Pratik Öneri: Yeşil tonlar, doğa yürüyüşleri, içten gelen bir teşekkür bile bu alana ışık getirebilir. Unutmayın; sağlıklı sınırlar çizmek, sevginin düşmanı değil. Tam tersine onun en güçlü koruyucusudur.`,
      imageKey: "ast_01_yengec",
    },
    {
      id: "aslan",
      title: "Aslan: Taç Çakra",
      body: `Doğanız gereği sahnedesiniz ve bu son derece doğal. Ancak bazen alkışa bağımlı hâle gelebilirsiniz. Taç çakranızla çalışmak, içsel ışığınızı başkalarının onayına ihtiyaç duymadan parlatmanıza yardım edebilir.

Pratik Öneri: Sessizlik içinde kalmak, meditasyon yapmak ve mor/beyaz tonlarla çevrelenmek sizi evrenle uyum içine getirebilir. Çünkü gerçekten parlamak için önce içten ışık saçmalısınız.`,
      imageKey: "ast_01_aslan",
    },
    {
      id: "basak",
      title: "Başak: Alın (Üçüncü Göz) Çakrası",
      body: `Her şeyin planlı ve düzenli olması sizi güvende hissettirir. Ama bazen sezgisel yanınızı ve iç sesinizi ihmal ettiğinizi fark ediyorsunuz. Üçüncü Göz çakranızı dengelemek, "bilmiyorum" demenin de bir bilgelik olduğunu hatırlatabilir.

Pratik Öneri: Lavanta yağı kullanmak, meditasyon yapmak ve gece gökyüzünü izlemek; sürekli çalışan zihninizi yavaşlatmak için harika yollar olabilir.`,
      imageKey: "ast_01_basak",
    },
    {
      id: "terazi",
      title: "Terazi: Kalp Çakrası",
      body: `Siz tam bir denge insanısınız ama ne yazık ki çoğu zaman bu dengeyi başkaları için kuruyorsunuz. Kalp çakranızı şefkatle beslemek, önceliği biraz da kendinize vermenizi sağlar.

Pratik Öneri: Sanatla uğraşmak, sevdiğiniz renklerle çevrelenmek ve yalnızca "kendinizle" kaliteli bir akşam geçirmek sizi yeniden hizaya getirebilir. Unutmayın, siz de o dengeye dâhil olmalısınız!`,
      imageKey: "ast_01_terazi",
    },
    {
      id: "akrep",
      title: "Akrep: Sakral Çakra",
      body: `Duygularınız derin, tutkularınız ise inanılmaz derecede yoğun. Ama bazen bu duyguları bastırmak yerine dönüştürmek gerekir. Sakral çakranızı dengelemek, sizi yaratıcılığınızla buluşturabilir.

Pratik Öneri: Dans etmek, suyla temas kurmak veya sanatla iç içe olmak size çok iyi gelebilir. Duygularınızın içinden cesurca geçin ve o derinliklerden güç doğduğunu fark edin.`,
      imageKey: "ast_01_akrep",
    },
    {
      id: "yay",
      title: "Yay: Taç Çakra",
      body: `Aradığınız şey özgürlük ama bu sadece dış dünyadaki seyahatlerle sınırlı değil. Taç çakrayla çalışmak, sizi derin bir içsel özgürlüğe ve bilgeliğe taşıyabilir.

Pratik Öneri: Felsefe, meditasyon ve içsel keşif sizi besler. Kendinizi ve iç dünyanızı anlamaya başladığınızda tüm dış dünya size daha geniş bir macera alanı gibi gelmeye başlayabilir.`,
      imageKey: "ast_01_yay",
    },
    {
      id: "oglak",
      title: "Oğlak: Kök Çakra",
      body: `Başarı sizin için bir yolculuktur ama bu yoğun yolda bazen şimdiki anı ve kendinizi unutuyorsunuz. Kök çakranızla bağ kurmak, sizi sadece hedefe değil, "şu anda olmaya" da davet edebilir.

Pratik Öneri: Doğada vakit geçirmek, yaşam alanında düzen kurmak ve sadeleşmek sizi yeniden güçlendirebilir. Ayaklarınızın yere sağlam bastığını hissettiğinizde kariyerinizdeki gerçek başarıyı tanımlayabilirsiniz.`,
      imageKey: "ast_01_oglak",
    },
    {
      id: "kova",
      title: "Kova: Boğaz Çakrası",
      body: `Fikirleriniz âdeta havada uçuşuyor, zihniniz sürekli yeni projelerle dolu. Ama onları dış dünyayla paylaşmak bazen yalnızlık hissi verebiliyor. Boğaz çakranızı dengede tutmak, duygularınızı ifade ederken gerçek bağlantılar kurmanızı sağlayabilir.

Pratik Öneri: Yazmak, podcast hazırlamak veya resim yapmak… Hepsi sizin için birer iletişim kapısı olabilir. Bunları yaparken niyetiniz sadece "anlatmak" değil, aynı zamanda "duyulmak" da olsun.`,
      imageKey: "ast_01_kova",
    },
    {
      id: "balik",
      title: "Balık: Alın (Üçüncü Göz) Çakrası",
      body: `Siz, hayallerle gerçekler arasında ustaca yüzüyorsunuz. Sezgileriniz güçlü ama bazen gerçeklikten kaçışla karışabilir. Üçüncü Göz çakranızı dengelemek, sizi içsel pusulanızla net bir şekilde hizalayabilir.

Pratik Öneri: Rüya günlüğü tutmak, hayal kurarken aynı zamanda topraklanma egzersizleri yapmak ve mor renklerle çalışmak sizi hem büyülü hem merkezde kılabilir.

Gördüğünüz gibi her burcun şifa ihtiyacı farklı. Ancak hedef hep aynı: İçsel huzuru bulmak, merkezde ve denge olmak. Hangi çakranızla çalışmanız gerektiğini bilmeniz, ruhsal yolculuğunuzda atabileceğiniz büyük ve bilinçli bir adım olabilir. Unutmayın, şifa önce fark etmekle başlar!`,
      imageKey: "ast_01_balik",
    },
  ],
},

// 🔮 Astroloji – 24–30 Kasım Haftalık Burç Yorumları
{
  id: "ast_weekly_2025_11_24",
  category: "astrology",
  title: "24 - 30 Kasım Haftalık Burç Yorumları",
  summary:
    "Bu hafta ilişkiniz, kariyeriniz ve sağlığınız için enerjinizi hangi alana yönlendireceğinizi keşfedin.",
  body: `24 - 30 Kasım haftası, önemli farkındalıklar ve dönüşüm enerjileri taşıyor. İlişkiniz, kariyeriniz ve sağlığınız hakkında neleri önceliklendirmeniz gerektiğini öğrenmek için burcunuzun size sunduğu ipuçlarını keşfedin!`,
  date: "2025-11-24", // 🔹 Sıralama için düzgün format
  mainImageKey: "ast_01_main_01", // Aynı hero görseli kullanıyoruz
  sections: [
    {
      id: "weekly_koc_2025_11_24",
      title: "Koç ve Yükselen Koç: Geçmişi Güce Dönüştürme Haftası",
      body: `Haftaya kariyeriniz ve toplumdaki imajınızla ilgili önemli gündemlerle başlıyorsunuz.

• Kariyer ve Benlik: Geçmişte sizi yaralayan konular tekrar önünüze gelse de, bu süreçte sizi siz yapan değerleri fark edebilir ve öz güveninizi tazeleyebilirsiniz. Çevrenizdeki dişil figürlerden önemli destekler almanız olasıdır.
• Finans ve Sosyal Çevre: Maddi anlamda beklediğiniz paralar size ulaşabilir. Haftanın ilk gününden sonra gelecek planlarınızı ve sosyal çevrenizi yeni bir vizyonla şekillendirmek isteyeceksiniz. Güçlü kişilerin desteğini alarak sosyal çevrenizi değiştirebilirsiniz.
• Aksiyon Alanları: Sosyal medya, hukuk, seyahat, iletişim ve eğitim gibi alanlarda hızlıca harekete geçebilir, bu sayede yeni sosyal ortamlara dahil olabilirsiniz. Harcamalarınızda aşırıya kaçmamanızda fayda var.
• Hafta Sonu Odak: Hafta sonuna doğru iç dünyanız ön planda. Duygularınız yoğunlaşırken içe dönebilirsiniz. Terapi, bilinçaltı çalışmaları, aile dizimi veya meditasyon gibi sanatsal ve psikolojik çalışmalar için bu günleri değerlendirebilirsiniz. Haftanın son gününde enerjiniz yükseliyor!`,
      imageKey: "ast_01_koc",
    },
    {
      id: "weekly_boga_2025_11_24",
      title: "Boğa ve Yükselen Boğa: İmajınızı Yükseltme Dönemi",
      body: `Haftaya sosyal medya, hukuk, eğitim, seyahat ve belge işleri gibi alanlardaki gündemlerle başlıyorsunuz. Resmi kurumlarla olan süreçlerinizi ciddiyetle yönetmenizde fayda var.

• Kariyer ve Finans: Haftanın ilk gününden sonra kariyerinizde ve toplumdaki imajınızda önemli bir yükseliş yaşayabilirsiniz. Etkileyici bir profil çizmeniz olası. Borç, kredi, miras gibi parasal konulardaki motivasyonlarınız kariyerinize cesurca yansıyacak.
• İlişkiler ve Retro Uyarısı: Partneriniz veya ortağınız size destek olabilir, ancak anlaşmak kolay olmayabilir; sabırlı olmalısınız. Hâlâ retroda olduğumuzu unutmayın: Kariyeriniz ve imajınız ile ilgili ani ve radikal değişiklikler yapmaktan şimdilik kaçınmalısınız.
• Hafta Sonu Odak: Hafta sonuna doğru gelecek planlarınız ve sosyal çevrenizle ilgili gündemleriniz öne çıkıyor. Kaygılarınızın üzerine gitmeli ve çevrenizdeki dişil figürleri dinlemelisiniz. Otorite figürleri size önemli bir destek sağlayabilir. Yeni bir sosyal ortama dahil olmak, hayallerinizi yapılandırmanıza yardımcı olacaktır.`,
      imageKey: "ast_01_boga",
    },
    {
      id: "weekly_ikizler_2025_11_24",
      title: "İkizler ve Yükselen İkizler: İletişimde Parlama ve Bütçe Yapılandırması",
      body: `Haftaya hibe, miras, borç, kredi gibi parasal meselelerle ve yakınlık kurma konularıyla başlıyorsunuz.

• Finans ve İş: Bütçe planlaması yapmak için uygun günlerdesiniz. İş arkadaşlarınızdan destek alabilir, kendi işinizi yapıyorsanız işlerinizin bereketlendiğini görebilirsiniz.
• İletişim Gücü: Haftanın ilk gününden sonra sosyal medya, hukuk, eğitim ve seyahat alanlarında gündemleriniz olacak. Etkileyici bir imaj çizebilirsiniz ve partneriniz sizi cesaretlendirerek harekete geçirebilir. Kendinizi iyi ifade ettiğinizi hissedeceksiniz.
• Uyarılar: Otorite figürleriyle güç savaşlarına girmekten kaçınmalı ve kontrolünüz dışı gelişen durumlara karşı keskin tepkiler vermemelisiniz. Sağlığınızı ve bağışıklığınızı ihmal etmeyin.
• Hafta Sonu Odak: Hafta sonu kariyerinizde idealist ve duygusal bir yaklaşım içinde olabilirsiniz. İş arkadaşlarınızdan yardım alarak sorumluluklarınızı yönetebilirsiniz. Gelecek planlarınız ve sosyal çevrenizle ilgili ufkunuzun genişlediği, enerjinizin yüksek olduğu bir gün sizi bekliyor.`,
      imageKey: "ast_01_ikizler",
    },
    {
      id: "weekly_yengec_2025_11_24",
      title: "Yengeç ve Yükselen Yengeç: Hayalleri Somutlaştırma ve Tutkulu İlişkiler",
      body: `Haftaya ilişkilerinizle ilgili gündemlerle başlıyorsunuz. Sosyal medya, eğitim ve seyahat gibi alanlarda sorumluluklarınız artabilir.

• İlişkiler ve Hayaller: Hayallerinizi somutlaştırmanıza vesile olacak kişilerle bağlantı kurabilirsiniz. İlişkilerinizde tutku artabilir; hatta arkadaşlıktan aşka dönüşen durumlar yaşanması olası.
• Finans ve İç Dünya: Haftanın ilk gününden sonra borç, kredi, miras gibi parasal meseleler ön planda. Bütçenizi güncelleyebilirsiniz, ancak harcamalarınız artabilir. Terapi ve bilinçaltı çalışmaları için uygun günlerde içsel çalışmalar yapabilirsiniz.
• Uyarılar: Gelecek planlarınız ile bağlantılı ani ve keskin kararlar almaktan (Retro!) kaçınmalısınız.
• Hafta Sonu Odak: Hafta sonu eğitim ve sosyal medya alanlarında özgürlüğünüzün kısıtlandığını hissedebilirsiniz; ancak iç sesinizi ve çevrenizdeki dişil figürleri dinlemek size kazandıracaktır. Otorite figürlerinden önemli destekler alabilirsiniz. Haftanın son gününde kariyeriniz ve imajınızla ilgili girişken bir profil çizeceksiniz.`,
      imageKey: "ast_01_yengec",
    },
    {
      id: "weekly_aslan_2025_11_24",
      title: "Aslan ve Yükselen Aslan: Güçlü İlişkiler ve Maddi Bereket",
      body: `Haftaya iş ortamınız, sağlığınız ve evcil hayvanınızla ilgili gündemlerle başlıyorsunuz.

• Sağlık ve Finans: Bağışıklığınıza dikkat edin; dişler, kemikler ve cildiniz hassas olabilir. Hibe, borç, miras gibi parasal konularda uzun vadeli bir plana dahil olabilir, bir otorite figüründen destek alabilirsiniz.
• İlişkilerde Dönüşüm: Haftanın ilk gününden sonra ilişkilerinize bakış açınız değişiyor. İlişkilerinizde tutku artarken, güçlü kişilerle savaşmak yerine onların desteğini alarak parlamaya odaklanın. Sosyalleşebilirsiniz.
• Kariyer ve Retro Uyarısı: Kariyeriniz ve imajınız ile ilgili ani ve keskin kararlar almaktan retro bitene kadar kesinlikle kaçının. Sosyal medya, hukuk veya eğitim gibi alanlarda yaşanacak bir gelişme, geçmiş yaralarınızı sarabilir.
• Hafta Sonu Odak: Hibe, miras, borç gibi parasal meselelerde iç dünyanıza yönelebilir, sezgilerinizle hareket edebilirsiniz. Beklemediğiniz bir yerden para gelebilir, maddi bereketiniz artabilir. Haftanın son gününde sosyal medyada veya iletişim alanlarında parlayabilir, enerjinizin yükseldiğini hissedebilirsiniz.`,
      imageKey: "ast_01_aslan",
    },
    {
      id: "weekly_basak_2025_11_24",
      title: "Başak ve Yükselen Başak: Sağlıklı Rutinler ve İlişkilerde Romantizm",
      body: `Haftaya ilişkileriniz, çocuklarınız ve hobilerinizle ilgili gündemlerle başlıyorsunuz.

• İlişkiler ve Fırsatlar: İlişkilerinizi ciddiye alacak, uzun vadeli yaklaşacaksınız. Sosyal medya, iletişim, seyahat ve eğitim gibi alanlarda güzel fırsatlar elde edebilirsiniz. Çocuklarınızla ilgili sorumluluklarınıza odaklanmanız gerekebilir.
• Sağlık ve İş Rutini: Haftanın ilk gününden sonra iş ortamınız, sağlığınız ve evcil hayvanınızla ilgili gündemleriniz olabilir. Bağışıklığınıza dikkat edin, sağlıklı rutinler edinin ve kan değerlerinize baktırabilirsiniz. İş ortamınızda değişiklikler yaşanabilir.
• Finansal Çözüm: Borç, miras gibi parasal konulardaki problemlerinizi çözme fırsatı bulacaksınız. Yakınlık konularındaki yaralarınızı sarabilirsiniz.
• Hafta Sonu Odak: Hafta sonu ilişkileriniz öne çıkıyor; romantizm artabilir. İç sesinizi dinlemek size ilişkilerde kazandıracaktır. Partnerinizle uzun vadeli planlar yapabilirsiniz. Yeni kazanç yolları için harekete geçmek ve ailenizden destek almak için uygun bir hafta sonundasınız.`,
      imageKey: "ast_01_basak",
    },
    {
      id: "weekly_terazi_2025_11_24",
      title: "Terazi ve Yükselen Terazi: Aile Desteği ve Kadersel Rehberlik",
      body: `Haftaya eviniz ve ailenizle ilgili artan sorumluluklarla başlıyorsunuz.

• Aile ve Finans: Ailenizden veya evinizle ilgili konularda maddi destek almanız olası.
• İlişkiler ve Çocuklar: Haftanın ilk gününden sonra ilişkilerinizde, çocuklarınızla ilgili konularda ve hobilerinizde gündemleriniz olacak. İlişkilerinizde tutku artabilir. Çocuklarınıza yaklaşımınızda aşırı kontrolcü ve baskıcı olmamaya özen gösterin. Beklenmedik harcamalar yapmak durumunda kalabilirsiniz.
• Sağlık ve İş Ortamı: Hafta sonuna doğru iş ortamınız, sağlığınız ve evcil hayvanınızla ilgili gündemleriniz olabilir. Sağlığınızı ihmal etmeyin; ayaklar ve psikoloji hassas. İş ortamınızdaki dişil figürlerden kadersel destek görebilirsiniz.
• Hafta Sonu Odak: Sosyal medya, eğitim veya ticaret gibi alanlarda duygularınız ve mantığınız arasında kalabilirsiniz. Yeni kazanç yolları için sezgileriniz size rehberlik edebilir. Haftanın son gününde ilişkileriniz ön planda olacak; sosyalleşebilirsiniz ve kendinizi iyi ifade ettiğinizi hissedebilirsiniz.`,
      imageKey: "ast_01_terazi",
    },
    {
      id: "weekly_akrep_2025_11_24",
      title: "Akrep ve Yükselen Akrep: Aile, Ev ve Yaratıcı Dönüşüm",
      body: `Haftaya sosyal medya, iletişim, ticaret, eğitim gibi alanlardaki artan sorumluluklarla başlıyorsunuz. Resmi işlerinizi hızlandırmalı, geçmişteki kişilerden haber beklemelisiniz.

• Ev ve Aile: Haftanın ilk gününden sonra eviniz ve ailenizle ilgili gündemleriniz olabilir. Evinizde tadilat veya bir takım değişiklikler yapabilirsiniz. Ailenizdeki otorite figürleriyle güç savaşına girmek yerine onların desteğini alın. Aile ve partneriniz arasında kalabilir, yüksek tepkiler vermekten kaçınmalısınız.
• İlişkiler ve Yaratıcılık: Hafta sonuna doğru ilişkileriniz, çocuklarınız ve hobileriniz öne çıkıyor. İlhamınız yüksek; yaratıcı alanlarda üretim yapanlar için güzel etkiler var. İlişkilerde romantizm artıyor ve fedakarca hareket edebilirsiniz. İlişkilerinize uzun vadeli yaklaşarak hayallerinizi gerçekleştirmenin yollarını arayacaksınız.
• Hafta Sonu Odak: Haftanın son gününde iş ortamınız, sağlığınız ve evcil hayvanınızla ilgili gündemleriniz olabilir. Enerjiniz yükseliyor ve öz güveniniz canlanıyor. Spor yapmak için güzel bir hafta sonu.`,
      imageKey: "ast_01_akrep",
    },
    {
      id: "weekly_yay_2025_11_24",
      title: "Yay ve Yükselen Yay: Maddi Fırsatlar ve Çılgın Fikirler",
      body: `Haftaya maddi konularla ilgili gündemlerle başlıyorsunuz.

• Finans ve Öz Güven: Kazancınızı artıracak fırsatlar yakalayabilir, geçmişteki iş tekliflerinin yeniden önünüze geldiğini görebilirsiniz. Mükemmeliyetçi tavrınızın öz güveninizi kırmasına izin vermeyin.
• İletişim ve Zihin: Haftanın ilk gününden sonra sosyal medya, iletişim, seyahat ve eğitim gibi alanlarda cesur ve girişken bir profil çizeceksiniz. Takıntılı düşüncelere kapılmaya meyilli olabilirsiniz; meditasyon ve nefes çalışmaları iyi gelecektir. Eril bir figürden destek alabilirsiniz.
• Uyarılar: Beklenmedik aksaklıklar ve krizler oluşabilir. Yüksek tepkiler vermekten kaçının; pot kırmaya müsait olabilirsiniz. Ancak çılgın ve yaratıcı fikirleriniz size çözümler getirecektir.
• Hafta Sonu Odak: Hafta sonuna doğru eviniz ve ailenizle ilgili sorumluluklarınız artabilir; dinlenmeye ihtiyacınız var. Haftanın son gününde ilişkileriniz, çocuklarınız ve hobilerinizle bağlantılı gündemleriniz olacak. Canlı hissedecek, keyifli aktivitelere yönelecek ve enerjinizi yükselteceksiniz.`,
      imageKey: "ast_01_yay",
    },
    {
      id: "weekly_oglak_2025_11_24",
      title: "Oğlak ve Yükselen Oğlak: Maddi Dönüşüm ve Sıra Dışı Yetenekler",
      body: `Haftaya kendinize ve hayatınıza odaklı, sorumluluk bilinciyle hareket ederek başlıyorsunuz.

• Bütçe ve Yetenekler: Haftanın ilk gününden sonra maddi konularda önemli gündemleriniz olacak. İçsel motivasyonunuzu bulmanız öz güveninizi artırabilir. Kazancınızı artırmak için harekete geçebilir, bütçenizi yeniden şekillendirebilirsiniz. Yeteneklerinizi ortaya koyarken özgün ve sıra dışı yollar seçerek dikkatleri üzerinizde toplayacaksınız.
• Uyarılar: Beklenmedik harcamalar yapmak durumunda kalabilirsiniz.
• İletişim ve Sezgiler: Hafta sonuna doğru sosyal medya, iletişim ve eğitim gibi alanlarda duygularınız ön planda olabilir. Yaratıcılığınız ve ilhamınız yüksek; sezgilerinize kulak verebilirsiniz. İnternet alışverişi veya sözleşmeler söz konusu ise koşulları iyi değerlendirdiğinizden emin olun.
• Hafta Sonu Odak: Haftanın son gününde eviniz ve ailenizle ilgili gündemleriniz olabilir. Cesaretiniz artıyor. Terapi, bilinçaltı ve aile dizimi konulu çalışmalar için uygun bir hafta sonu sizi bekliyor.`,
      imageKey: "ast_01_oglak",
    },
    {
      id: "weekly_kova_2025_11_24",
      title: "Kova ve Yükselen Kova: Köklü Değişim ve Yeni Kazanç Yolları",
      body: `Haftaya bilinçaltınızdaki konularla ve yapılacak işlere odaklı başlıyorsunuz. Mükemmeliyetçiliğinizin sizi kısıtlı düşünmeye itmesine izin vermeyin.

• Değişim ve Güç: Haftanın ilk gününden sonra kendinize ve hayatınıza yönelebilirsiniz. Köklü değişiklikler yapmak isteyecek ve gücün elinizde olduğunu hissedeceksiniz. Sosyal çevrenizden önemli bir otorite figüründen destek alabilirsiniz.
• Aksiyon Alanları: Gelecek planlarınızı gerçekleştirmek için adım atabilir, cesaretinizi toplayabilirsiniz. Eviniz veya ailenizle ilgili sürpriz bir gelişme söz konusu olabilir.
• Finans ve Sezgiler: Hafta sonu maddi konular gündeminizde. Yaratıcı çözümler geliştirerek ve sezgilerinize kulak vererek yeni kazanç yolları bulabilirsiniz. Yeteneklerinizi geliştirmek için uzun vadeli planlar yapmalısınız. Aileniz sayesinde maddi konulara dair önemli bir farkındalık yaşayabilirsiniz.
• Hafta Sonu Odak: Haftanın son gününde sosyal medya, iletişim ve eğitim gibi alanlarda gündemleriniz olacak. Dahil olduğunuz ortamlarda parlayabilir, keyifli vakit geçirmeye odaklanabilirsiniz.`,
      imageKey: "ast_01_kova",
    },
    {
      id: "weekly_balik_2025_11_24",
      title: "Balık ve Yükselen Balık: İçsel Dönüşüm ve Özgün İfade",
      body: `Haftaya gelecek planlarınız ve sosyal çevrenizle ilgili artan sorumluluklarla başlıyorsunuz.

• Sosyal ve Ruhsal Destek: Sosyal sorumluluk projelerinde yer alabilir, sosyal medya veya eğitim alanlarındaki dişil figürlerden destek görebilirsiniz.
• İç Dünya ve Bilinçaltı: Haftanın ilk gününden sonra içe dönebilirsiniz. Rüyalarınız güçlü temalarda olabilir. Bilinçaltınızdaki bazı kalıpları dönüştürme fırsatı bulabilirsiniz. Terapi, bilinçaltı ve aile dizimi konulu çalışmalar için uygun günler.
• Kariyerde Cesaret: Kariyerinizde ve imajınızda özgünlüğünüzü yansıtmak isteyecek, bunun için cesaretle harekete geçeceksiniz. Sosyal medya, iletişim ve seyahat gibi alanlarda şaşırtıcı gelişmeler yaşanabilir. Yaratıcılığınızı kullanarak durumların üstesinden gelebilirsiniz.
• Hafta Sonu Odak: Hafta sonu kendinize odaklanıyor, ilhamınızın yüksekliğiyle sezgilerinizi dinlemeyi tercih ediyorsunuz. Hayallerinizi gerçekleştirmek için kendinizi disipline etmeli ve uzun vadeli planlar yapmalısınız. Haftanın son gününde maddi konulara ve yeteneklerinize yönelebilir, kariyeriniz için cesaretinizi toplayabilirsiniz. Spor yapmak size çok iyi gelecektir.`,
      imageKey: "ast_01_balik",
    },
  ],
},

// 💞 İlişkiler – Evlenmeden önce sorulacak sorular
{
  id: "rel_01",
  category: "relationships",
  title: "Evlenmeden Önce Partnerinize Sormanız Gereken Sorular",
  summary:
    "Evlilik öncesi bazı kritik noktaları konuşmak, gelecekteki olası çatışmaların önüne geçebilir.",
  body: `Evlilik yoluna giren herkes, sevdiği insanla bir ömür boyu mutluluğu yakalamak ister. Ancak bu uzun yolculukta sadece sevgi ve saygı yeterli değil. Çünkü herkesin kendine has beklentileri, finansal alışkanlıkları ve aile kültürü var. Mutlu ve sağlam bir evlilik temeli için bazı hayati konularda ortak paydada buluşmanız şart.

Eğer partnerinizle hayatınız birleştirmeye karar verdiyseniz gelecekte karşılaşabileceğiniz sorunları en aza indirmek ve birbirinizi daha iyi anlamak için bu 11 kritik konuyu masaya yatırmalısınız.`,
  date: "2025-11-26",
  mainImageKey: "rel_01_main_01",
  sections: [
    {
      id: "lokasyon",
      title: "1. Birlikte Yaşayacağınız Ev ve Lokasyon",
      body: `Çiftlerin en sık tartıştığı konulardan biri, yaşanacak evin ailelere olan coğrafi yakınlığı oluyor. Bazen bir taraf ailesine yakın oturmak isterken diğer eş bu duruma itiraz edebiliyor. Bu nedenle evlenmeden önce hangi lokasyonda ve nasıl bir evde yaşamak istediğinize birlikte karar vermelisiniz.

Ayrıca eşya birleşimini de konuşmalısınız. Eğer kendi evleriniz varsa hangi eşyaların kullanılacağı, hangilerinden vazgeçileceği gibi konuları en başta netleştirin. Duygusal bağları bir kenara bırakarak rasyonel bir bakış açısıyla ortak bir karar almaya çalışın.`,
      imageKey: "rel_01_lokasyon",
    },
    {
      id: "para",
      title: "2. Finansal Hedefler ve Parayla İlişki",
      body: `Para, ne yazık ki pek çok ilişkinin en büyük stres kaynağı. Eşinizin maddi konulara bakış açısını anlamanız ise gelecekteki gerilimleri önlemenin anahtarı. Bu noktada önce alışkanlıklar ve birikim hakkında konuşun. Harcama alışkanlıklarınız, varsa borçlarınız ve birikim yapma eğilimleriniz konusunda birbirinize net olun.

Ortaklık biçimi de evlilikte çok önemli. Bütçeniz ortak mı olacak, yoksa ayrı mı yönetilecek? Bu soruları en başta yanıtlayın. Tabii felsefeniz hakkında da düşüncelerinizi paylaşmalısınız. Para bir araç mı, yoksa bir güvence mi? Sorunun cevabı her ne olursa olsun ortak finansal hedefler belirleyerek ilişkinizde güven ortamı oluşturmalı ve finansal konularda birbirinize uyum sağlamalısınız.`,
      imageKey: "rel_01_para",
    },
    {
      id: "cocuk",
      title: "3. Çocuk Sahibi Olma ve Ebeveynlik Hayalleri",
      body: `Çocuk sahibi olup olmamak, evlilik öncesi en temel ve en hassas konuşmalardan biridir. Bu konudaki beklentileriniz farklıysa evlilik sürecinde ciddi anlaşmazlıklar yaşayabilirsiniz.

Siz ve partneriniz çocuk sahibi olma konusuna aynı çerçeveden mi bakıyorsunuz? Çocuk istiyorsanız sayısı konusunda ortak paydada buluşabiliyor musunuz?

Ayrıca çocukları yetiştirme konusunda da konuşmalısınız. Birbirinize sormanız gereken soru şu: “Çocukları yetiştirme ve disiplin konusunda nasıl bir yol izlemek istiyorsun?”`,
      imageKey: "rel_01_aile",
    },
    {
      id: "catisma",
      title: "4. Çatışmalar Karşısında Verdiğiniz Tepkiler",
      body: `Her çift anlaşmazlık yaşar. Ancak önemli olan bu çatışmaların nasıl çözüldüğü. Sağlıklı bir evlilik için çatışma anlarındaki iletişim tarzınızı uyumlu hâle getirmeniz kritik bir adım.

Partneriniz tartışmayı hemen çözmek isteyen biri mi, yoksa zamana mı ihtiyacı var?
Tartışmalarda geri çekilen, duvar ören biri mi; yoksa aktif olarak konuşmaya çalışan mı?`,
      imageKey: "rel_01_catisma",
    },
    {
      id: "aile",
      title: "5. Aile İlişkileri ve Sınırlar",
      body: `Çiftler arasında en çok çatışmaya neden olan alanlardan biri de orijin ailelerle kurulan ilişkiler.

• Partneriniz ailesine ne kadar bağlı?
• Aile ziyaretlerine ne kadar sıklıkla zaman ayırmak istiyorsunuz?
• Bayram ve özel günleri hangi aileyle, nasıl geçireceksiniz?

Aile ilişkileri konusunda beklentilerinizi ve ortak sınırlarınızı belirlemek, ileride yaşanabilecek hayal kırıklıklarını önlemenizi sağlar.`,
    },
    {
      id: "ev_is",
      title: "6. Ev ve Günlük Sorumlulukların Paylaşımı",
      body: `Günlük ev işleri ve sorumluluklar, zamanla ilişkide yük hâline gelmemeli. Bu nedenle en başta adil bir şekilde paylaşılmalı.

“Kim yemek yapacak, kim faturalarla ilgilenecek?” ve “Ev temizliği ve düzeni nasıl sağlanacak?” gibi konuları açıkça konuşarak her iki tarafın da beklentilerini netleştirin. Böylece ileride duyabileceğiniz “Hep ben yapıyorum.” gibi şikâyetlerin önüne geçebilirsiniz.`,
    },
    {
      id: "kariyer",
      title: "7. Kariyer Hedefleri ve Gelecek Vizyonu",
      body: `Kariyer planları; yaşayacağınız şehri, ekonomik durumunuzu ve evlilik dinamiklerini doğrudan etkileyebilir. Bu sebeple kariyer planlarınızı birbirinizle paylaşmanız, gelecekte daha uyumlu bir ilişki sürdürmeniz için olmazsa olmaz. 

• Eşiniz kariyerinde nasıl bir yol izlemek istiyor?
• İş değişiklikleri, terfiler ya da girişimcilik gibi konularda birbirinizi nasıl destekleyeceksiniz?`,
      imageKey: "rel_01_kariyer",
    },
    {
      id: "vazgecilmez",
      title: "8. Vazgeçilmezler ve Yaşam Tarzı",
      body: `Bazı konular bir kişi için büyük önem taşırken, diğeri için o kadar kritik olmayabilir.

• Dinî inanışlar ve ritüeller,
• Evcil hayvan sahiplenme,
• Yaşanacak şehir veya bölge,
• İş-yaşam dengesi ve tarzı gibi vazgeçilmez konularda nerede durduğunuzu bilmek ve bunları eşinizle paylaşmak, gelecekte sizi büyük çatışmalardan koruyabilir.`,
    },
    {
      id: "bos_zaman",
      title: "9. Boş Zamanı Değerlendirme ve Kişisel Alan",
      body: `Evlilikte işten arta kalan zamanın çoğu birlikte geçirilir. Ancak bu zamanın iki taraf için de keyif veren bir süreç olması gerekiyor.

• Uyumlu musunuz? Partneriniz sosyal aktivitelerden mi hoşlanıyor, yoksa evde vakit geçirmeyi mi seviyor?
• Kendi alanlarınıza ve bireysel ilgi alanlarınıza ne kadar zaman ayırabileceksiniz?

Boş zaman alışkanlıklarınızı anlamak ve ortak noktalar belirlemek, evlilik içinde sağlıklı bir denge kurmanıza yardımcı olur.`,
    },
    {
      id: "karar",
      title: "10. Büyük Karar Alma Mekanizması",
      body: `Evlilik; taşınma, büyük harcama, iş değişikliği gibi hayat boyu alınacak büyük kararlarla doludur.

• Bu tür hayatınızı etkileyen kararları nasıl alacaksınız?
• Her iki tarafın da söz hakkı ve ağırlığı eşit olacak mı?

Bu mekanizmayı en baştan belirlemek, ileride olası anlaşmazlıkların ve güç savaşlarının önüne geçebilir.`,
    },
    {
      id: "sosyal",
      title: "11. Sosyal Çevre ve Arkadaşlık İlişkileri",
      body: `Her ne kadar evlilik “biz” olabilmek olsa da bir o kadar da “ben” kalmayı başarmaktır. Sosyal çevre ve arkadaşlıklar konusunda açık bir şekilde konuşmak ve birbirinizin bireysel alanına saygı duymak, sağlıklı bir evliliğin temelini oluşturur. Bu nedenle evlenmeden önce şu soruların yanıtını netleştirmelisiniz:

• Partnerinizin sosyal çevresi sizin için bir sorun yaratıyor mu?
• Arkadaşlarınızla olan ilişkilerinize ne kadar zaman ve enerji ayıracaksınız?

Tüm bu konuları evlenmeden önce konuşmak, ilişkinizi test etmekten ziyade geleceğinizi birlikte tasarlama süreci. Detayları şeffaflıkla paylaştığınızda kuracağınız ortaklığın temelleri çok daha sağlam olacaktır.`,
      imageKey: "rel_01_sosyal",
    },
  ],
},

// 🏡 Küçük Mutfakları Büyüten Akıllı Düzen Planı
{
  id: "home_01",
  category: "home",
  title: "Küçük Mutfakları Büyüten Akıllı Düzen Planı: İşlevselliği Artıran 7 Etkili Adım",
  summary:
    "Küçük bir mutfağınız olduğu için dert etmenize gerek yok. Birkaç kolay adımla mutfağınızı çok daha kullanışlı hâle getirebilirsiniz!",
  body: `Mutfağınızın düzeni hızlıca hazırlanan sabah kahvaltılarından evde ne sıklıkta yemek yaptığınıza kadar yaşam kalitenizi doğrudan etkiler. Yeni bir yere taşındıysanız ya da mevcut mutfağınızda işleri daha verimli ve kolay hâle getirmek istiyorsanız harekete geçme zamanı!

Küçük bir mutfağı işlevsel, ferah ve kullanışlı bir alana dönüştürmek için uygulayabileceğiniz bir rehber hazırladık. İşte hayatınızı kolaylaştıran bir sistem kurmanın yolları!`,
  date: "2025-11-26",
  mainImageKey: "home_01_main",
  sections: [
    {
      id: "dolap",
      title: "1. Adım: Tüm Dolapları Aynı Anda Boşaltın",
      body: `Düzenleme işine tek tek dolaplarla değil, hepsini aynı anda boşaltarak başlayın. Gerekirse mutfak tezgâhını ve masayı malzemelerle doldurun. Böylece hangi ürüne ne kadar sahip olduğunuza dair net bir resim elde edebilirsiniz. Her şeyi göz önünde bulundurmak, elinizdeki fazlalıkları ve eksikleri fark etmenizin ilk ve en önemli basamağıdır. Eğer bu çok zor gelirse en azından benzer kategorileri toplayıp gruplandırarak ilerlemeyi deneyebilirsiniz.`,
    },
    {
      id: "kategori",
      title: "2. Adım: Benzerleri Gruplandırın ve Kategorilere Ayırın",
      body: `Şimdi benzer olan her şeyi bir araya getirme vakti! Tüm tencere ve tavalar, tüm mutfak robotları, kesme tahtaları, farklı boyutlardaki kaşıklar ve spatulalar... Her bir eşya, kendi arkadaş grubuyla buluşsun. Bu net gruplandırma, eşyaları dolaplara yerleştirdiğinizde düzenin temelini oluşturacaktır.`,
    },
    {
      id: "eleme",
      title: "3. Adım: Vicdanlı Bir Eleme Süreci Başlatın",
      body: `Artık aynı türden ne kadar çok ürüne sahip olduğunuzu net bir şekilde görebiliyorsunuz. Bu aşamada gerçekten ihtiyaç duyduklarınızı ve aktif olarak kullandığınız her şeyden en az birer taneyi ayırın. Ancak spatula gibi sık kullanılan ürünlerden birer tane ayırmamanız gerekiyor. Bu ayırma işlemini ihtiyacınıza göre yapmalısınız. Geri kalanları gözden çıkarın. Onları bağışlayabilir, ihtiyacı olanlarla paylaşabilir veya sevdiklerinize verebilirsiniz. Unutmayın; kullanmadığınız her bir parça, o kısıtlı alanda büyük bir israf demektir.`,
    },
    {
      id: "aliskanlik",
      title: "4. Adım: Kullanım Alışkanlıklarınıza Göre Karar Verin",
      body: `Düzenlemeye başlamadan önce kendinize şu soruları sorun:

• Tabakları bulaşık makinesine mi, yoksa yemek masasına yakın mı tutmak bana kolaylık sağlıyor?
• Kek, kurabiye gibi pastane işlerini ne sıklıkla yapıyorum?
• Hangi mutfak aletine haftada birkaç kez el atıyorum?

Günlük rutininize uygun bir yerleşim planı yapmak, mutfaktaki iş akışınızı inanılmaz derecede kolaylaştırır.`,
      imageKey: "home_01_aliskanlik",
    },
    {
      id: "alan",
      title: "5. Adım: En Değerli Alanları, En Sık Kullanılanlarla Doldurun",
      body: `Mutfağınızdaki en kolay ulaşılabilir raflar ve göz hizasında olan bölümler altın değerindedir. En sık kullandığınız eşyaları öncelikle bu alanlara yerleştirin. Örneğin tek takım hâlindeki o özel kupalar yerine her gün elinizin gittiği favori kahve bardağınızı ön sırada tutun.

Tezgâh üstü de değerli bir alandır. Ancak dikkat! Tezgâhı kalabalıklaştırmak tüm mutfağın dağınık görünmesine yol açar. Eğer günde birkaç kez kahve içiyorsanız makineniz kalabilir. Ama nadiren kullandığınız cihazları bir dolaba kaldırmak, daha ferah bir görünüm sağlar.`,
    },
    {
      id: "uzaklastir",
      title: "6. Adım: Daha Az Kullanılanları Gözden Uzaklaştırın",
      body: `Daha seyrek kullandığınız eşyalar, ulaşılması biraz daha zor olan üst raflara veya dolapların arka kısımlarına yerleştirilebilir. Bu kurala göre yerleştirme yaptığınızda ortada kalan eşyalarınız zaten nadiren kullandığınız parçalar olacaktır. Mesela yılda bir kez çıkardığınız dondurma makinesini mutfak dolaplarına koymak yerine evdeki daha yüksek veya az kullanılan bir rafa kaldırarak mutfakta nefes alacak yer açabilirsiniz.`,
    },
    {
      id: "saklama",
      title: "7. Adım: Yaratıcı ve Dikey Saklama Çözümleri Oluşturun",
      body: `Eşyalarınızı yerleştirdiniz, şimdi sıra ince ayar yapma zamanında! Çekmece bölücüler, kapak içlerine monte edilen kancalar ve dikey saklama kutuları bu aşamada hayat kurtarıcıdır. Bir şeyi ararken diğerlerinin üzerine yığılmamak için çekmece bölücüleri kullanarak kaşıkları, spatulaları kategorilere ayırın. Ayrıca dikey düzenlemeyi tercih edin. Üst üste yığılmış tepsiler yerine tıpkı dosyalar gibi dizilen kesme tahtaları ve tepsiler çok daha kullanışlıdır.

Gereksiz kalabalıktan kurtulup kendi yaşam alışkanlıklarınıza göre bir düzen oluşturduğunuzda ortaya çıkan tablo şudur: Her şeyin bir yeri vardır ve her şey yerli yerindedir. Artık biri sizden o küçük fındık kıracağını istediğinde "Sol çekmecede, bölücünün en arkasındaki küçük gözde" diyebiliyorsanız mutfağınız sizi yansıtan ve kusursuz işleyen bir düzene kavuşmuştur!`,
      imageKey: "home_01_saklama",
    },
  ],
},

// 💅 Evde Ayak Bakımı
{
  id: "beauty_01",
  category: "beauty",
  title: "Evde Ayak Bakımı: Ölü Derilerden Arınmanın Doğal ve Etkili Yolları",
  summary:
    "Yumuşacık ayaklara sahip olmak için illa güzellik merkezlerinde zaman harcamanıza gerek yok. Evde kolayca yapabileceğiniz bu tüyolarla ayaklarınızdaki ölü derilerden kurtulabilirsiniz!",
  body: `Ayaklarınız gün boyunca sizi taşıyor, peki siz onlara yeterince ilgi gösteriyor musunuz? Kuruyan, sertleşen ve çatlayan deriler yalnızca estetik değil; sağlık açısından da sorun yaratabilir. Evde kolayca uygulayabileceğiniz doğal yöntemlerle ölü derilerden arınabilir, ayaklarınıza yeniden yumuşaklık ve canlılık kazandırabilirsiniz. İşte ponza taşından sirke banyosuna, peeling çoraplarından Epsom tuzuna kadar hem pratik hem etkili çözümler…`,
  date: "2025-11-26",
  mainImageKey: "beauty_01_main",
  sections: [
    {
      id: "ponza",
      title: "Ponza Taşı ile Doğal Temizlik",
      body: `Volkanik kökenli yapısı sayesinde nasır ve sertleşmiş derilerin giderilmesinde oldukça etkili olan ponza taşı, ayak bakımında klasik ama güçlü bir yardımcıdır. Ilık suyun içinde birkaç dakika bekletilen ayaklar, yumuşayan derileriyle işleme hazır hâle gelir. Bu noktada taşın ıslatılması da önemli çünkü kuru uygulamalar cilde zarar verebilir. Ponza taşını nazikçe, dairesel hareketlerle uygulayarak yalnızca ölü derileri hedefletmelisiniz. İşlemin ardından uygulayacağınız doğal yağlar veya nemlendirici kremler, ayak bakımınızı tamamlayacaktır. Ancak tahriş olmuş ya da yaralı bölgelere uygulamamanız gerektiğini hatırlatalım. Aksi takdirde cildinizde hasar oluşabilir.`,
    },
    {
      id: "parafin",
      title: "Parafin Mumu ile Spa Konforu",
      body: `Salonlarda uygulanan sıcak mum deneyimini ev ortamına taşımak hem keyifli hem  etkili bir bakım alternatifi sunar. Parafin mumu dikkatlice eritildikten sonra (yaklaşık 51°C'de), el yakmayacak kadar ılık olduğunda ayaklarınızı birkaç kez muma batırın. Ardından oluşan katmanları streç filmle sarın ve bekleyin. Soğuyup sertleşen mumu çıkardığınızda, yüzeydeki ölü derilerin de onunla birlikte ayrıldığı göreceksiniz. Bu yöntem nem kaybını önlerken cildi yumuşatır ve pürüzsüzleştirir.

Ancak diyabet hastaları, dolaşım bozukluğu yaşayanlar ya da açık yarası bulunanlar bu yöntemi doktor kontrolü olmadan denememeli. Ayrıca yanıkları engellemek adına mumun sıcaklığını ölçmek için termometre kullanmanız gerektiğini de hatırlatalım.`,
    },
    {
      id: "peeling",
      title: "Ev Yapımı Doğal Peeling Formülü",
      body: `Ayaklarınız için özel ürünleri satın almak yerine doğal içeriklerle kendi peeling karışımınızı oluşturabilirsiniz. Deniz tuzu, bebek yağı ve birkaç damla limon suyuyla hazırlanan bu karışım; ölü derilerden arınmanın nazik bir yolunu sunar. Bu noktada limonun asidik yapısı nedeniyle miktarını abartmamak ve sonrasında güneşle temas konusunda dikkatli olmanız gerekiyor. Peeling işlemi sonrası ılık suyla durulama yapmayı ve mutlaka nemlendirici ile cildinizi desteklenmeyi de unutmayın. Bu sayede cildiniz hem canlanır hem dış etkenlere karşı korunmuş olur.`,
      imageKey: "beauty_01_peeling",
    },
    {
      id: "yulaf",
      title: "Yulaf Ezmesiyle Nazik Arındırma",
      body: `Yulaf ezmesi yalnızca beslenmede değil, cilt bakımında da etkileyici bir rol oynar. Süt veya gül suyuyla karıştırılarak elde edilen kıvamlı macunu ayaklarınıza uygulandığınızda hem ölü derileri yumuşatır hem cildinizi beslersiniz. Yaklaşık yarım saatlik bekleme süresinin ardından, ayak fırçası ile yapacağınız hafif bir peeling işlemi, arınmayı tamamlayacaktır. Son olarak ayak kreminizi sürerek uygulamanın etkisini pekiştirebilirsiniz. Bu yöntemi haftada birkaç kez düzenli olarak uygulandığınızda ayaklarınızda gözle görülür bir yumuşama elde edebilirsiniz.`,
    },
    {
      id: "epsom",
      title: "Epsom Tuzu ile Ayaklarınızı Şımartın",
      body: `Epsom tuzu, içeriğindeki magnezyum sülfat sayesinde yalnızca kasları gevşetmekle kalmaz; aynı zamanda ölü derilerin yumuşamasını da destekler. Bu yöntem için ilk olarak ılık suyla doldurulmuş bir leğene yarım su bardağı kadar Epsom tuzu eklemelisiniz. Hazırladığınız bu karışımda ayaklarınızı 20 dakika bekleterek günün yorgunluğunu atarken aynı zamanda ayaklarınıza bakım da yapabilirsiniz. Bu süreçte cildiniz yumuşayacaktır. Ardından peeling veya ponza taşı uygulaması yapmanız çok daha etkili olacaktır. Ayrıca duş sırasında tuzu birkaç kaşık zeytinyağı veya duş jeliyle karıştırılarak ayaklarınıza da uygulayabilirsiniz. Böylece masaj etkisi elde edebilir, yanihem kan dolaşımını artırabilir hem pürüzsüz ayaklara kavuşabilirsiniz.`,
    },
    {
      id: "sirke",
      title: "Sirke Banyosuyla Doğal Yumuşama",
      body: `Sirkenin asidik yapısı, ayaktaki kurumuş ve kalınlaşmış derinin nazikçe arındırılmasına yardımcı olur. Bunun için iki ölçü soğuk su ve bir ölçü sirkeyle hazırlayacağınız karışımda ayaklarınızı 5-10 dakika bekletmeniz yeterli. Sıcak yerine soğuk suyu tercih etmemeye özen gösterin Çünkü sıcak su cildi daha da kurutabilir. İşlem sonrasında ponza taşı ile yapılan hafif ovma, ölü derilerin atılmasına katkı sağlar. Sonrasında nemlendirici ürünler veya doğal yağlar ile cildi yatıştırabilir ve nemi hapsedebilirsiniz. Özellikle bakım sonrası pamuklu çorap giymek, bu etkinin uzun süreli olmasını sağlar. Ancak haftada iki ya da üç defadan fazla uygulamamanız gerekiyor. Çünkü sirkenin kurutucu etkisi cilt bariyerini zayıflatabilir.`,
      imageKey: "beauty_01_sirke",
    },
    {
      id: "corap",
      title: "Peeling Çoraplarıyla Derin Temizlik",
      body: `Ayak bakımında teknolojik ve pratik çözümler arayanlar için peeling çorapları da oldukça ideal bir yöntem. Meyve asitleri ya da özel jeller içeren bu ürünler, ayaklara bir saat boyunca giyildikten sonra birkaç gün içinde ölü derilerin kendiliğinden soyulmasını sağlar. Bu süreçte ayakların her gün suyla temas etmesi, soyulma hızını artırır ve cildin yeni, sağlıklı tabakasının ortaya çıkmasını kolaylaştırır. Ürünlerin talimatlarına sadık kalmak bu yöntemin güvenli ve etkili şekilde uygulanmasını sağlar. 

Ancak bir uyarıda bulunmanın faydalı olacağını düşünüyoruz. Çünkü bu tarz ürünlerin çoğu istenen etkiyi göstermeyebiliyor. Çoğu ürün yoğun nasır gibi sorunlar için etkili çözüm sunuyor. Bu nedenle ürün seçiminde doğru tercih yapmalısınız.`,
    },
  ],
},

// 🤸‍♀️ Neden Fonksiyonel Antrenman Yapmalısın?
{
  id: "sport_01",
  category: "sport",
  title: "Neden Fonksiyonel Antrenman Yapmalısın?",
  summary:
    "Sağlıklı bir zihin ve beden için sport şart. Peki, hangi sporu yapmak gerekiyor? Eğer sen de bu sorunun cevabını arıyorsanız fonksiyonel antrenmana bir şans verebilirsin. İşte fonksiyonel antrenman yapman için nedenler!",
  body: `Pek çoğumuz daha fit ve sağlıklı görünmek için spor programlarına yöneliyoruz. Ancak aslında form tutmak sadece dış görünümle sınırlı olmamalı. Spor yaparken sağlıklı bir bedeni de hedeflememiz gerekiyor. Uygun bir antrenman yalnızca fiziksel görünümümüzü iyileştirmekle kalmaz, aynı zamanda genel sağlığımıza da güçlü katkılar sağlar.

İşte bu noktada fonksiyonel antrenmanlar devreye giriyor. Bedene uygun yapısı ve günlük yaşamdaki hareketliliği desteklemesi, onu en etkili ve uzun vadeli yöntemlerden biri hâline geliyor. `,
  date: "2025-12-01",
  mainImageKey: "sport_01_main",
  sections: [
    {
      id: "hedef",
      title: "1. Hedefe Uygun Programlarla Daha Etkili Sonuçlar",
      body: `Fonksiyonel antrenmanın en güçlü yönlerinden biri, tamamen kişiye özel planlarla ilerlemesi. Çünkü bu antrenman türü; fiziksel özelliklerin, sağlık durumun ve net hedeflerin göz önünde bulundurularak uzmanlar eşliğinde hazırlanıyor. Bu noktada boy, kilo, yaş, vücut tipi ve kondisyon düzeyi değerlendiriliyor. Böylece sana özel oluşturulan bu programlar sayesinde hedefine ulaşman kolaylaşıyor ve gereksiz sakatlık riskleri en aza iniyor.

Unutma, program hazırlanırken sadece fiziksel verilerin değil, aynı zamanda yaşam tarzın ve isteklerin de dikkate alınır. Böylece kendini zorlamadan, sürdürülebilir ve güvenli bir antrenman rutini oluşturursun.`,
    },
    {
      id: "kas",
      title: "2. Kas Gücüne Uygun ve Güvenli Egzersizler",
      body: `Fonksiyonel antrenmanlarda egzersizler, mevcut kas gücüne göre planlanıyor. Bu akıllı yaklaşım, vücudunu aşırı zorlamadan kas yapını adım adım güçlendirmene olanak tanıyor. Özellikle tendon gibi hassas bölgelerde meydana gelebilecek sakatlıkların önüne geçmek için çok değerli. Ayrıca kas gücüne uygun hareketlerle çalışman hem daha uzun soluklu hem daha verimli bir egzersiz süreci geçirmeni sağlıyor. Böylece gereksiz yorgunluk hissetmeden, istikrarlı biçimde ilerlemeye devam edersin.`,
      imageKey: "sport_01_kas",
    },
    {
      id: "deneyim",
      title: "3. Spora Bakış Açını Değiştirebilecek Bir Deneyim",
      body: `Sporla ilişkisi zayıf olan bireylerin büyük bir kısmı, geçmişteki olumsuz deneyimler nedeniyle egzersize mesafeli yaklaşıyor. Ancak fonksiyonel antrenman bu algıyı dönüştürme potansiyeline sahip. Peki, nasıl?

Eğlenceli grup çalışmaları, müzikli seanslar veya yaratıcı ekipmanlar sayesinde antrenmanlar daha keyifli hâle gelebiliyor. Üstelik başlangıç seviyesinde bile aşırı zorlamayan egzersizlerle spora ısınman çok daha kolay oluyor. Bu sayede spor, listendeki zorunlu bir görevden çıkarak kendine ayırdığın kaliteli bir zaman dilimine dönüşebiliyor.`,
    },
    {
      id: "coklu",
      title: "4. Çoklu Kas Gruplarını Aktif Eden Hareketler",
      body: `Fonksiyonel antrenmanların en dikkat çekici yönlerinden biri de aynı anda birden fazla kas grubunu çalıştırması. Örneğin fonksiyonel antrenmanlarda sıklıkla kullanılan squat hareketi bile tek başına kalça, bacak, karın ve sırt kaslarını birlikte çalıştırıyor. 

Bu hem zaman açısından verimli bir egzersiz sunuyor hem genel vücut direncini artırıyor. Fonksiyonel antrenman yaptığında yalnızca kilo vermekle kalmıyorsun, aynı zamanda yağ oranın düşüyor ve kas kütlen de artıyor. Böylece daha sıkı ve sağlıklı bir vücut formuna ulaşman mümkün oluyor. Yani metabolizma hızlanıyor; "skinny fat" olarak adlandırılan kas oranı düşük, yağ oranı yüksek vücut görünümünün önüne geçmek kolaylaşıyor.`,
      imageKey: "sport_01_coklu",
    },
    {
      id: "denge",
      title: "5. Güçlü Bir Denge",
      body: `Günlük yaşamda sıkça yaptığımız yürüyüş, merdiven çıkmak, eğilip kalkmak gibi pek çok hareket aslında denge kontrolü gerektirir. Fonksiyonel antrenmanlarda da denge geliştirmeye yönelik egzersizlere sıkça yer veriliyor. Bu egzersizler refleksleri güçlendiriyor, sakatlanma riskini azaltıyor ve daha güvenli hareket etmeyi sağlıyor.`,
      imageKey: "sport_01_denge",
    },
  ],
},

// 🌿 Karma Felsefesi ve Yaşamımıza Etkileri
{
  id: "well_01",
  category: "wellbeing",
  title: "Karma Felsefesi ve Yaşamımıza Etkileri: Karma İnancı Nedir?",
  summary:
    "İnsanlık, anlamlı bir yaşam sürme isteğiyle varoluşun derinliklerine inmiyor ve bu yolculuk bazen kişisel bir keşfe dönüşebiliyor. Yolculuk her birey için farklı ama kadim öğretiler, tüm insanlığa yol gösteriyor. Söz konusu öğretilerin başında ise evrenin ruhsal yasalarından biri olan karma yasası yer alıyor.",
  body: `Karma felsefesi çoğu zaman, toplumda bir "ahlaki adalet sistemi" olarak yanlış anlaşılır. Bu sınırlı bakış açısı, karma anlayışını sadece ödül ve ceza ile ilişkilendirir. Ancak doğru bir şekilde anlaşıldığında karma, evrenin sunduğu en değerli bilgeliği sunabilir. Karma, bireyin ruhsal gelişim yolculuğunu destekler ve hayatını dönüştürme gücünü kazanmasına yardımcı olabilir. Peki, karma felsefesi aslında neyi anlatır? `,
  date: "2025-12-02",
  mainImageKey: "well_01_main",
  sections: [
    {
      id: "karma",
      title: "Karma Nedir?",
      body: `Kelime olarak "karma", Sanskritçede "eylem" ya da "faaliyet" anlamına gelir. "Karma" kelimesi, "kri" (eylem) kökünden türetilmiş ve temelde sonuç doğuran eylemlerle ilgili bir kavram. Ancak bu eylemler yalnızca fiziksel hareketlerle sınırlı değil. Karma felsefesi, kişinin zihinsel ve duygusal eylemlerini de içerir. Kısacası bir kişinin düşünsel, fiziksel ve duygusal eylemlerinin birleşimi; onun karmasını oluşturur.

Spiritüel bir kavram olarak baktığımızda ise karma, her bireyin eylemlerinin ve bu eylemlerin sonuçlarının, yaşamını etkileyip yönlendirdiğini savunur. Bu bakış açısıyla sadece “Ne ekersen onu biçersin” anlayışından çok daha derin bir anlam taşır. Sadhguru bu kavramı şöyle özetler: "Karma, kaderiniz tarafından yönlendirilmeden onu değiştirebileceğiniz anlamına gelir."

Sadhguru, karma ile ilgili en büyük yanılgının, iyiliklerin ve kötülüklerin bir tür kaydının tutulduğuna dair yaygın algı olduğunu belirtir. Bu algı, eylemlerin karşılığını almak adına kaçışın olmadığına işaret eder. Yani karma, ödül ya da ceza ile ilgilenmez; bireyin kendisinin oluşturduğu bir döngüden bahseder. Kişinin niyeti ve yaşadığı olaylara verdiği yanıtların toplamıdır. Ayrıca bireyin bilinçsiz bir şekilde davranışsal kalıpları takip etmesi durumunda, onu bir çıkmazın içine sürükleyebileceğini de öngörür. Sadhguru, karmanın farkındalık ve odaklanma ile yönlendirilebileceğini ifade eder. Yüksek bilinçle yapılan her eylemin karmayı dönüştürebileceğini söyler. Bu şekilde birey, hayrına olacak eylemleri ve bilinçli tercihleriyle hayatını yönlendirebilir.`,
    },
    {
      id: "din",
      title: "Karmanın Dinlerdeki Yeri",
      body: `Karma inancı özellikle Hinduizm, Budizm ve Jainizm gibi geleneksel öğretilerde büyük bir öneme sahiptir. "Karma nedir?" sorusu Hinduizm’de yeniden doğuş (Samsara) sürecinin etik yönüyle ilişkili. Hindu inanışına göre bireyin iyi ya da kötü eylemleri, sonraki hayatlarını doğrudan etkiler. Reenkarnasyonun ardından ruh, geçmiş karmasını miras alır. Bu sebeple Hinduizm'de karma, evrensel bir nedensellik yasası olarak işler.

Budizm, karma inancını farklı bir perspektiften ele alır. Buddha’nın öğretisinde ruhun ve benliğin olmadığı fikrine dayanır. Budizm'e göre benlik, maddi dünyayla etkileşim sonucunda var olur ve dolayısıyla "gerçek" değildir. Bu sebeple karma da kalıcı değildir. Buna rağmen her iki öğreti de karmanın özerk bir nedensellik yasası olarak işlediğini kabul eder. Hiçbir dış güç, bireyin eylemlerinin ve sonuçlarının arasına müdahale edemez.

Jainizm'deki karma anlayışı ise Batı'da yaygın olan karma anlayışından tamamen farklı. Jainizm’e göre bilinç ve karmanın etkileşime girmesi, hayatı deneyimleyebilmek için gerekli. Jainizm felsefesine göre ruhun bilincini çevreleyen tüm süptil maddeler, karmayı oluşturur. 

Karmanın benzer bir biçimde Yahudilik, Hristiyanlık ve İslamiyet gibi İbrahimî dinlerde de yer bulduğu görülür. Ancak bu dinlerde karma kavramı; insan eylemlerinin sonuçlarının, ilahi bir otoriteye bağlı olarak şekillendiği bir yapıya sahiptir diyebiliriz.`,
    },
    {
      id: "yasa",
      title: "Karma Yasası Nasıl İşler?",
      body: `Karma inancına göre her eylemin mutlaka bir sonucu vardır. Bu sonuçlar tahmin edilemez olsa da kozmik dengeyi sağlamak için belirli bir düzende meydana gelir. Sonuçlar, bireyin evrimsel gelişimini ve ilerlemesini sağlayacak şekilde düzenlenir.

Karma, bilinçli eylemlerden çok kişinin tepkilerinden oluşur. Bu anlayış, "iyi ve kötü karma" kavramını ortadan kaldırır. Karmanın işleyişine göre bir durumda iki sonuç ortaya çıkar: Ya bir ilerleme kaydedilir, ya da ilerlemek için gerekli ders alınır. Yani bireyin kendisini gözlemlemesi ve ne yapması gerektiğini anlaması için bir fırsat sunar.

Karmanın 12 temel yasası vardır. Bu yasalar, bireyin farkındalığını artırarak bütünün hayrına nasıl davranılacağını gösteren “günlük yaşam kılavuzları” olarak değerlendirilebilir. Karma yasalarının doğru anlaşılması sadece içsel gelişimi değil, aynı zamanda modern dünyada bu bilgeliklerin nasıl uygulanabileceğini de kolaylaştırır.`,
    },
    {
      id: "buyuk",
      title: "1. Büyük Yasa (Neden-Sonuç Yasası)",
      body: `Büyük Yasa, evrende yapılan her eylemin bir karşılık bulduğunu ve ne verirseniz onun size döneceğini ifade eder. Kişi, iyi ya da kötü tüm eylemleriyle evrenle bir denge yaratır. Bu denge, yaşamın her alanında kendini gösterir.`,
    },
    {
      id: "yaratim",
      title: "2. Yaratım Yasası",
      body: `Yaratım Yasası, bireyin hayatına etki etme gücünü vurgular. Kişinin kendisine ve çevresine kattıklarıyla dünyayı şekillendirebileceğini anlatır. Her birey, dünyaya sunduğu katkılarla bütüne bir parça sunar. Yani kişinin yapacaklarıyla yaşamının nasıl bir yön alacağı, tamamen onun seçimlerine bağlıdır. Kısacası bu yasa, bireye yaşamını yönlendirme gücünü bir tür sorumluluk hissiyle birlikte sunar.`,
      imageKey: "well_01_yaratim",
    },
{
      id: "alcak",
      title: "3. Alçak Gönüllük Yasası",
      body: `Alçak gönüllülük, ruhsal büyümenin temel taşlarındandır. Karma; bireyin farkındalık düzeyinin arttığı, ruhsal bir olgunluk kazandığı bir yolculuk gerektirir. Alçak Gönüllülük Yasası; şu anki gerçekliğinizin, geçmiş eylemlerinizin bir sonucu olduğunu kabul etme yeteneğiyle ilgilidir. Kişi, geçmişindeki hataları ve başarıları olduğu gibi kabul ederek kendisini daha ileriye taşıyacak bir gelişim sürecine girebilir.`,
    },
{
      id: "kisisel",
      title: "4. Kişisel Gelişim Yasası",
      body: `Gerçek bir değişim dış dünyada değil, iç dünyada başlar. Kişisel Gelişim Yasası, bireyin önce kendi içindeki değişime açık olması gerektiğini vurgular. Büyümenin sadece bireysel değil, aynı zamanda ruhsal bir yolculuk olduğunu anlatır. Değişim ve büyüme, kişinin kendisinden başlar; dış dünya ancak içsel bir farkındalıkla değiştirilebilir.`,
    },
{
      id: "sorumluluk",
      title: "5. Sorumluluk Yasası",
      body: `Karma, her bireyi yaptığı seçimlerin sonuçlarından sorumlu tutar. Bu yasa; yaşamdaki tüm deneyimlerin, yapılan seçimlerin bir ürünü olduğunu hatırlatır. Bireyi; hayatının kontrolünü elinde tutmaya, seçtikleri doğrultusunda yaşamını şekillendirmeye davet eder. Hayatın sorumluluğunu almak, kişi için büyük bir özgürlük ve güç kaynağıdır.`,
      imageKey: "well_01_sorumluluk",
    },
{
      id: "baglanti",
      title: "6. Bağlantı Yasası",
      body: `Her şeyin birbirine bağlı olduğu bilinci, insanın yaşamını anlamlı kılar. Bağlantı Yasası, tüm varoluşun birbiriyle etkileşim hâlinde olduğunu hatırlatır. Bireye, büyük bir değişim yaratabilmek için harekete geçmesi gerektiğini söyler. Her adım, bütüne katkı sağlamak için bir fırsattır. Bu nedenle her eylem, tüm evrende yankı bulur.`,
      imageKey: "well_01_baglanti",
    },
{
      id: "odak",
      title: "7. Odak Yasası",
      body: `Odaklanma, karma yasalarından bir diğer önemli unsuru. Bu yasa, bir hedefe ulaşmak için doğru anı ve doğru yolu bulmayı gerektirir. Odak Yasası, özellikle doğru zamanda doğru şeylere odaklanmayı, dikkatin dağılmaması gerektiğini vurgular. Hayat, doğru yönlendirmelerle ilerler; bu da ancak net bir odak ile mümkün olur.`,
    },
{
      id: "comert",
      title: "8. Cömertlik Yasası",
      body: `Gerçek erdem sadece sözlerle değil, eylemlerle ortaya çıkar. Cömertlik Yasası; bireyi, iyiliği ve doğruyu yaşama geçirmeye çağırır. Sadece düşünsel değil, aynı zamanda fiziksel bir eylem gerektirir. İyilik yapmak ve dünyada değişim yaratmak için cömert bir şekilde harekete geçmek gerekir. Cömertlik sadece maddi değil, manevi anlamda da yaşamı zenginleştiren bir yaklaşımdır.`,
    },
{
      id: "su",
      title: "9. “Şu An” Yasası",
      body: `Meditasyon ve mindfulness öğretilerinin de temelinde yatan bu yasa, insanlara "şu an"ı yaşayarak gerçek mutluluğa ulaşmayı öğretir. Geçmişin ve geleceğin yükünden kurtulup sadece mevcut anı yaşamaya odaklanmak gerekir. Çünkü sahip olduğumuz tek gerçek zaman dilimi, içinde bulunduğumuz andır. Bu yasa, farkındalık seviyesinin artmasına ve yaşamın her anının daha değerli hâle gelmesine yardımcı olur.`,
      imageKey: "well_01_ruh",
    },
{
      id: "degisim",
      title: "10. Değişim Yasası",
      body: `Değişim, evrenin en doğal süreci. Karma, değişim karşısında direnmenin anlamsız olduğunu gösterir. Bu yasa, sürekli tekrarlanan kalıpların fark edilmesiyle değişimin mümkün olacağını anlatır. Birey, hayatındaki değişimlere direnmek yerine değişimi kabul ederek gelişimini sürdürebilir. Karma, değişimle uyum içinde olmayı ve bu süreçte büyümeyi teşvik eder.`,
    },
{
      id: "sabir",
      title: "11. Sabır Yasası",
      body: `Sabır Yasası, evrenin sabır gösterenlere zamanla ödüller sunduğunu belirtir. Her çaba karşılık bulur, ancak bu bazen zaman alabilir. Gayretin karşılığının alınacağına dair bir inanç ve sabır gerektirir. Evren, doğru çabayı gösterenlere önünde sonunda yolunu açacaktır.`,
    },
{
      id: "onem",
      title: "12. Önem ve İlham Yasası",
      body: `Her birey, bu dünyada bir amaca hizmet eder. Önem ve İlham Yasası, kişinin hayatına kattığı her şeyin değerli olduğunu ve her bireyin benzersiz bir misyonla dünyaya geldiğini anlatır. Bu nedenle kişinin yaşamına anlam katmasının yanı sıra başkalarına da ilham verecek şekilde hareket etmesi gerektiğini hatırlatır.`,
    },
{
      id: "temiz",
      title: "Kötü Karma Nasıl Temizlenir?",
      body: `Karma yasasını içselleştirirseniz kişisel karmayı fark etmeniz daha kolay hâle gelir. Kötü karma aslında zihinsel, duygusal ve fiziksel eylemlerimizin bir sonucu. Bu karmayı temizlemek için ruhsal büyümeye niyet etmek, hayatı daha bilinçli bir şekilde yaşamak ve daha erdemli alışkanlıklar geliştirmek gerekiyor. Bu süreçte ise evrensel ilkelere uymaya çalışmak; öz benliğinizle tanışmanıza, iç ışığınızı keşfetmenize ve yaşamın derinliklerine inmenize yardımcı olabilir.

Peki, bu arınma yolculuğunda pratik olarak neler yapabiliriz? Gelin, karmayı temizlemenin ve ruhun yüklerinden arınmanın yollarına yakından bakalım:

Karmanızı Tanımlayın ve Köküne İnin: Her birimiz, bizi aynı istenmeyen durumlarda kilitleyen benzersiz karmik bağlara sahibiz. Karmadan kurtulmak ve bu döngüyü tersine çevirmek için atılacak ilk adım, yaşamınızın "durgun" veya "sıkışmış" hissettiren alanlarını dürüstçe belirlemektir.

    • Kariyerinizde bir türlü ilerleyemiyor musunuz?
    • İlişkileriniz hep aynı noktada mı tıkanıyor?
    • Bazı aile üyeleriyle uzun süredir aynı tartışmaları mı yaşıyorsunuz?

Bu engelleriniz üzerinde dürüstçe düşünün ve probleminizin tam olarak nerede başladığını anlamaya çalışın. Sorunun köküne inmek, kendinizi karmik düğümlerinizden kurtarmanın ve gerçek potansiyelinize doğru ilerlemenin başlangıcıdır.

Toksik İnsanlarla Bağınızı Koparın ve Sınır Koyun: Hayat zaten yeterince karmaşık. Bir de yanlış insanların enerjinizin akışını bozmasına izin vermeyin! Başka bir kişinin enerjisi size "doğru" gelmiyorsa ve sürekli olarak stres yaratıyorsa kendinize ve karmanıza bir iyilik yapıp onların kendi yollarına gitmesine izin vermelisiniz. Bu durum, o kişiyle kötü bir ilişki kurmanız gerektiği anlamına gelmez. Kibarca ve saygılı bir şekilde kendinizi, size yarardan çok zarar veren insanlardan uzaklaştırmalı ve aranıza net sağlıklı sınırlar koymalısınız.

Hatalarınızdan Ders Çıkarın ve Sorumluluk Alın: Madalyonun diğer yüzüne bakarak yanlışlarınızı kabul ettiğinizde enerji alanınızdaki değişimi anında hissedeceksiniz. Sorumluluk almak zor olabilir çünkü egonuz suçlanmayı kabul etmeyi sevmez. Bu işe yavaş yavaş başlayın. Mesela geçmiş hatalarınızı gözden geçirin. Bir dahaki sefere benzer bir durum ortaya çıktığında işleri nasıl daha farklı yapabileceğinizi düşünün. Bu, geçmişte kaldığınız anlamına gelmez. Gelecekte benzer bir kararla karşılaştığınızda ilk önce karmanıza danışmaya söz vermek demektir.

Affetmeyi Öğrenin ve Öfkeyi Bırakın: Kötü karma, kızgınlık ve öfke duygularından beslenir ve size gücenmeniz için neden veren insanları hayatınıza çekmenize yol açar. Sürekli aynı olumsuzluk çarkından neden kaçamadığımızı merak ederiz. Oysa bizi bu tür döngülere sürükleyen, bırakamadığımız duygularımızdır. Affetmek; içimizde barındırdığımız öfke, acı ve hayal kırıklığından kendimizi özgürleştirmektir. Başkasını değil, öncelikle kendinizi affetmeyi öğrenin.

Ruhunuzu Besleyen Eylemler Gerçekleştirin: İyi hissettiren şeyler yaparak içinizdeki çocuğu rahatlatın ve enerji seviyenizi yükseltin. Karmayı temizlemek sadece büyük kararlar almakla değil, günlük küçük eylemlerle de mümkündür.Bunun için besleyici yiyecekler tüketebilir, düzenli egzersiz yapabilir, uyku kalitenize özen gösterebilir ve her gün meditasyon yaparak kendinizle baş başa kalacağınız bir zaman dilimi ayırabilirsiniz.

Zayıf Yönlerinize Nazikçe Meydan Okuyun: Doğal olarak kendimizi bazı alanlarda zayıf, bazı alanlarda ise güçlü hissederiz. Farkına varmadığınız şey, zayıf yönlerinizin de aslında gizli güçleri olduğudur. Onlar da en az güçlü özellikleriniz kadar sizi tanımlar. Güvenlik açıklarınızın "kurbanı" olmayın. Bu durum, hassasiyetlerinize etki eden her türlü karmik senaryoyu davet eder. Bunun yerine düşüşlerinize karşı koyma ve karmik kalıpların dizginlerini ele alma cesaretini gösterin.

Eski Yöntemlerinizi Sorgulayın ve Yeni Yollar Geliştirin: Bazen belirli bir durumun içinde o kadar sıkışıp kalıyoruz ki gözümüzün önünde olan olumsuzlukları görmekte zorlanıyoruz. Kendinizi yavaşlatın ve eski yöntemlerinizin size artık fayda sağlamadığını fark edin. Aynı eylemlerden farklı sonuçlar beklemek, karmik döngüden çıkmanızı engeller. Yeni bakış açıları ve yeni yöntemler geliştirmek, farkındalık yaratır ve size döngüyü kırma gücü verir.`,
      imageKey: "well_01_temiz",
    },
  ],
},

// 👗 Moda Değil, Stil Kalıcıdır: 8 Adımda Stilinizi Oluşturun
{
  id: "fa_01",
  category: "fashion",
  title: "Stil Oluşturma Rehberi",
  summary:
    "Stilimiz bizim hakkımızda çok şey anlatır. Bu nedenle kendimizi doğru ifade eden, bir yandan da büyük paralar harcamadan bir tarz oluşturmamız önemli. Peki, nasıl?",
  body: `Stil sahibi olmak yalnızca üzerinize geçirdiğiniz şık kıyafetlerle ilgili değildir. Aynı zamanda kendinizi ifade etmenin en estetik ve güçlü yollarından biridir. Seçtiğiniz kombinlerle dış görünüşünüzün yanı sıra enerjinizi, karakterinizi ve duruşunuzu da etrafa yansıtırsınız.

Peki, her kombinde kendi imzanızı atmak ve öz güveninizi en iyi şekilde göstermek için hangi noktalara dikkat etmelisiniz? İşte sezonlar değişse bile geçerliliğini koruyacak, stil sahibi olmanın olmazsa olmazları!`,
  date: "2025-12-02",
  mainImageKey: "fa_01_main",
  sections: [
    {
      id: "tani",
      title: "1. Kendinizi Tanıyın ve Vücut Tipinize Uygun Giyinin",
      body: `Kabul edelim ki her vücut tipi eşsiz ve kendine özeldir. Stil sahibi görünmenin ilk adımı da bu özelliklerin farkına varmaktan geçer.

    • Eğer armut tipi bir vücudunuz varsa dikkatleri omuz ve üst bedene çeken parçalar seçebilirsiniz.
    • Elma tipi bir vücudunuz varsa beli saran veya belirginleştiren kesimlerle orantı sağlayabilirsiniz.

Size yakışanı bilmek, her sezon hızla değişen trendlere karşı oluşturabileceğiniz en güçlü stil duruşudur.`,
    },
    {
      id: "gard",
      title: "2. Gardırobunuzu Zamansız, Temel Parçalarla Oluşturun",
      body: `Moda rüzgârı gelir geçer ama bazı parçalar her zaman gardıropların kilit noktası olarak kalır. Kaliteli ve zamansız parçalarla donatılmış bir gardırop, kombin yapmayı hem kolaylaştırır hem kombinleri çok daha zarif kılar.

    • Beyaz gömlek,
    • Siyah blazer ceket,
    • Kaliteli ve düz kesim bir jean,
    • Siyah veya bej sade bir elbise gibi temel parçalar, stilinizin sağlam omurgasını oluşturacaktır.`,
      imageKey: "fa_01_gard",
    },
    {
      id: "aksesuar",
      title: "3. Aksesuarlarla Kombininize Karakter Katın",
      body: `Bir kombini sıradanlıktan çıkarıp "sadece size ait" hâle getiren en güçlü detaylar, doğru seçilmiş aksesuarlardır. Seçtiğiniz bir kolye, dikkat çekici bir şapka veya gözlük; o günkü ruh hâlinizi, tarzınızı ve enerjinizi dışarıya yansıtır. Fazlaya kaçmadan, az ama etkili aksesuarlar hem stilinizi zenginleştirebilir hem sizi çok daha sofistike gösterir.`,
      imageKey: "fa_01_aksesuar",
    },
{
      id: "renk",
      title: "4. Renk Uyumu ve Desen Dengesini Kurun",
      body: `Renkleri ustaca kullanmak, gerçek bir stil zekâsının göstergesidir. Daha derli toplu ve şık bir görünüm için:

    • Ten renginize en çok yakışan tonları seçmeye özen gösterin.
    • Cesur ve karmaşık desenleri, sade ve tek renkli temel parçalarla dengeleyin. Bu; göz yormayan, dengeli bir şıklık sağlamanın en etkili yoludur.`,
      imageKey: "fa_01_renk",
    },
{
      id: "bakim",
      title: "5. Bakımlı Olmanın Gücünü Asla Unutmayın",
      body: `Stil sadece giysilerden ibaret değildir, bir bütünlüktür. En şık ve pahalı kombini giyseniz bile bakımsız saçlar, dağınık tırnaklar ya da yorgun bir cilt; görünümünüzün etkisini anında azaltır.

Temiz, özenli ve bakımlı bir görünüm; kıyafetlerinizi tamamlayan ve öz güveninizi yükselten en güçlü detayın ta kendisidir.`,
      imageKey: "fa_01_bakim",
    },
{
      id: "trend",
      title: "6. Trendlere Değil, Tarzınızı Oluşturmaya Odaklanın",
      body: `Trendleri takip etmek elbette ilham vericidir. Ancak stil sahibi olmak için her zaman son moda parçalara kapılmak zorunda değilsiniz. Önemli olan, bu trendlerden size yakışanları ve kendi tarzınıza uyarlayabileceklerinizi seçebilmeniz.

İçinde en iyi hissettiğiniz parçalar, sizin en büyük stil rehberinizdir ve zamansız bir estetik anlayışı geliştirmenizi sağlar.`,
      imageKey: "fa_01_trend",
    },
{
      id: "guven",
      title: "7. En Güçlü Aksesuarınız: Kendinize Güvenin",
      body: `Giydiğiniz kıyafeti taşıyan ve ona ruh katan en güçlü unsur, duruşunuzdur. Kendine güvenen bir duruş, en sade kombini bile anında bambaşka bir seviyeye taşıyabilir.

Öz güvenle giydiğiniz her parça sizi en iyi şekilde yansıtır ve stilinizi tamamlayan o son, sihirli dokunuş olur.`,
      imageKey: "fa_01_guven",
    },
{
      id: "stil",
      title: "8. Kendi Stil Rehberinizi Oluşturun",
      body: `Stil sahibi olmak, her sabah "Ne giysem?" sorusuna ilhamla ve kolayca cevap verebilmeyi gerektirir. Bu nedenle sizi en iyi yansıtan parçaları, renk paletlerini ve siluetleri bir araya getirdiğiniz küçük bir kişisel stil dosyası oluşturabilirsiniz.

Bu mini rehber, alışveriş yaparken veya kombin hazırlarken size yön gösteren bir pusula gibi çalışabilir. Böyle bir arşiv sayesinde yeni bir parça alırken "Bu gerçekten beni yansıtıyor mu?" sorusuna daha kolay cevap bulabilirsiniz. Unutmayın, stiliniz zamanla oluşan bir bütündür. Haydi, hikâyenizin yazarının siz olun!`,
    },
  ],
},

// 🔮 Astroloji – 01–07 Aralık Haftalık Burç Yorumları
{
  id: "ast_weekly_2025_12_01",
  category: "astrology",
  title: "01 - 07 Aralık Haftalık Burç Yorumları",
  summary:
    `Bu hafta enerjimiz yükselirken yılın son büyük olayı olan 5 Aralık İkizler dolunayının hazırlıklarına giriyoruz. Dolunay; özellikle iletişim, ilişkiler ve bilgi alanlarında kesin sonuçlar, yüzleşmeler ve büyük bir netlik getirecek. Bu süreçte hangi alanlara odaklanmalı, neleri tamamlamalıyız? İşte burçların fısıltıları!`,
  date: "2025-12-01", // 🔹 Sıralama için düzgün format
  mainImageKey: "ast_01_main_01", // Aynı hero görseli kullanıyoruz
  sections: [
    {
      id: "weekly_koc_2025_12_01",
      title: "Koç ve Yükselen Koç: Aksiyon ve Finansal Yeniden Yapılanma",
      body: `Haftaya kendinize odaklı ve enerjiniz yüksek başlıyorsunuz.

Aksiyon Alanları: Sosyal medya, iletişim, hukuk, eğitim ve seyahat alanlarında hızla harekete geçebilirsiniz. Ancak geçmişte sizi inciten konular yeniden önünüze gelebilir; tepkilerinizin yüksek olmamasına dikkat etmelisiniz.

Finans ve Vizyon: Haftanın ilk gününden sonra maddi konular ve yetenekleriniz gündeminizde. Gelecek hayalleriniz için bütçenizi güncelleyebilir, yeni kazanç yolları oluşturmaya çalışabilirsiniz. Maddi konularda uzun vadeli planlar yapın. Otorite figürlerinden beklenmedik bir destek görebilirsiniz.

Dolunay Odak Noktası (5 Aralık): İletişim, eğitim ve seyahat alanlarında beklediğiniz sonuçları alabilirsiniz. Yüzleşmeniz gereken durumlar bu süreçte netlik kazanacak. Sosyal çevreniz vizyonunuzu genişletecek.

Hafta Sonu Odak: Ev ve ailenizle ilgili gündemleriniz olacak. Dinlenmeyi ve içe dönmeyi tercih edebilirsiniz. Aile içinde geçmiş yaraları aşma imkânınız var. Aile dizimi gibi çalışmalar için uygun bir hafta sonu. Ailenizden maddi ve manevi destek görebilirsiniz.`,
      imageKey: "ast_01_koc",
    },
    {
      id: "weekly_boga_2025_12_01",
      title: "Boğa ve Yükselen Boğa: İçsel Hesaplaşma ve Kariyer Dönüşümü",
      body: `Haftaya bilinçaltınızdaki konularla başlıyor, korkularınızın üstüne giderek sizi inciten noktaları çözümleme imkânı buluyorsunuz.

Kendine Odaklanma: Arzularınızı anlamlandırıp harekete geçebilir, kariyerinizde ve imajınızda değişime gitmek isteyebilirsiniz. Beslenme düzeninizi değiştirmek için ilk adımı atın. Geleceğiniz için uzun vadeli planlamalar yapın. Otorite figürlerinden yardım alabilirsiniz.

Dolunay Odak Noktası (5 Aralık): Maddi konulara bakış açınızı değiştireceksiniz. Gelir-gider dengenize dikkat etmelisiniz. Dolunay ile bazı tamamlanmalar yaşanabilir. Sosyal medya, iletişim ve eğitim gibi alanlarda aktif olmanız öne çıkmanızı sağlayacaktır.

Hafta Sonu Odak: Sosyal medya, iletişim ve seyahat alanlarında duygusal paylaşımlarınız öne çıkabilir. Ailenizle veya aile gibi gördüğünüz yakınlarınızla vakit geçirerek güvende ve huzurlu hissetmek isteyeceksiniz. Alanında yetkin bir kişiden destek alabilir, güzel fırsatlar yakalayabilirsiniz.`,
      imageKey: "ast_01_boga",
    },
    {
      id: "weekly_ikizler_2025_12_01",
      title: "İkizler ve Yükselen İkizler: Sizin Burcunuzda Dolunay ve İlişkilerde Netlik",
      body: `Haftaya sosyal çevreniz ve gelecek planlarınızla ilgili gündemlerle başlıyorsunuz. Etkileşimde olduğunuz kişiler sizi harekete geçirecek. Sosyal ortamlarda aktif ve cesur bir duruş sergileyin.

İçsel Süreçler: Haftanın ilk gününden sonra bilinçaltınızdaki konularla ilgilenerek hayata bakış açınızı güncelleyebilirsiniz. Terapi ve bilinçaltı çalışmaları için uygun bir hafta. Kariyerinize ve imajınıza dair uzun vadeli planlar yapın.

Dolunay Odak Noktası (5 Aralık): Dolunay sizin burcunuzda gerçekleşiyor! Bu, ilişkilerde netlik bekleyebileceğiniz anlamına gelir. İlişkilere bakış açınız ve ilişkileriniz gündeminizde yer alacak; yüzleşmeler yaşayabilirsiniz. Etkileyici bir profil çizebilirsiniz.

Hafta Sonu Odak: Maddi konular, yetenekleriniz ve sağlığınız öne çıkabilir. Öz bakıma vakit ayırarak kendinize şefkat gösterin. Maddi konularda güzel fırsatlar elde edebilir, sahip olduğunuz şeylere duygusal yaklaşabilirsiniz.`,
      imageKey: "ast_01_ikizler",
    },
    {
      id: "weekly_yengec_2025_12_01",
      title: "Yengeç ve Yükselen Yengeç: Kariyerde Cesur Adımlar ve Bilinçaltı Çözümleri",
      body: `Haftaya kariyeriniz ve imajınızla ilgili hareketli ve cesur adımlar atarak başlıyorsunuz. Sağlığınız için fiziksel aktiviteye yönelebilirsiniz.

Finansal Krizler: Haftanın ilk gününden sonra sosyal çevrenizle ve gelecek planlarınızla ilgili gündemleriniz olabilir. Hibe, miras, kredi gibi parasal konularda krizler ortaya çıkabilir. Bu krizleri çözmek ve güvenli bir gelecek inşa etmek amacıyla değişime gidebilirsiniz.

Destek ve Farkındalık: Sosyal çevrenizde bazı kişilere dair farkındalık yaşayabilirsiniz. Sosyal medya ve eğitim gibi alanlarda bir otorite figüründen destek alabilirsiniz.

Dolunay Odak Noktası (5 Aralık): Kontrolünüz dışındaki gelişmeler, bir süredir içinizde anlamlandıramadığınız konularda netlik kazanmanızı sağlayabilir. Bilinçaltınızdaki meseleleri çözümleyebilirsiniz.

Hafta Sonu Odak: Kendinize ve hayatınıza odaklanabilirsiniz. Yoğun duygularınız ön planda. Hafta sonunu öz bakım ve dinlenmek için değerlendirin. Uzun vadeli planlar yapabilir, sosyal medya ve hukuk alanlarında bir otorite figüründen destek alabilirsiniz.`,
      imageKey: "ast_01_yengec",
    },
    {
      id: "weekly_aslan_2025_12_01",
      title: "Aslan ve Yükselen Aslan: İmaj Değişimi ve Görünürlük Artışı",
      body: `Haftaya sosyal medya, iletişim, hukuk, eğitim ve seyahat alanlarındaki gündemlerle başlıyor, sizi öne çıkaracak cesur adımlar atıyorsunuz.

Kariyerde Dönüşüm: Haftanın ilk gününden sonra kariyeriniz ve imajınızla ilgili gündemleriniz olabilir. Etkileşimde olduğunuz kişiler, kariyerinizi değiştirmeniz konusunda sizi tetikleyebilir. Özgünlüğünüzü yansıtmak isteyebilir, dikkat çekebilirsiniz. Beklenmedik bir destek ile kariyeriniz olumlu etki alabilir.

Dolunay Odak Noktası (5 Aralık): Sosyal medya, iletişim ve seyahat alanlarında aktif olmanız görünürlüğünüzü artıracak. Yeni bir ilişki potansiyeli gündeme gelebilir. Gelecek planlarınız ve ilgi alanlarınız hakkında sahip olduğunuz bilgi artacak ve netleşeceksiniz.

Hafta Sonu Odak: İçe dönebilir, yoğun duygularınızla baş başa kalabilirsiniz. Dinlenmeyi ve güvende hissetmeyi tercih edin. Alanında yetkin kişilerden destek görebilirsiniz. Hibe, miras, kredi gibi parasal konularda yapılandırma imkânınız var.`,
      imageKey: "ast_01_aslan",
    },
    {
      id: "weekly_basak_2025_12_01",
      title: "Başak ve Yükselen Başak: Kariyerde Netleşme ve Güvenli Sosyalleşme",
      body: `Haftaya hibe, miras, kredi gibi parasal meselelerle ve yakınlık kurma konusuyla ilgili gündemlerle başlıyorsunuz. Tutku yüksek. Ailenize ve evinize ayırdığınız harcama bütçesi artabilir.

Kriz Yönetimi: Haftanın ilk gününden sonra sosyal medya, iletişim, hukuk ve seyahat alanlarında çözmeniz gereken krizler meydana gelebilir. İş ortamında otorite figürleriyle güç savaşına girmekten kaçının. Teknolojiyi efektif kullanarak işleri hızlandırabilirsiniz.

Dolunay Odak Noktası (5 Aralık): Kariyerinizde beklediğiniz bir durum netleşebilir. Öne çıkma imkânı bulabilir, sorumluluklarınızın arttığını görebilirsiniz. Bilgi birikiminiz ve yetkinliğiniz ortaya çıkacak.

Hafta Sonu Odak: Gelecek planlarınız ve sosyal çevrenizle ilgili gündemleriniz olacak. Kendinizi güvende hissettiğiniz, huzurlu olacağınız ortamlarda sosyalleşmeyi tercih edebilirsiniz. Alanında yetkin bir kişiden gelecek planlarınız için mentorluk alabilirsiniz. Sosyal çevrenizden gelen güzel fırsatları değerlendirin.`,
      imageKey: "ast_01_basak",
    },
    {
      id: "weekly_terazi_2025_12_01",
      title: "Terazi ve Yükselen Terazi: Vizyon Genişlemesi ve Tutkulu İlişkiler",
      body: `Haftaya ilişkilerinize odaklanarak başlıyorsunuz. Sosyal medya, iletişim ve seyahat alanlarında cesur adımlar atabilir, canlı ve tutkulu bir izlenim bırakabilirsiniz.

Finansal Krizler ve İlişkiler: Haftanın ilk gününden sonra hibe, miras, kredi gibi parasal konularda ve yakınlık ile ilgili konularda gündemleriniz olabilir. İlişkilerinizde tutku artsa da, kıskançlık, korkular ve güç savaşları da ortaya çıkabilir; dikkatli olun. Beklenmedik harcamalar yapmanız gerekebilir.

Dolunay Odak Noktası (5 Aralık): Yaşadıklarınız size yeni bir vizyon katabilir. Alacağınız haberlerle yüzleşmeler, tamamlanmalar yaşayabilirsiniz. Sosyal ortamlarda öne çıkabilir, iletişim ve hukuk alanlarında netlik kazandıran gelişmeler bekleyebilirsiniz.

Hafta Sonu Odak: Kariyeriniz ve imajınızla ilgili gündemleriniz olacak. Kendinizi ifade ederken duygularınız öne çıkabilir; şefkatli, yardımsever ve empatik bir ruh halinde olabilirsiniz. Alanında yetkin biri kariyerinize katkı sağlayabilir. Sağlıklı rutinler geliştirerek imajınızda uzun vadeli değişime gidin.`,
      imageKey: "ast_01_terazi",
    },
    {
      id: "weekly_akrep_2025_12_01",
      title: "Akrep ve Yükselen Akrep: Maddi Yapılanma ve İlişkilerde Açığa Çıkma",
      body: `Haftaya iş ortamınız, sağlığınız ve evcil hayvanınızla ilgili hareketli ve enerjik bir başlangıç yapıyorsunuz. Harcamalarınız artabilir.

İlişkiler ve Farkındalık: Haftanın ilk gününden sonra ilişkilerinizle ilgili gündemleriniz olacak. Aileniz ve partneriniz arasında kalabilir, çift terapisi gibi çalışmalar için uygun bir hafta geçirebilirsiniz. Etkileşimde olduğunuz kişiler, kendinizle ilgili bir şeyleri fark etmenizi sağlayacak.

Dolunay Odak Noktası (5 Aralık): Hibe, miras, kredi gibi parasal konularda edindiğiniz bilgilerle bütçenizi yeniden ele alacaksınız. İlişkilerde konuşulmayanların konuşulduğu bir süreç olabilir; gizli kalan konular açığa çıkabilir. Sağlığınıza özen göstermeyi ihmal etmeyin.

Hafta Sonu Odak: Sosyal medya, iletişim ve seyahat alanlarında gündemleriniz olacak. Nostaljik temalı ya da müdavimi olduğunuz yerlere gidebilirsiniz. Alanında yetkin kişilerden uzun vadeli destekler alabilir, güzel fırsatlar elde edebilir, vizyonunuzu genişletebilirsiniz.`,
      imageKey: "ast_01_akrep",
    },
    {
      id: "weekly_yay_2025_12_01",
      title: "Yay ve Yükselen Yay: İlişkilerde Dönüşüm ve Güçlü Adımlar",
      body: `Haftaya ilişkileriniz, çocuklarınız ve hobilerinizle ilgili gündemlerle başlıyor, kendinizi ortaya koymak için cesurca harekete geçiyorsunuz.

Krizler ve Sağlık: Haftanın ilk gününden sonra iş ortamınız, sağlığınız ve evcil hayvanınızla ilgili gündemleriniz olabilir. İletişim alanlarında çözmeniz gereken krizler oluşabilir. İş ortamınızda güç savaşlarından kaçının. Sağlığınıza olumsuz yansıyan düşünce kalıplarınızdan sıyrılmak isteyeceksiniz.

Dolunay Odak Noktası (5 Aralık): Karşıt burcunuzda gerçekleşen dolunay ile ilişkilerinizde yüzleşmeler ve tamamlanmalar yaşanabilir. Bazı ilişkiler seviye atlarken, bazı ilişkiler sonlanabilir. Etkileşimde olduğunuz kişiler, kendinizle ilgili farkındalık kazanmanızı sağlayacak.

Hafta Sonu Odak: Hibe, miras, kredi gibi parasal meseleler gündeminizde. Duygularınızı kendinize saklamayı tercih edebilir, içe dönebilirsiniz. Cinsellikte duygusal paylaşımı, şefkati ve güveni önceleyin. Ailenizden uzun vadeli destek görebilirsiniz.`,
      imageKey: "ast_01_yay",
    },
    {
      id: "weekly_oglak_2025_12_01",
      title: "Oğlak ve Yükselen Oğlak: İş Rutinlerinde Netleşme ve Özgünlük",
      body: `Haftaya eviniz ve ailenizle ilgili gündemlerle başlıyorsunuz. Sizi motive eden şeyler için harekete geçebilirsiniz, ancak kolay öfkelenmemeye ve sağlığınıza özen göstermeye dikkat edin.

Görünürlük ve Destek: Haftanın ilk gününden sonra ilişkiler, çocuklar ve hobilerle ilgili gündemleriniz olabilir. Harcamalarınız artsa da, özgünlüğünüz ile görünürlüğünüz artabilir ve dikkatleri üstünüzde toplayabilirsiniz. İletişim alanlarında bir otorite figürünün desteğini alabilirsiniz.

Dolunay Odak Noktası (5 Aralık): Uyku problemi yaşayabilirsiniz. Sağlığınıza özen göstermenizde fayda var. Arkanızdan dönen dolapları öğrendiğiniz, iş ortamınızda beklediğiniz durumların netlik kazandığı bir süreç olabilir.

Hafta Sonu Odak: İlişkilerinizle ilgili gündemleriniz olacak. Duygusal paylaşımlar yapmayı önemseyebilir, kendinizi güvende hissetmek isteyebilirsiniz. Etkileşimde olduğunuz kişiler, düşünce kalıplarınızı uzun vadede değiştirebilir ve size maddi/manevi fırsatlar getirebilir.`,
      imageKey: "ast_01_oglak",
    },
    {
      id: "weekly_kova_2025_12_01",
      title: "Kova ve Yükselen Kova: Radikal Aile Kararları ve İlişkide Tutku",
      body: `Haftaya sosyal medya, iletişim, eğitim ve seyahat alanlarında cesur ve rekabetten kaçınmayan bir modda başlıyorsunuz. Kendinizi doğrudan ifade edebilirsiniz, ancak pot kırmaya meyilli olabilirsiniz.

Aile ve Ev: Haftanın ilk gününden sonra eviniz ve ailenizle ilgili tadilat ya da değişiklikler yapabilirsiniz. Ailenizle anlaşmak kolay olmayabilir; duygusal anlamda tetiklenmenize sebep olabilirler. Evinizle ilgili şaşırtıcı haberler alabilir, teknolojik bir yatırım yapabilirsiniz. Bütçenizi aileniz ve eviniz için yeniden planlayın.

Dolunay Odak Noktası (5 Aralık): Sosyal medya, iletişim, eğitim ve seyahat alanlarında aktif olmanız görünürlüğünüzü artıracak. Yeni bir ilişki potansiyeli gündeme gelebilir.

Hafta Sonu Odak: İş ortamınız, sağlığınız ve evcil hayvanınızla ilgili gündemleriniz olacak. Dinlenmeyi ve özbakıma vakit ayırmayı tercih edin. Duygularınız sağlığınıza yansıyabilir. Alanında yetkin bir kişiden destek alarak kazanç yollarınızı güncelleyebilir, sağlıklı rutinler inşa edebilirsiniz.`,
      imageKey: "ast_01_kova",
    },
    {
      id: "weekly_balik_2025_12_01",
      title: "Balık ve Yükselen Balık: İlham ve Aile İçi Yüzleşmeler",
      body: `Haftaya maddi konular ve yeteneklerinizle ilgili gündemlerle başlıyor, kariyeriniz için girişken ve özgüvenli hissediyorsunuz. Kariyeriniz uğruna harcamalarınız artabilir.

Zihin ve İletişim: Haftanın ilk gününden sonra sosyal medya, iletişim, eğitim ve seyahat alanlarında gündemleriniz olabilir. Bilinçaltınızdaki kaos zihninizi yorabilir; meditasyon ve nefes pratikleri iyi gelecektir. Düşünce kalıplarınızı aşma fırsatı yakalayabilirsiniz. Şaşırtıcı haberler alabilirsiniz.

Dolunay Odak Noktası (5 Aralık): Aile içinde yüzleşmeler yaşanabilir. Evinizle ilgili beklediğiniz bir haber sonuçlanabilir.

Hafta Sonu Odak: İlişkiler, çocuklar ve hobilerle ilgili gündemleriniz olacak. İlhamınız yüksek. Sosyalleşirken güvende hissetmek için nostaljik teması olan yerlere gidebilirsiniz. Çocuklarınıza karşı şefkatli ve empatik olabilir, hobilerinizde istikrarlı olmaya karar verebilirsiniz. Bu da uzun vadede yetkinliğinizi üst seviyeye taşıyacaktır.`,
      imageKey: "ast_01_balik",
    },
  ],
},

// 💅 Makyaj Sıralaması Rehberi
{
  id: "beauty_02",
  category: "beauty",
  title: "Makyaj Sıralaması Rehberi: Kusursuz Görünüm İçin 6 Kritik Adım!",
  summary:
    "Kullandığın makyaj ürünü ne kadar kaliteli olursa olsun doğru sırayla uygulanmadığında istediğin etkiyi yakalaman mümkün olmayabilir. Fondötenin cilde tam oturmaması, kapatıcının çizgilere dolması ya da farın gün içinde uçup gitmesi gibi sorunlar yaşıyorsan problem büyük ihtimalle uygulama sıralamasında!",
  body: `Makyaj sadece güzel görünmenin değil, aynı zamanda kendimizi iyi hissetmenin de bir yolu. Bu nedenle doğru bir şekilde adım adım ilerlemek şart. Sen de ister günlük ister profesyonel bir görünüme dönüştürebileceğin, kalıcılığı artıran makyaj sıralaması rehberine ihtiyaç duyuyorsan bu yazıyı kaçırma!`,
  date: "2025-12-09",
  mainImageKey: "beauty_02_main",
  sections: [
    {
      id: "tem",
      title: "1. Adım: Makyajdan Önce Cilt Hazırlığı",
      body: `İyi bir makyaj, iyi hazırlanmış bir zeminle başlar. Cildin hazır olması makyajın ilk ve en görünmez kahramanı. Bunun için öncelikle cildini derinlemesine temizlemelisin. Ardından nemlendirme şart. Cilt tipin ne olursa olsun, makyajdan önce hafif yapılı bir nemlendirici uygulamak; ürünlerin eşit dağılmasını sağlar.

Eğer gündüz makyajı yapıyorsan SPF içeren bir ürünü kullanmayı asla ihmal etme. Makyaj bazı kullanacaksan bu ikisini birleştiren akıllı formülleri tercih edebilirsin.

Sadece makyaj bazı uygulayacaksan cilt tipine uygun bir ürün seçtiğinden emin olmalısın. Cildinin yapısına göre matlaştırıcı, gözenek küçültücü veya ışıltı veren bir baz kullanmak; fondötenin daha düzgün yayılmasını ve gün boyu bozulmamasını sağlar.`,
      imageKey: "beauty_02_tem",
    },
    {
      id: "goz",
      title: "2. Adım: Göz Makyajı",
      body: `Geleneksel alışkanlıklar ten makyajıyla başlamayı önerse de profesyonel makyaj sanatçılarının çoğu önce gözlere odaklanır. Neden mi? Cevabı çok basit!

Far, sim veya eyeliner dökülmeleri ten makyajını mahvedebilir. Bu nedenle önce göz makyajını bitirip cildindeki kalıntıları kolayca temizledikten sonra pürüzsüz bir ten makyajına başlayabilirsin.

Göz Makyajında Sıralama Nasıl Olmalı?

    • İlk olarak kaliteli bir far bazı edinmelisin. Far bazı, renklerin pigmentini artırır ve farın çizgilere dolmasını engeller. 
    • Ardından geçiş tonları ile göz kapağını ısıtmalısın.
    • Ana renk ve gölgeleme adımını ihmal etme. Ana rengi dağıtarak göz şekline uygun gölgeyi oluşturabilirsin.
    • Dilersen daha sonra eyeliner ya da kalem ile çizgileri belirginleştirebilirsin.
    • Son olarak maskara ile kirpikleri vurgulamayı unutma.`,
      imageKey: "beauty_02_goz",
    },
    {
      id: "ten",
      title: "3. Adım: Ten Makyajı",
      body: `Cilt tonunu eşitlemek ve pürüzsüz bir yapı oluşturmak için ten ürünlerinin doğru sırası hayati önem taşır. Bu aşamada adımların şöyle olmalı:

    • Fondöten veya BB/CC Krem: Cilt tonunu dengeleyen bu ürünler, makyajın temeli. Fırça ile daha yoğun kapatıcılık elde ederken, nemli süngerle daha doğal bir görünüm yakalayabilirsin. Günlük makyajlarda hafif yapılı BB/CC kremleri tercih edebilirsin.
    • Kapatıcı (Concealer): Fondötenin ardından göz altı morluklarını, kızarıklıkları veya izleri kapatmak için kapatıcıya geçebilirsin. Bu aşamada bir ipucu verelim: Göz çevren için kapatıcı kullanırken cildini iyi nemlendirdiğinden emin ol. Kapatıcıyı üçgen formunda uygulayıp nazikçe dağıtarak aydınlık bir sonuç alabilirsin.
    • Pudra: Krem ve likit formdaki ürünlerin sabitlenmesi için pudra kullan. Bu ürünü göz altına ve T bölgesine uygulamak, makyajın kalıcılığını artırır. Eğer cildin kuruysa sadece gerekli bölgelere az miktarda uygulaman yeterli.`,
      imageKey: "beauty_02_ten",
    },
    {
      id: "yuz",
      title: "4. Adım: Yüz Hatlarını Belirginleştirme",
      body: `Ten makyajın bittiğine göre şimdi yüzüne boyut ve canlılık katma zamanı!

İlk adım kontür. Bu uygulama yüzünde doğal gölgeler oluşturarak daha keskin bir ifade kazandırır. Uygulama alanları; elmacık kemiklerinin altı, çene hattı ve burun kenarları olmalı. Eğer daha önce kontür uygulaması yapmadıysan minik bir ipucu verelim. Soğuk alt tonlu kontür ürünleri kullanmak, daha gerçekçi bir gölge etkisi yaratır. Tabii ürünü dağıtırken tenle bütünleşmesine dikkat etmelisin.

İkinci adım, allık. Bu ürün yüze anında sıcaklık ve tazelik katar. Allık rengi seçimi, cilt alt tonunla uyumlu olmalı. 

    • Açık tenliysen pembe ve leylak tonlarını,
    • Buğday tenliysen şeftali ve mercan tonlarını,
    • Esmer tene sahipsen koyu gül kurusu veya kiremit tonlarını tercih edebilirsin.

Bu aşamanın son adımı ise aydınlatıcı, yani highlighter. Bu ürün; ışıltılı bir bitiş için elmacık kemikleri, kaş altı, burun ucu gibi yüzün yüksek noktalarına uygulanır. Parlaklık seviyesini cildine göre ayarlayabilirsin. Mesela iri simli ürünler gözenekli ciltlerde fazla belirgin olabilir.`,
      imageKey: "beauty_02_yuz",
    },
    {
      id: "sabit",
      title: "5. Adım: Sabitleme",
      body: `Tüm ürünlerini özenle uyguladıktan sonra makyajı yerinde tutacak kritik bir adıma ihtiyacın var: sabitleyici sprey. Bu adım hem makyajın daha doğal görünmesini sağlar hem özellikle sıcak havalarda akmayı ve bozulmayı önler.

Yağlı ciltler matlaştırıcı, kuru ciltler ise nem destekli formülleri tercih etmeli. Spreyi yüzünden yaklaşık 30 cm uzaktan eşit şekilde sıkarak makyajını mühürleyebilirsin.`,
      imageKey: "beauty_02_sabit",
    },
    {
      id: "dudak",
      title: "6. Adım: Dudak Makyajı",
      body: `Dudaklar, genel görünümü tamamlayıcı son noktadır. Başlamadan önce dudaklarını nemlendir. Daha sonra önce kalemle çerçeve çizerek dudak formunu belirginleştir, ardından kalemi tüm dudağına uygulayarak rujun kalıcılığını artır. Son olarak üzerine uygun tonda mat veya parlak bir ruj geç. Eğer ekstra dolgun bir etki istiyorsan dudağının ortasına biraz açık renkli bir gloss uygulayabilirsin.`,
      imageKey: "beauty_01_dudak",
    },
  ],
},

// 🌿 Regl Öncesi Gerginliği Doğadan Destek Alarak Hafiflet
{
  id: "well_02",
  category: "wellbeing",
  title: "Regl Öncesi Gerginliği Doğadan Destek Alarak Hafiflet",
  summary:
    "Regl öncesi dönem, birçok kadın için hem bedensel hem duygusal olarak zorlu bir süreç olabilir. Ancak doğanın sunduğu şifalı yöntemlerle bu dönemi daha rahat ve dengeli geçirmek mümkün. Peki, regl öncesi yaşanan ruhsal iniş çıkışları doğal yollarla nasıl hafifletebiliriz? İşte etkili öneriler...",
  body: `Regl öncesi dönem, bedensel ve duygusal açıdan zorlayıcı olabilir. Ancak bu dönemi doğanın şifalı gücüyle daha rahat, dengeli ve huzurlu geçirmek mümkün. Ruhsal iniş çıkışlarını doğal yollarla hafifletmenin ve kendini güçlü hissetmenin en etkili ve pratik önerilerini senin için sırladık. Haydi gel, önerilere bir göz atalım! `,
  date: "2025-12-09",
  mainImageKey: "well_02_main",
  sections: [
    {
      id: "pms",
      title: "PMS Nedir?",
      body: `PMS, yani Premenstrüel Sendrom, âdet döngüsünün yumurtlama sonrası başlayan ve âdet kanamasıyla birlikte sona eren evresinde yaşanan fiziksel ve duygusal belirtileri ifade eder. Bazı kadınlar bu süreci neredeyse fark etmeden atlatırken bazıları için günlük yaşamı sekteye uğratacak kadar belirgin olabilir. Genellikle âdetin başlamasıyla birlikte bu belirtiler yavaş yavaş kaybolur.`,
    },
    {
      id: "duygu",
      title: "Duygu Durumundaki Değişimlerin Temel Nedenleri",
      body: `Regl öncesi dönemde yaşanan ruhsal dalgalanmalar sadece hormonal değildir. Birçok farklı faktör devreye girer. İşte bu değişimlerin başlıca sebepleri:

    • Hormon Dalgalanmaları: Östrojen ve progesteron hormonlarının âdet döngüsü boyunca iniş çıkışlar göstermesi, ruh hâli üzerinde doğrudan etkilidir. Özellikle östrojenin düşmesi, enerji seviyesinde düşüşe ve depresif duygulara zemin hazırlayabilir.
    • 
    • Serotonin Seviyeleri: Ruh hâlini dengeleyen nörotransmitterlerden biri olan serotonin, âdet döngüsüne bağlı olarak azalabilir. Bu azalma, duygu durum bozukluklarına ve huzursuzluk hissine neden olabilir.
    • 
    • Çevresel ve Sosyal Etkenler: İş stresi, ilişki problemleri ya da yoğun yaşam temposu gibi çevresel faktörler; hormon değişiklikleriyle birleştiğinde daha yoğun duygusal tepkilere yol açabilir.
    • 
    • Genetik Yatkınlık: Ailede PMS ya da ruhsal dalgalanmalar yaşayan bireyler varsa bu durum sizde de benzer bir eğilim yaratabilir. Genetik yapı, bu dönemin ne kadar zorlayıcı geçeceğini belirlemede önemli bir faktördür.`,
      imageKey: "well_02_duygu",
    },
    {
      id: "belirti",
      title: "PMS Belirtileri Nelerdir?",
      body: `Belirtiler herkeste eşit seviyede ve sayıda görülmez. Ancak genel olarak PMS belirtilerini fiziksel, duygusal ve ruhsal olarak ayırabiliriz. Regl öncesi dönemde ortaya çıkan fiziksel şikâyetler oldukça yaygındır. Fiziksel şikâyetlerin yanı sıra bu dönemde ruhsal denge de etkilenebilir. Bunlardan bazılarını şöyle sıralamak mümkün:`,
    },
    {
      id: "fiziksel",
      title: "Fiziksel Belirtiler",
      body: `Karın ağrısı ve şişkinlik,
    • Göğüslerde hassasiyet,
    • Eklem ve kas ağrıları,
    • Ciltte akne oluşumu,
    • Kabızlık ve ishal gibi sindirim sistemi problemleri,
    • Vücutta su tutulması, yani ödem,
    • İştah dalgalanmaları,
    • Alkole karşı artan hassasiyet.`,
      imageKey: "well_02_belirti",
    },
    {
      id: "duygusal",
      title: "Duygusal ve Ruhsal Belirtiler",
      body: `  • Dikkat ve konsantrasyon zorlukları,
    • Uykuya geçmede güçlük,
    • Depresif ruh hâli,
    • Gerginlik, sinirlilik,
    • Sosyal ortamlardan uzaklaşma,
    • Libidoda azalma ya da artış,
    • Anksiyete ve huzursuzluk hissi.`,
    },
{
      id: "destek",
      title: "Regl Öncesi Gerginliğe Karşı Doğal Destek Yolları",
      body: `Bu dönemi illa ilaç kullanarak atlatmak zorunda değilsin. Gel, PMS'yi doğal yollarla hafifletmenin yollarına da bir bakalım:`,
    },
{
      id: "rahat",
      title: "Bitki Çaylarıyla Bedenini ve Zihnini Rahatlat",
      body: `Papatya, melisa ve rezene gibi bitkiler rahatlatıcı ve kas gevşetici özellikleriyle PMS semptomlarını hafifletmeye yardımcı olur. Özellikle akşam saatlerinde içilen bir fincan bitki çayı hem uyku kalitesini artırır hem sinir sistemini yatıştırır.`,
      imageKey: "well_02_destek",
    },
{
      id: "magnezyum",
      title: "Magnezyum ve B6 Vitaminine Önem Ver",
      body: `Magnezyum ve B6 vitamini eksikliği, duygusal dalgalanmaları şiddetlendirebilir. Badem, muz, ıspanak, avokado gibi besinleri beslenmene dâhil ederek hem enerjini koruyabilir hem bu önemli mikro besinleri doğal yolla alabilirsin.`,
    },
{
      id: "egzersiz",
      title: "Egzersizle Endorfin Salgıla",
      body: `Yoga, pilates ve tempolu yürüyüş gibi hafif egzersizler; endorfin üretimini artırarak ruh hâlini dengelemeye yardımcı olur. Haftada en az 3 gün düzenli hareket, PMS kaynaklı stresi azaltmak için etkili bir yöntemdir.`,
      imageKey: "well_02_yoga",
    },
{
      id: "seker",
      title: "Şeker ve Kafein Tüketimini Sınırla",
      body: `Regl öncesi dönemde şekerli yiyecekler ve kafein tüketimi, kan şekerinde ani dalgalanmalara neden olabilir. Bu da sinirlilik, tahammülsüzlük ve duygusal iniş çıkışları beraberinde getirebilir. Bu dönemde özellikle kahve ve şeker tüketimini azaltmak fayda sağlar.`,
    },
{
      id: "uyku",
      title: "Uyku Düzenine Özen Göster",
      body: `Bu dönemde vücut daha fazla dinlenmeye ihtiyaç duyar. Her gün aynı saatlerde uyuyup uyanmaya çalışmak, biyolojik ritmi destekler ve duygusal gerginliği azaltır. Günde 7–8 saatlik uyku, zihinsel toparlanmayı da hızlandırır.`,
    },
{
      id: "nefes",
      title: "Nefes ve Meditasyon Egzersizlerini İhmal Etme",
      body: `Derin nefes çalışmaları ve kısa meditasyonlar, stresin azalmasında oldukça etkilidir. Günde 10 dakikalık bir rutin bile sinir sistemini düzenleyebilir, kaygı ve öfke gibi zorlayıcı duyguları hafifletebilir.`,
      imageKey: "well_02_egzersiz",
    },
{
      id: "dogal",
      title: "Doğal Takviyelerden Destek Al",
      body: `Bazı kadınlar için çuha çiçeği yağı, omega-3 yağ asitleri veya bitkisel özler PMS belirtilerini hafifletici etki gösterebilir. Ancak bu tür takviyelere başlamadan önce mutlaka bir uzman görüşü alman gerektiğini unutmamalısın. Çünkü ne kadar doğal da olsa herkes için uygun olmayabilir.`,
    },
  ],
},

// 🥗 Yaşam Kaliteni Artır: Şekeri Hayatından Çıkarmanın Pratik Yolları
{
  id: "he_sample_2",
  category: "healthyEating",
  title: "Yaşam Kaliteni Artır: Şekeri Hayatından Çıkarmanın Pratik Yolları",
  summary: "Güzel bir yemeğin hemen ardından ya da keyifli bir beş çayının yanında çoğumuzun eli istemsizce tatlılara uzanır. Bu lezzetli yiyecekleri tüketmek ne kadar cazip gelse de aşırı tüketimin sağlığımız üzerindeki olumsuz etkileri artık herkesçe biliniyor. Ancak şekeri bir anda kesmek hiç de kolay değil. Peki, hayat kalitemizi artırmak için bu alışkanlığı adım adım nasıl bırakabiliriz?",
  body: `Şeker, çoğu zaman günlük rutinlerimizin ayrılmaz bir parçası. Böylesine leziz bir şeyin masum olmaması ise gerçekten üzücü. Ne yazık ki şeker; sürekli ve sık tüketimi durumunda vücudumuza ciddi zararlar veren, bağımlılık yapıcı bir madde. Bu nedenle çok daha sağlıklı bir yaşam sürmek isteyen pek çok kişi, şeker tüketimini azaltmaya veya tamamen kesmeye çalışıyor. Ancak bu süreç sadece irade gücüyle yönetilebilecek kadar kolay değil. Bu yolda bilinçli ve sürdürülebilir bir planlama gerekiyor.

Eğer sen de şekeri hayatından çıkarmakta zorlanıyor ve rafine şekersiz bir yaşamı kalıcı hâle getirmek istiyorsan işte bilimin desteklediği pratik ve etkili öneriler!`,
  date: "2025-12-09",
  mainImageKey: "he_01_main",
  sections: [
    {
      id: "ilk",
      title: "İlk Adım: Hangi Şeker Türlerinden Uzak Durmalısın?",
      body: `Şekerden uzaklaşmanın ilk ve en önemli adımı, onun nerelerde saklandığını öğrenmek. Market raflarındaki ürünlerde glukoz, fruktoz veya galaktoz gibi pek çok farklı şeker türü bulunuyor. Bu türler bazen doğal olarak etiketlense bile vücuttaki işlenme biçimleri yüzünden risk yaratabilir.

Özellikle işlenmiş gıdalarda bulunan yüksek fruktozlu mısır şurubu (HFCS), rafine beyaz şeker ve bazı karbonhidratlar; kan şekeri seviyesinde hızlı dalgalandırma yaratarak daha büyük bir tatlı isteği yaratır. Şekerden gerçekten kurtulmak istiyorsan paketli gıdalardan mümkün olduğunca kaçınmalı ve ürün içeriklerinde gizlenmiş şekerlere karşı tetikte olmalısın.`,
    },
   {
      id: "bilincli",
      title: "Bilinçli Tüketici Ol ve Etiket Okuma Alışkanlığı Edin",
      body: `Şekerle mücadelede bilinçli bir tüketici olmak, sana büyük avantaj sağlar. Doğal tatlandırıcı, bal, ve Hindistan cevizi şekeri gibi masum görünen isimlerin bile gizli şeker içerdiğini unutma.

    • Ürünlerdeki şeker oranlarını takip et. Etiketleri okuyarak sadece şeker miktarını değil, aynı zamanda farklı türevlerini de kontrol edin.

    • Basit bir kuralı uygula. Buna göre içindekiler listesi ne kadar kısa ve içeriği ne kadar anlaşılırsa o ürünün senin için o kadar masum olduğunu varsayabilirsin.`,
      imageKey: "he_01_bilincli",
    },
{
      id: "tatli",
      title: "Tatlı Krizlerini Yönetmek İçin Şekeri Evden Uzaklaştır",
      body: `Unutma ki mutfağında ve kolay erişebileceğin yerlerde ne varsa zor anlarda ilk onu tüketirsin. Tatlı krizlerini daha iyi yönetmek için en etkili yol, şekerli atıştırmalıkları ve gazlı içecekleri evinden tamamen çıkarmaktır.

Bu boşalan yerlere sağlıklı alternatifler koyarak ani isteklere karşı daha doğru seçimler yapabilirsin. Eğer doğal yollarla bu ihtiyacı nasıl gidereceğini merak ediyorsan;

    • Taze meyveler,
      
    • Fındık, badem gibi kuru yemişler,
      
    • Hurma ve 
      
    • Yüksek kakaolu bitter çikolata gibi seçeneklere yönelebilirsin. 

Böyle gıdalar tatlı isteğini sağlıklı bir şekilde kontrol altına almana yardımcı olacaktır.`,
      imageKey: "he_01_tatli",
    },
{
      id: "yapay",
      title: "Yapay Tatlandırıcılardan Uzak Dur",
      body: `Şekeri bırakmaya çalışan pek çok kişi, kalorisi düşük olduğu için yapay tatlandırıcılara yönelir. Ancak dikkatli olmak gerekir! Çünkü yapay tatlandırıcılar, vücudumuza gerçek şeker tüketiyormuş gibi sinyaller göndererek tatlı eşiğimizi yükseltebilir ve uzun vadede isteği daha da artırabilir. Ayrıca bazı araştırmalar, yapay tatlandırıcıların bağırsak florasını bozabileceğini de gösteriyor.

Bu nedenle tatlandırıcılara sığınmak yerine doğrudan tatlı eşiğini düşürmeye odaklanabilirsin. Ayrıca tarçın, Hindistan cevizi ve hurma özü gibi doğal tat vericileri daha sık kullanabilirsin.`,
    },
{
      id: "menu",
      title: "Menünde Sağlıklı Yağlar Olsun",
      body: `Uzun süre yağ tüketimini azaltmanın sağlıklı olduğu düşünüldü. Ancak kaliteli yağlar aslında vücudumuzun enerji ihtiyacını karşılamada ve kan şekerini dengelemede kritik rol oynar.

Avokado, zeytinyağı, Hindistan cevizi yağı, fındık ve tohumlar gibi sağlıklı yağları beslenmene dâhil ederek tatlı isteğini daha etkili bir şekilde baskılayabilirsin. Mesela smoothie’lerine keten tohumu yağı eklemeyi veya kahvaltıda avokado tüketmeyi deneyebilirsin. Bu küçük değişiklikler, şekere olan bağımlılığını zamanla azaltmana destek olacaktır.`,
      imageKey: "he_01_menu",
    },
{
      id: "saglik",
      title: "Bağırsak Sağlığını Güçlendir",
      body: `Şeker tüketimi, bağırsak florasındaki kötü bakterilerin çoğalmasına neden olarak bağırsak dengesini bozar. Fermente gıdalar ise tam tersi bir etkiyle iyi bakterileri besleyerek sağlığı destekler.

Ev yapımı yoğurt, kefir, lahana turşusu ve kombucha gibi fermente ürünleri beslenmene ekleyerek bağırsaklarının florasını dengeleyebilir; böylece tatlı krizlerinin önüne geçebilirsin.`,
    },
{
      id: "su",
      title: "Bol Su İç",
      body: `Su içmenin toksinlerden arınmak ve sağlıklı kalmak için ne kadar önemli olduğunu biliyoruz. Bazen gelen ani tatlı krizleri, vücudumuzun aslında susuz kaldığının bir sinyali olabilir. Bunun için günde 2-3 litre su içmeye özen gösterebilirsin.

Ek olarak suyu aynı zamanda tatlı isteğini baskılamaya yardımcı olmak için de kullanabilirsin. Böyle anlarda hemen bir bardak su içip 10 dakika bekle. Çoğu zaman bu basit eylemin bile tatlı ihtiyacını ortadan kaldırdığını fark edeceksin. Dilersen suyunu tarçın, nane, zencefil gibi doğal ürünlerle tatlandırarak tatlı isteğini bastırabilirsin.`,
      imageKey: "he_01_su",
    },
{
      id: "atistir",
      title: "Atıştırmalık Seçimlerini Akıllıca Yap",
      body: `Açlık anlarında elinin tatlıya gitmesini engellemek için önceden hazırladığın sağlıklı atıştırmalıklara yönelmen çok önemli. Mesela fındık, badem, ceviz gibi kuru yemişler ideal seçimdir. Ayrıca protein içeriği yüksek yoğurt ve peynirler, hurma, bitter çikolata gibi seçenekler de kan şekerini dengede tutar; uzun süre tok kalmanı sağlar. Böylece tatlı ihtiyacını azaltır.`,
    },
{
      id: "serotonin",
      title: "Serotonin Seviyeni Doğal Yollarla Yükselt",
      body: `Şeker, anlık bir mutluluk patlaması yaşatır. Ancak bu seni oyuna getirmemeli çünkü uzun vadede daha fazla şekere yönelmeye teşvik eder. Bunun yerine mutluluk hormonu olan serotonin seviyeni doğal yollarla artırmayı deneyebilirsin.

Serotonin seviyesini artırmanın pratik yolları ise şöyle:

    • Düzenli Egzersiz: Yoga, dans veya tempolu yürüyüş gibi aktiviteler serotonin seviyeni yükseltir.
      
    • Güneş Işığı: Bol bol güneş ışığı almaya çalış.
      
    • Yeni Hobiler: Seni mutlu eden, keyif veren ve zihnini meşgul eden uğraşlar edin.
      
    • Kaliteli Uyku: Düzenli ve yeterli uyku uyumaya özen göster.

Bu sağlıklı alışkanlıkları hayatının bir parçası hâline getirmek, şekere duyduğun psikolojik bağımlılığı azaltmana güçlü bir şekilde destek olacaktır.`,
      imageKey: "he_01_serotonin",
    },
  ],
},

// 🔮 Astroloji – 8-14 Aralık Haftalık Burç Yorumları
{
  id: "ast_weekly_2025_12_09",
  category: "astrology",
  title: "8 - 14 Aralık Haftalık Burç Yorumları: Detaylar, Niyetler ve Yeni Rutinler!",
  summary:
    "Kendini parlatmak, yeni gelir yolları yaratmak ve ruhsal dengeye ulaşmak için bu haftanın rehberliğini mutlaka kullan!",
  body: `8 - 14 Aralık haftası, detaylara odaklanmanı ve günlük rutinlerini iyileştirmeni istiyor. İlişkilerinde tutku yüksek, kariyerinde ise organizasyon becerin öne çıkacak. Bu hafta ilişkilerini, kariyerini ve sağlığını dönüştürmek için sana özel ipuçlarına göz at!`,
  date: "2025-12-09", // 🔹 Sıralama için düzgün format
  mainImageKey: "ast_01_main_01", // Aynı hero görseli kullanıyoruz
  sections: [
    {
      id: "weekly_koc_2025_12_09",
      title: "Koç ve Yükselen Koç: Aksiyon Al, Parlaklığı Yakala!",
      body: `Bu hafta ilişkiler, çocuklar ve hobilerle ilgili gündemlerle başlıyorsun. İlişkilerinde tutku tavan yapacak!

Harekete Geçme Zamanı: Sosyal medya, hukuk, eğitim ve seyahat alanlarında eril figürlerden destek görebilirsin ve bu konularda aksiyon alman seni ortamlarda parlatabilir. Aktif oluşun, flörtler konusunda da canlanma yaratabilir.

Sağlık ve Rutinler: Hafta ortasından itibaren iş ortamın, sağlığın ve evcil hayvanınla ilgili gündemlerin olabilir. Bağışıklığına dikkat et; mide, cilt ve mental sağlık hassas olabilir. Günlük iş listen uzayabilir, detaylara özen göster.

İyileşme ve Niyet: Seni geriye çeken alışkanlıkları bırakmaya niyetlenmelisin. Dalgınlığa ve aldanmaya açık olabilirsin; yediklerinin son kullanma tarihlerini kontrol etmeyi unutma. Terapi ve bilinçaltı çalışmaları için bu haftayı değerlendirebilirsin.

Hafta Sonu Odak: Odağın ilişkilere kaymaya başlayacak. İletişim trafiğin yoğun ve keyifli olacak. Entelektüel paylaşımların artacak ve kendini rahatlıkla ifade edebileceksin.`,
      imageKey: "ast_01_koc",
    },
    {
      id: "weekly_boga_2025_12_09",
      title: "Boğa ve Yükselen Boğa: Aile Desteği ve Detayların Gücü",
      body: `Haftaya ev ve ailenle ilgili gündemlerle başlıyorsun. Evde tadilat veya değişiklikler yapmak için uygun bir haftadasın.

Finansal İyileşme: Aile içindeki otorite figürleriyle güç savaşlarından kaçın; bunun yerine hibe, miras, kredi gibi parasal konularda ailenin etkisiyle iyileşme bekleyebilirsin. Terapi ve aile dizimi gibi çalışmalar için bu dönemi kullan.

İlişkide Mükemmeliyetçilik: Hafta ortasından itibaren ilişkiler, çocuklar ve hobiler gündeminde. Çocuklarınla ilgili detayları atlamamaya özen göster. İlişkilerinde detaylara önem vermek, sana artı puan olarak yansıyacak. Mükemmeliyetçiliği bırakman, görünürlük kazanmana ve takdir edilmene vesile olabilir.

Gelecek Planları: Çocuklarına dair sorumlulukların artması, gelecek planlarını revize etmende etkili olabilir. Partnerinle gelecek hayalleri kurman söz konusu.

Hafta Sonu Odak: İş ortamın, sağlığın ve evcil hayvanınla ilgili çözülmeyi bekleyen krizler oluşabilir; hafta sonu çalışman bile mümkün. Parasal konularda şansın dönebilir, dişil figürlerden destek görebilirsin. Sporu günlük rutinlerine dahil etmek için harika bir zaman!`,
      imageKey: "ast_01_boga",
    },
    {
      id: "weekly_ikizler_2025_12_09",
      title: "İkizler ve Yükselen İkizler: Etki Alanın Genişliyor, Köklere Dönüş",
      body: `Haftaya sosyal medya, iletişim, ticaret, eğitim ve seyahat alanlarında yüksek enerjiyle başlıyorsun. İkna gücün çok yüksek!

Liderlik ve Farklılık: Güç savaşlarından kaçın, etkileşimde olduğun kişiler seni cesaretlendirebilir. Spontane hareket etmen gerekebilir. Sıradışı fikirler aklına gelebilir.

Evde Düzen ve Huzur: Hafta ortasından itibaren ev ve ailenle ilgili gündemlerin olacak. Evin düzenine, temizliğine odaklanabilir, ailedekilerin işlerine yardım edebilirsin. Geçmiş bir konuyu geride bırakma imkanı bulacaksın. Ancak titizlik ve kontrolcülükten kaçınmalısın. Aile dizimi gibi çalışmalar için uygun günler.

Hafta Sonu Odak: İlişkiler, çocuklar ve hobilerle ilgili paylaşımların artacak. Hayatın keyifli yanlarına odaklanabilir, sosyalleşebilirsin. İştahın artabilir, tatlıya yönelebilirsin. Uyarı: Flörtlerinden beklentin artsa da, harcamalarda aşırıya kaçmamakta fayda var.`,
      imageKey: "ast_01_ikizler",
    },
    {
      id: "weekly_yengec_2025_12_09",
      title: "Yengeç ve Yükselen Yengeç: Maddi Fırsatlar ve Yaratıcı Çözümler",
      body: `Haftaya maddi konular ve yeteneklerinle ilgili gündemlerle başlıyorsun. Öz güvenini etkileyen durumlarla karşılaştığında, korkularının üstüne gitmek sana çok iyi gelecek.

Kariyer Desteği: İş ortamındaki dişil figürlerden destek alabilirsin. Modun yüksek; maddi fırsatlar kapını çalabilir. İş ortamındaki bir otorite figüründen takdir görebilirsin.

Zihin Kontrolü: Hafta ortasından itibaren sosyal medya, iletişim, eğitim ve seyahat alanlarında detay gerektiren işlerle ilgilenebilirsin. Zihnin yoğun, takıntılı düşüncelere meyledebilirsin. Meditasyon, nefes egzersizleri sana iyi gelecektir.

Özgünlük: Kontrolün dışında gelişen durumlara mükemmeliyetçilikle yaklaşmak işe yaramayacak. Sıradışı fikirler ve yaratıcı çözümler bulabilirsin. Sosyalleşirken, kendini ifade ederken özgün ve dürüst bir tarz seç.

Hafta Sonu Odak: Ev ve ailenle ilgili gündemlerin olacak. İletişimin artabilir, birlikte keyifli vakit geçirebilirsiniz. Özbakım için uygun bir hafta sonu. Spor ve yürüyüş yapmak sana iyi gelebilir.`,
      imageKey: "ast_01_yengec",
    },
    {
      id: "weekly_aslan_2025_12_09",
      title: "Aslan ve Yükselen Aslan: Kontrol Sende ve Finansal Farkındalık",
      body: `Haftaya kendinize odaklı başlıyor ve hayatının iplerini eline almak istiyorsun.

Güç Dengesi: Etkileşimde olduğun kişilerle güç savaşlarına çekilebilirsin; dikkatli ol. İlişkiler, çocuklar ve hobiler konusunda dişil figürlerden destek alabilirsin. Sosyal ortamlarda öne çık, hayatın tadını çıkar.

Bütçe ve Detaylar: Hafta ortasından itibaren maddi konular ve yeteneklerinle ilgili gündemlerin olabilir. Bütçe planlaması yaparken detaylara özen göster. Harcamaların artabilir. Mükemmeliyetçilikten kaçın.

Öz Güven Yükselişi: Kariyerin için sıradışı fikirler bulabilirsin ve bu, uzun vadede maddi durumuna olumlu yansıyacak. Kendinle ilgili fark ettiğin bir özellik, öz güvenini yükseltebilir.

Hafta Sonu Odak: Sosyal medya, iletişim, eğitim ve seyahat alanlarında gündemlerin olabilir. İkna gücün yüksek; fırsatlar elde edebilirsin. Flört ihtimalleri oluşabilir. Kendini rahatlıkla ifade edebilirsin.`,
      imageKey: "ast_01_aslan",
    },
    {
      id: "weekly_basak_2025_12_09",
      title: "Başak ve Yükselen Başak: Kendine Dönüş ve Sağlıklı Alışkanlıklar",
      body: `Haftaya bilinçaltındaki konularla başlıyor, seni motive eden şeyleri anlamaya çalışıyorsun. Yurt dışı bağlantılı konularda harekete geçebilirsin.

İçsel Analiz: Hafta ortasından itibaren kendini önceliklendireceksin. Hayatını artıları ve eksileriyle değerlendirebilirsin. Sağlığına, imajına dikkat et. Mide, cilt ve mental sağlık hassas olabilir.

Dönüşüm: Beslenmeni değiştirmek, uyku düzenine dikkat etmek ve sağlıklı alışkanlıklar kazanmak için uygun bir zamandasın. Ancak mükemmeliyetçiliğe gitmemekte fayda var. Sorumlulukların artabilir.

Hafta Sonu Odak: Maddi konular ve yeteneklerinle ilgili gündemlerin olabilir. Ailenle vakit geçirebilir, onlar için harcamalar yapabilirsin. Evini güzelleştirmeye niyetlenebilirsin. Ailen, yeteneklerin konusunda seni destekleyebilir. Evde bile olsa hareket etmek, sana iyi hissettirecek.`,
      imageKey: "ast_01_basak",
    },
    {
      id: "weekly_terazi_2025_12_09",
      title: "Terazi ve Yükselen Terazi: Gelecek Hedefleri ve Bilinçaltı Kalıpları",
      body: `Haftaya sosyal çevren ve gelecek planlarınla ilgili gündemlerle başlıyorsun. Sosyal ortamlarda öne çıkabilirsin.

Sosyal Güç: Arkadaş ilişkilerinde ve romantik ilişkilerinde güç savaşlarına girmemeye dikkat et. Çocuklarına gereksiz baskı uygulamadığından emin ol. Dişil figürlerden gelecek hayallerin için destek görebilirsin. Kendini öz güvenli bir şekilde ifade edebilirsin.

Bilinçaltı Analizi: Hafta ortasından itibaren bilinçaltındaki konularla ilgilenebilir, içe dönebilirsin. Duygularını ve bilinçaltı kalıplarını analiz etmeye yönel. Mükemmeliyetçilik, kaygı ve kontrolcülük gibi hallere kapılabilirsin. Seni geride tutan inanç ve düşünce kalıplarını fark edip farklı seçimler yapma fırsatın var.

Hafta Sonu Odak: Kendine odaklanabilirsin. İkna gücün ve karizman yüksek; ortamlarda dikkati üstüne toplayabilirsin. İlişkilerde tutku artabilir. Dişil figürlerden destek ve fırsatlar elde edebilirsin.`,
      imageKey: "ast_01_terazi",
    },
    {
      id: "weekly_akrep_2025_12_09",
      title: "Akrep ve Yükselen Akrep: Kariyerde Güç ve Detaylı Planlama",
      body: `Haftaya kariyerin ve toplumdaki imajınla ilgili gündemlerle başlıyorsun. Kariyerindeki pozisyonunda değişiklik olabilir ve güçlenebilirsin.

Finansal Fırsatlar: Güç savaşlarından kaçın, maddi anlamda fırsatlar yakalayabilirsin. Dişil figürlerden hem maddi hem de kariyerin açısından destek göreceksin. Aşırıya kaçmamakta fayda var.

Sosyal Seçicilik: Hafta ortasından itibaren sosyal çevren ve gelecek planlarınla ilgili gündemlerin olabilir. Gelecek planlarını detaylı şekilde organize etmelisin. Sosyal ortamlarda seçici davranabilir, sana iyi gelmediğini düşündüğün bazı kişilerle yollarını ayırabilirsin.

İçsel Dönüşüm: Sosyal medya, hukuk ve eğitim alanlarında yetkin bir kişiden destek görebilirsin. Hafta sonuna doğru bilinçaltındaki konulara yönelebilirsin. Terapi ve bilinçaltı çalışmaları için uygun günler. Beklenmedik şekilde maddi fırsatlar önüne gelebilir.`,
      imageKey: "ast_01_akrep",
    },
    {
      id: "weekly_yay_2025_12_09",
      title: "Yay ve Yükselen Yay: Hayatını Hızlandır ve İmajını Güçlendir",
      body: `Haftaya sosyal medya, hukuk, eğitim ve seyahat alanlarında gündemlerle başlıyorsun. İkna gücün yüksek!

Hız ve Fırsatlar: Güç savaşlarına girmemeye çalış; güzel fırsatlar yakalayabilir, hayatını hızlandıran hamleler yapabilirsin. Çevrendeki dişil figürlerle iyi anlaşabilirsin.

Kariyerde Titizlik: Hafta ortasından itibaren kariyerin ve imajınla ilgili gündemlerin olabilir. Detaylara dikkat eden, titiz, mükemmeliyetçi biri olduğun izlenimini bırakabilirsin. İmajını değiştirmek isteyebilirsin. Kontrolcülük ve mükemmeliyetçilik konusunda ölçülü ol. Kötü alışkanlıklarını bırakmaya çalış.

Hafta Sonu Odak: Sosyal çevren ve gelecek planlarınla ilgili gündemlerin olacak. Düşünce kalıplarını dönüştürmen gerekebilir. Sosyal çevrendeki güçlü bir figürden gelecek planların için destek alabilirsin. Ortamlarda öne çıkabilir, hareketli bir hafta sonu geçirebilirsin.`,
      imageKey: "ast_01_yay",
    },
    {
      id: "weekly_oglak_2025_12_09",
      title: "Oğlak ve Yükselen Oğlak: Maddi Cesaret ve Yurt Dışı Fırsatları",
      body: `Haftaya hibe, miras, kredi gibi parasal konularda gündemlerle başlıyorsun. Harcamaların artabilir.

Ek Gelir Yolları: Kazanç yollarında değişime gitmek isteyebilir, yeteneklerini ek gelir yaratmak için kullanabilirsin. Beklenmedik bir maddi destek görebilirsin. Yurt dışı bağlantılı parasal imkanlar fark edebilir, harekete geçebilirsin. Korkularının üstüne gitmek öz güvenini artıracak.

Zihinsel Odak: Hafta ortasından itibaren sosyal medya, hukuk, eğitim ve seyahat alanlarında detaylara dikkat etmen gereken işlerle ilgilenebilirsin. Zihnin yoğun. Kontrolcülük ve mükemmeliyetçilik işe yaramayabilir. Meditasyon ve nefes pratikleri sana iyi gelebilir.

Hafta Sonu Odak: Kariyerin ve toplumdaki imajınla ilgili gündemlerin olacak. Öz güvenin etkileyiciliğini artırabilir. Kazanç yollarını değiştirmek, kariyerinde değişimlere vesile olabilir. Girişken ve motive bir imaj çizebilirsin.`,
      imageKey: "ast_01_oglak",
    },
    {
      id: "weekly_kova_2025_12_09",
      title: "Kova ve Yükselen Kova: İlişkilerde Deneyim ve Bütçe Detayları",
      body: `Haftaya ikili ilişkilerle ilgili gündemlerle başlıyorsun. Güç savaşlarından kaçınman sana fayda sağlayacak.

Sosyal Fırsatlar: Çevrendeki dişil figürlerden fayda görebilirsin. Gelecek planlarına yönelik güzel fırsatlar elde edebilir, dahil olduğun ortamlarda öne çıkabilirsin.

Finansal Sorumluluk: Hafta ortasından itibaren hibe, miras, kredi gibi parasal konularda gündemlerin olabilir. Bütçe planlaması yaparken detaylara özen göstermelisin. İlişkilerde cinsellik ön planda olabilir. Korkuların su yüzüne çıkabilir. Takıntılı yaklaştığın noktaları fark edip onları dönüştürebilirsin.

Anlaşmalara Dikkat: Bir otorite figürü sana yol gösterebilir. Sorumlulukların artabilir. Parasal konularda bir anlaşma söz konusuysa, koşulları iyi değerlendirdiğinden emin ol.

Hafta Sonu Odak: Sosyal medya, hukuk, eğitim ve seyahat alanlarında gündemlerin olacak. Geçmişte seni yaralayan konular yeniden gündeme gelebilir; kırıcı konuşmaktan kaçın. Gelecek planların için harekete geçebilir, sosyalleşebilirsin.`,
      imageKey: "ast_01_kova",
    },
    {
      id: "weekly_balik_2025_12_09",
      title: "Balık ve Yükselen Balık: Kariyerde Takdir ve İlişki İnançlarını Dönüştürme",
      body: `Haftaya iş ortamın, sağlığın ve evcil hayvanınla ilgili gündemlerle başlıyorsun. Sağlığına özen göstermelisin.

Kariyer Motivasyonu: Kendine güvenli duruşun, kariyerinle alakalı bir otorite figürünün dikkatini çekebilir. İş ortamında takdir toplayabilir, kariyerine yönelik motivasyonunu artırabilirsin.

İlişkisel İnançlar: Hafta ortasından itibaren ikili ilişkilerle ilgili gündemlerin olabilir. İlişkilere dair olumsuz inançların varsa, bunların farkına varabilirsin. İlişkilerde kontrolcülük, yersiz kaygı gibi tutumlarını törpülemeye niyet edebilirsin. Etkileşimde olduğun kişiler, içinde yoğun duygular uyandırabilir.

Hafta Sonu Odak: Hibe, miras, kredi gibi parasal konularda gündemlerin olabilir. Kontrolün dışında gelişen durumlar söz konusu olabilir. Kariyerin ile ilgili dişil figürlerden destek alabilirsin. Geçmişte seni yaralayan konular yüzeye çıkabilir; öz güvenin etki alabilir. Kendini ifade etmek ve sosyalleşmek bu hislere iyi gelecektir.`,
      imageKey: "ast_01_balik",
    },
  ],
},

// 🌿 Ekran Süresini Azaltmanın 7 Etkili Yolu
{
  id: "well_03",
  category: "wellbeing",
  title: "Ekran Süresini Azaltmanın 7 Etkili Yolu",
  summary:
    "Günümüzün dijital alışkanlıkları içinde ekranlar, fark etmeden hayatın merkezine yerleşti. Peki, telefonu tamamen bırakmadan zihinsel alan açmak mümkün mü? Elbette! İşte bildirimleri sınırlamaktan ekranını gri tonlamaya çevirmeye kadar, dijital dünyayla olan ilişkini kökten değiştirecek 7 adım!",
  body: `Teknolojiden tamamen uzaklaşmak zor olsa da biraz mesafe koymak; zihnini, enerjini ve zamanını geri kazanman için harika bir başlangıç. Sabah gözünü açar açmaz elin telefona gidiyorsa, işe odaklanmaya çalışırken kendini TikTok'ta buluyorsan, sosyal medyada gezinirken zamanın nasıl geçtiğini anlamıyorsan merak etme. Bu döngüyü kırmak senin elinde!
İşte ekranla olan ilişkini yeniden düzenlemenin, zamanı daha anlamlı şeylerle doldurmanın ve zihnini dijital kalabalıktan arındırmanın en etkili yolları!`,
  date: "2025-12-09",
  mainImageKey: "well_03_main",
  sections: [
    {
      id: "sure",
      title: "1. Ekran Süreni Dürüstçe Analiz Et",
      body: `Değişimin ilk adımı her zaman farkındalıktır. "Ben ne kadar telefona bakıyorum?" sorusunun cevabı bazen seni şaşırtabilir. Neyse ki telefonun sana tüm istatistikleri sunuyor. Hangi uygulamaya ne kadar vakit ayırmışsın, günde kaç kez ekranı açmışsın hepsini kolayca öğrenebilirsin.
    • Aksiyon: Bu verilere bakarak, hangi uygulamaların gerçekten gerekli, hangilerinin ise sadece zaman hırsızı olduğunu ayırt et.
    • İpucu: Eğer bir uygulamayı sadece alışkanlıktan açıyorsan onu ana ekrandan kaldır. Eğer cesaretin varsa sil. Göz önünde olmayan şey, zamanla cazibesini yitirir.`,
    },
    {
      id: "ekran",
      title: "2. Ekranını Siyah Beyaza Çevir (Gri Tonlama Modu)",
      body: `Telefon ekranlarındaki parlak simgeler, canlı videolar ve kırmızı bildirim baloncukları beyninin dopamin üretmesini tetikler. Bu, dikkatini sürekli ekranda tutmak için kurulmuş bir tuzaktır.
    • Aksiyon: Telefonunda bulunan Gri Tonlama Modu'nu (Siyah-Beyaz) aktif et.
    • Etkisi: Renkler gidince o uygulamalara girme ve saatlerce kaydırma isteğin ciddi şekilde sönecek. Bu basit ayar, ekranla olan duygusal bağını zayıflatır. Dene, sonucu çok şaşıracaksın!`,
      imageKey: "well_03_ekran",
    },
    {
      id: "bildirim",
      title: "3. Bildirimleri Sustur, Sadece Önemlilere İzin Ver",
      body: `Her bip sesi, dikkatini böler ve elini telefona götürür. Oysa çoğu bildirim, gerçekten bakman gereken bir şey bile değildir. Modern çağın bu dijital zillerini susturmalısın.
    • Aksiyon: Ayarlarına gir ve sosyal medya, alışveriş siteleri, oyunlar gibi zaman çalan uygulamaların bildirimlerini kapat.
    • İpucu: "Rahatsız Etmeyin" veya "Odak Modu" özelliklerini kullanarak acil aramalar ve iş mesajları gibi sadece gerçekten önemli anlarda uyarı almayı seç. Bu, çevrendekilere de "Şu an gerçekten meşgulüm." mesajını verir.`,
      imageKey: "well_03_bildirim",
    },
    {
      id: "an",
      title: "4. Kendine Ekransız Anlar Tanımla",
      body: `Her an telefonla bağlantıda olmak zorunda değilsin. Bazı zaman dilimleri, ekranlardan uzak kalmak için harika fırsatlar sunar.
    • Kural Koy: Kendine basit ama etkili kurallar koy: "Yemekte telefon yok.", "Arkadaşımla konuşurken telefon masada durmayacak." ya da "Saat 22.00'dan sonra ekran kullanmak yok." gibi basit adımlarla kural koymaya başlayabilirsin.
    • Sonuç: Bu anlarda telefonu bir kenara bırakmak sadece zihnini arındırmakla kalmaz, insanlarla daha gerçek bağlar kurmana da imkân verir.`,
      imageKey: "well_03_an",
    },
    {
      id: "bosluk",
      title: "5. Boşluğu Yeni Alışkanlıklarla Doldur",
      body: `Ekran süreni azalttığında oluşan boşluk, başta biraz can sıkıcı gelebilir. Ama bu boşluk, yeni ve besleyici şeyler denemek için en büyük fırsatın!
    • İlham Al: Kendine bir hobi bul, uzun zamandır ertelediğin bir ilgiyi yeniden canlandır. Yoga ve meditasyon ile içsel denge kur, el işi veya resimle yaratıcılığını ortaya çıkar ya da kitap okuyarak zihnini tazele.
    • Dönüşüm: Telefondan uzaklaşmayı bir eksilme olarak değil, bir dönüşüm süreci olarak gör.`,
    },
{
      id: "karar",
      title: "6. Kararını Çevrenle Paylaş",
      body: `Ekran süresini azaltma hedefini çevrenle paylaşmak seni hem motive eder hem desteklenmiş hissettirir.
    • Aksiyon: Bir arkadaşına "Sosyal medyada biraz ara vermeye karar verdim." de. Hatta bu karar, başkalarına da ilham olabilir ve birlikte bir dijital detoks planlayabilirsiniz.
    • Unutma: Yeni bir alışkanlığı kalıcı hâle getirmek, bireysel bir mücadele olmaktan çıktığında  çok daha kolaydır.`,
      imageKey: "well_03_karar",
    },
{
      id: "sosyal",
      title: "7. Sosyal Medyayla Kontrollü Bir İlişki Kur",
      body: `7. Sosyal Medyayla Kontrollü Bir İlişki Kur
Sosyal medya, sürekli kaydırmak ve güncellemeleri kaçırmamak adına tetikte kalmakla zihinsel yorgunluk yaratan dev bir zaman girdabına dönüşebilir.
    • Sınır Koy: Bunun yerine belli saatlerde sosyal medyaya girmeyi dene. Örneğin sabah 15 dakika ve akşam 15 dakika gibi net sınırlar koy.
    • Dijital Temizlik: Seni kötü hissettiren, huzurunu bozan hesaplardan uzak dur. Sosyal medyada temizlik yapmak, dijital dünyanı yeniden düzenlemek anlamına gelir.`,
      imageKey: "well_03_sosyal",
    },
{
      id: "kontrol",
      title: "Unutma, Kontrol Sende!",
      body: `Ekran süresini azaltmak teknolojiyi tamamen terk etmek anlamına gelmez. Telefonlar; sevdiklerinle bağlantı kurmak, müzik dinlemek veya bilgiye ulaşmak için harika araçlar olabilir. Ancak önemli olan onun seni mi yönettiği, yoksa senin onu bilinçli bir şekilde mi kullandığın.
Kendine şu soruyu sor: "Bu uygulamalar bana kendimi nasıl hissettiriyor?" Eğer yanıt huzursuzluk, stres ya da tükenmişlikse değişimin zamanı gelmiş demektir. Haydi, adım at ve gücünü geri kazan!`,
      imageKey: "well_03_kontrol",
    },
  ],
},
];
// app/article/[id].tsx

import { Audio } from "expo-av";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { publicStorageUrl, sbGetMany } from "../../lib/supabase";

// Local içerikler
import { articles as localArticles } from "../../data/content";

/**
 * ✅ Görselleri burada tanıtıyoruz (require map)
 * Path: assets/images/content/...
 */
const IMAGE_MAP: Record<string, any> = {
  // --- ASTRO ---
  ast_01_akrep: require("../../assets/images/content/ast_01_akrep.png"),
  ast_01_aslan: require("../../assets/images/content/ast_01_aslan.png"),
  ast_01_balik: require("../../assets/images/content/ast_01_balik.png"),
  ast_01_basak: require("../../assets/images/content/ast_01_basak.png"),
  ast_01_boga: require("../../assets/images/content/ast_01_boga.png"),
  ast_01_ikizler: require("../../assets/images/content/ast_01_ikizler.png"),
  ast_01_koc: require("../../assets/images/content/ast_01_koc.png"),
  ast_01_kova: require("../../assets/images/content/ast_01_kova.png"),
  ast_01_main_01: require("../../assets/images/content/ast_01_main_01.png"),
  ast_01_main: require("../../assets/images/content/ast_01_main.png"),
  ast_01_oglak: require("../../assets/images/content/ast_01_oglak.png"),
  ast_01_terazi: require("../../assets/images/content/ast_01_terazi.png"),
  ast_01_yay: require("../../assets/images/content/ast_01_yay.png"),
  ast_01_yengec: require("../../assets/images/content/ast_01_yengec.png"),

  // --- BEAUTY ---
  beauty_01_main: require("../../assets/images/content/beauty_01_main.jpg"),
  beauty_01_peeling: require("../../assets/images/content/beauty_01_peeling.jpg"),
  beauty_01_sirke: require("../../assets/images/content/beauty_01_sirke.jpg"),
  beauty_02_dudak: require("../../assets/images/content/beauty_02_dudak.jpg"),
  beauty_02_goz: require("../../assets/images/content/beauty_02_goz.jpg"),
  beauty_02_main: require("../../assets/images/content/beauty_02_main.jpg"),
  beauty_02_sabit: require("../../assets/images/content/beauty_02_sabit.jpg"),
  beauty_02_tem: require("../../assets/images/content/beauty_02_tem.jpg"),
  beauty_02_ten: require("../../assets/images/content/beauty_02_ten.jpg"),
  beauty_02_yuz: require("../../assets/images/content/beauty_02_yuz.jpg"),

  // --- FASHION (fa) ---
  fa_01_aksesuar: require("../../assets/images/content/fa_01_aksesuar.jpg"),
  fa_01_bakim: require("../../assets/images/content/fa_01_bakim.jpg"),
  fa_01_gard: require("../../assets/images/content/fa_01_gard.jpg"),
  fa_01_guven: require("../../assets/images/content/fa_01_guven.jpg"),
  fa_01_main: require("../../assets/images/content/fa_01_main.jpg"),
  fa_01_renk: require("../../assets/images/content/fa_01_renk.jpg"),
  fa_01_trend: require("../../assets/images/content/fa_01_trend.jpg"),

  // --- HEALTHY EATING (he) ---
  he_01_bilincli: require("../../assets/images/content/he_01_bilincli.jpg"),
  he_01_main: require("../../assets/images/content/he_01_main.jpg"),
  he_01_menu: require("../../assets/images/content/he_01_menu.jpg"),
  he_01_serotonin: require("../../assets/images/content/he_01_serotonin.jpg"),
  he_01_su: require("../../assets/images/content/he_01_su.jpg"),
  he_01_tatli: require("../../assets/images/content/he_01_tatli.jpg"),
  he_sample_1: require("../../assets/images/content/he_sample_1.png"),

  // --- HOME ---
  home_01_aliskanlik: require("../../assets/images/content/home_01_aliskanlik.png"),
  home_01_main: require("../../assets/images/content/home_01_main.png"),
  home_01_saklama: require("../../assets/images/content/home_01_saklama.png"),

  // --- RELATIONSHIPS ---
  rel_01_aile: require("../../assets/images/content/rel_01_aile.png"),
  rel_01_catisma: require("../../assets/images/content/rel_01_catisma.png"),
  rel_01_kariyer: require("../../assets/images/content/rel_01_kariyer.png"),
  rel_01_lokasyon: require("../../assets/images/content/rel_01_lokasyon.png"),
  rel_01_main_01: require("../../assets/images/content/rel_01_main_01.png"),
  rel_01_para: require("../../assets/images/content/rel_01_para.png"),
  rel_01_sosyal: require("../../assets/images/content/rel_01_sosyal.png"),

  // --- SPORT ---
  sport_01_coklu: require("../../assets/images/content/sport_01_coklu.jpg"),
  sport_01_denge: require("../../assets/images/content/sport_01_denge.jpg"),
  sport_01_kas: require("../../assets/images/content/sport_01_kas.jpg"),
  sport_01_main: require("../../assets/images/content/sport_01_main.jpg"),

  // --- WELLBEING (well) ---
  well_01_baglanti: require("../../assets/images/content/well_01_baglanti.png"),
  well_01_main: require("../../assets/images/content/well_01_main.png"),
  well_01_ruh: require("../../assets/images/content/well_01_ruh.png"),
  well_01_sorumluluk: require("../../assets/images/content/well_01_sorumluluk.png"),
  well_01_temiz: require("../../assets/images/content/well_01_temiz.png"),
  well_01_yaratim: require("../../assets/images/content/well_01_yaratim.png"),

  well_02_belirti: require("../../assets/images/content/well_02_belirti.jpg"),
  well_02_destek: require("../../assets/images/content/well_02_destek.jpg"),
  well_02_duygu: require("../../assets/images/content/well_02_duygu.jpg"),
  well_02_egzersiz: require("../../assets/images/content/well_02_egzersiz.jpg"),
  well_02_main: require("../../assets/images/content/well_02_main.jpg"),
  well_02_yoga: require("../../assets/images/content/well_02_yoga.jpg"),

  well_03_an: require("../../assets/images/content/well_03_an.jpg"),
  well_03_bildirim: require("../../assets/images/content/well_03_bildirim.jpg"),
  well_03_ekran: require("../../assets/images/content/well_03_ekran.jpg"),
  well_03_karar: require("../../assets/images/content/well_03_karar.jpg"),
  well_03_kontrol: require("../../assets/images/content/well_03_kontrol.jpg"),
  well_03_main: require("../../assets/images/content/well_03_main.jpg"),
  well_03_sosyal: require("../../assets/images/content/well_03_sosyal.jpg"),
};

function getImage(key?: string) {
  if (!key) return null;
  const img = IMAGE_MAP[key];
  if (!img) console.warn("❗ Görsel bulunamadı, key:", key);
  return img ?? null;
}

type ArticleRow = {
  id: string;
  status: "draft" | "scheduled" | "published";
  category_id: string | null;
};

type TrRow = {
  title: string | null;
  summary: string | null;
  content_html: string | null;
  slug: string | null;
  audio_asset_id: string | null; // ✅
};

type AssetRow = {
  bucket: string;
  path: string;
  content_type: string | null;
};

function enc(v: string) {
  return encodeURIComponent(v);
}

// Local text'i düzgün göstermek için (satır sonlarını korur)
function TextBlock({ text }: { text: string }) {
  const lines = useMemo(() => String(text ?? "").split("\n"), [text]);
  return (
    <Text style={styles.body}>
      {lines.map((l, i) => (
        <Text key={i}>
          {l}
          {"\n"}
        </Text>
      ))}
    </Text>
  );
}

export default function ArticleScreen() {
  const params = useLocalSearchParams();
  const raw = params.id;
  const routeId = Array.isArray(raw) ? raw[0] : raw;

  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [tr, setTr] = useState<TrRow | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // ✅ Local içerik yakaladıysak buraya koyuyoruz
  const [localHit, setLocalHit] = useState<any | null>(null);

  const lang = "tr";

  // ✅ unmount / route değişiminde sesi kapat
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  async function toggleAudio() {
    if (!audioUrl) return;

    try {
      setAudioLoading(true);

      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          setIsPlaying(status.isPlaying);

          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });

        setSound(newSound);
        setIsPlaying(true);
        return;
      }

      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      setErr("Ses oynatılamadı. Lütfen tekrar deneyin.");
    } finally {
      setAudioLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);
        setLocalHit(null);

        // yeni route geldiğinde önceki sesi sıfırla
        setAudioUrl(null);
        setIsPlaying(false);
        if (sound) {
          await sound.unloadAsync().catch(() => {});
          setSound(null);
        }

        if (!routeId) {
          setErr("İçerik bulunamadı.");
          return;
        }

        // ✅ 0) Local varsa direkt onu aç
        const hit = localArticles.find((a) => a.id === routeId);
        if (hit) {
          if (!cancelled) {
            setLocalHit(hit);
            setArticle({
              id: hit.id,
              status: "published",
              category_id: (hit as any).category ?? null,
            });
            setTr({
              title: (hit as any).title ?? "",
              summary: (hit as any).summary ?? "",
              content_html: null, // local’da RenderHTML kullanmayacağız
              slug: null,
              audio_asset_id: null, // ✅ TS hatasını çözer
            });
          }
          return;
        }

        // ✅ 1) routeId UUID mi?
        const looksLikeUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            routeId
          );

        let articleId = routeId;

        if (!looksLikeUuid) {
          // slug -> article_id bul
          const hits = await sbGetMany<{ article_id: string }>(
            `/article_translations?select=article_id&lang=eq.${lang}&slug=eq.${enc(
              routeId
            )}&limit=1`
          );
          if (!hits?.[0]?.article_id) {
            setErr("İçerik bulunamadı (slug eşleşmedi).");
            return;
          }
          articleId = hits[0].article_id;
        }

        // ✅ 2) sadece published article
        const aRows = await sbGetMany<ArticleRow>(
          `/articles?select=id,status,category_id&id=eq.${enc(
            articleId
          )}&status=eq.published&limit=1`
        );
        if (!aRows?.[0]) {
          setErr("Bu içerik yayında değil veya bulunamadı.");
          return;
        }

        // ✅ 3) translation (audio_asset_id dahil)
        const tRows = await sbGetMany<TrRow>(
          `/article_translations?select=title,summary,content_html,slug,audio_asset_id&article_id=eq.${enc(
            articleId
          )}&lang=eq.${lang}&limit=1`
        );
        if (!tRows?.[0]) {
          setErr("Çeviri içeriği bulunamadı.");
          return;
        }

        if (!cancelled) {
          setArticle(aRows[0]);
          setTr(tRows[0]);
          setLocalHit(null);

          // ✅ audio url üret (varsa)
          const audioId = tRows[0]?.audio_asset_id;
          if (audioId) {
            try {
              const a = await sbGetMany<AssetRow>(
                `/assets?select=bucket,path,content_type&id=eq.${enc(
                  audioId
                )}&limit=1`
              );

              const asset = a?.[0];
              if (asset?.bucket && asset?.path) {
                setAudioUrl(publicStorageUrl(asset.bucket, asset.path));
              } else {
                setAudioUrl(null);
              }
            } catch {
              setAudioUrl(null);
            }
          } else {
            setAudioUrl(null);
          }
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Network/Fetch hatası oluştu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  const htmlSource = useMemo(() => {
    const html = tr?.content_html?.trim();
    return { html: html && html.length ? html : "<p><em>İçerik boş.</em></p>" };
  }, [tr?.content_html]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, opacity: 0.7 }}>Yükleniyor…</Text>
      </View>
    );
  }

  if (err || !article || !tr) {
    return (
      <View style={styles.center}>
        <Text>{err ?? "İçerik bulunamadı."}</Text>
      </View>
    );
  }

  const title = tr.title ?? "Makale";

  // ✅ LOCAL RENDER (tam metin + görseller)
  if (localHit) {
    const mainImg = getImage((localHit as any).mainImageKey);
    const sections = Array.isArray((localHit as any).sections)
      ? (localHit as any).sections
      : [];

    return (
      <>
        <Stack.Screen options={{ title }} />
        <ScrollView contentContainerStyle={styles.container}>
          {mainImg && (
            <Image source={mainImg} style={styles.hero} resizeMode="cover" />
          )}

          <Text style={styles.title}>{(localHit as any).title ?? ""}</Text>
          {!!(localHit as any).summary && (
            <Text style={styles.summary}>{(localHit as any).summary}</Text>
          )}

          {!!(localHit as any).body && (
            <View style={{ marginTop: 8 }}>
              <TextBlock text={(localHit as any).body} />
            </View>
          )}

          {sections.map((s: any) => {
            const secTitle = String(s?.title ?? "").trim();
            const secBody = String(s?.body ?? "").trim();
            const secImg = getImage(s?.imageKey);

            return (
              <View key={String(s?.id ?? secTitle)} style={{ marginTop: 14 }}>
                {!!secTitle && (
                  <Text style={styles.sectionTitle}>{secTitle}</Text>
                )}
                {secImg && (
                  <Image
                    source={secImg}
                    style={styles.sectionImg}
                    resizeMode="cover"
                  />
                )}
                {!!secBody && (
                  <View style={{ marginTop: 8 }}>
                    <TextBlock text={secBody} />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </>
    );
  }

  // ✅ REMOTE RENDER (Supabase HTML)
  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{tr.title ?? ""}</Text>

{!!audioUrl && (
  <View style={styles.audioBox}>
    <Text style={styles.audioTitle}>         Okumak istemiyorsan dinle 🌸</Text>

    <Pressable
      onPress={toggleAudio}
      style={({ pressed }) => [
        styles.audioBtn,
        pressed ? { opacity: 0.9 } : null,
        audioLoading ? { opacity: 0.7 } : null,
      ]}
      disabled={audioLoading}
    >
      <Text style={styles.audioBtnText}>
        {audioLoading ? "Yükleniyor…" : isPlaying ? "🎧 Duraklat" : "🎧 Dinle"}
      </Text>
    </Pressable>
  </View>
)}

{!!tr.summary && <Text style={styles.summary}>{tr.summary}</Text>}

        <RenderHTML
          contentWidth={width - 32}
          source={htmlSource}
          baseStyle={styles.body}
          tagsStyles={{
            h2: styles.sectionTitle,
            h3: styles.sectionTitle,
            p: styles.body,
            li: styles.body,
          }}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },

  hero: { width: "100%", height: 210, borderRadius: 16, marginBottom: 12 },
  sectionImg: { width: "100%", height: 190, borderRadius: 16, marginTop: 10 },

  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  summary: { fontSize: 15, lineHeight: 22, opacity: 0.85, marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 22 },

  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 12, marginBottom: 6 },

 audioBox: {
  marginTop: 12,
  marginBottom: 18,
  padding: 16,
  borderRadius: 18,
  backgroundColor: "#FBEDEE", // ana kart tonuna yakın
  borderWidth: 1,
  borderColor: "#F3C6CF",
},

audioTitle: {
  fontSize: 17,
  lineHeight: 24,
  fontWeight: "600",
  color: "#4A3B3B", // başlıklarla uyumlu koyu sıcak ton
  marginBottom: 12,
},

audioBtn: {
  paddingVertical: 14,
  borderRadius: 999, // WellShe butonları gibi tam yuvarlak
  backgroundColor: "#F5BFC6", // Su / regl butonlarıyla aynı aile
  alignItems: "center",
},

audioBtnText: {
  fontSize: 16,
  fontWeight: "700",
  color: "#4A2F33",
},
});

// app/contact.tsx

import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ContactScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      Alert.alert("Uyarı", "Lütfen mesajını yaz.");
      return;
    }

    // Basit kontrol: e-posta doldurulmuşsa içinde @ olsun
    if (trimmedEmail && !trimmedEmail.includes("@")) {
      Alert.alert("Uyarı", "Lütfen geçerli bir e-posta adresi gir.");
      return;
    }

    try {
      setIsSending(true);

      const subject = encodeURIComponent("WellShe Uygulaması İletişim");
      const bodyLines = [
        trimmedName ? `Ad: ${trimmedName}` : "",
        trimmedEmail ? `E-posta: ${trimmedEmail}` : "",
        "",
        "Mesaj:",
        trimmedMessage,
      ].filter(Boolean);

      const body = encodeURIComponent(bodyLines.join("\n"));
      const to = "welllshee@gmail.com"; // 👉 Burayı kendi e-posta adresinle değiştir

      const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (!canOpen) {
        Alert.alert(
          "Hata",
          "Cihazda e-posta uygulaması açılamadı. Mesajını manuel olarak iletmen gerekebilir."
        );
      } else {
        await Linking.openURL(mailtoUrl);
      }
    } catch (e) {
      console.log("İletişim formu hata:", e);
      Alert.alert("Hata", "Mesaj hazırlanırken bir sorun oluştu.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>İletişim</Text>
        <Text style={styles.subtitle}>
          WellShe ile ilgili öneri, soru veya iş birliği taleplerin için bu formu
          doldurabilirsin. Mesajın e-posta uygulaman üzerinden bana iletilecek.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Adın (isteğe bağlı)</Text>
          <TextInput
            style={styles.input}
            placeholder="Adını yazabilirsin"
            placeholderTextColor="#b88c86"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>E-posta (isteğe bağlı ama faydalı)</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@mail.com"
            placeholderTextColor="#b88c86"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mesajın</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Bana ne söylemek istersin?"
            placeholderTextColor="#b88c86"
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isSending && { opacity: 0.7 }]}
          onPress={handleSend}
          disabled={isSending}
        >
          <Text style={styles.buttonText}>
            {isSending ? "Hazırlanıyor..." : "E-posta ile gönder"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Geri dön</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F3",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B4A44",
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A2E2A",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#F3B6B3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#FFFFFF",
    color: "#4A2E2A",
  },
  textArea: {
    minHeight: 120,
  },
  button: {
    backgroundColor: "#F3B6B3",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: "#B0756F",
    textDecorationLine: "underline",
  },
});

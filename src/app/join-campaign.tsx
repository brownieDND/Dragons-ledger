import { SafeAreaView, StyleSheet, Text } from "react-native";

export default function JoinCampaignScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Join Campaign</Text>
      <Text style={styles.text}>
        Campaign invitations and join codes will be handled here.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12100E",
    padding: 24,
  },

  title: {
    color: "#D9A441",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 20,
  },

  text: {
    color: "#F2E8D5",
    fontSize: 16,
    marginTop: 12,
  },
});

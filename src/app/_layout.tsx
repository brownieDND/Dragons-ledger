import { Stack } from "expo-router";

import { CampaignProvider } from "../context/CampaignContext";

export default function RootLayout() {
  return (
    <CampaignProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#12100E",
          },

          headerTintColor: "#D9A441",

          headerTitleStyle: {
            fontWeight: "600",
          },

          contentStyle: {
            backgroundColor: "#12100E",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="create-campaign"
          options={{
            title: "Create Campaign",
          }}
        />

        <Stack.Screen
          name="join-campaign"
          options={{
            title: "Join Campaign",
          }}
        />

        <Stack.Screen
          name="campaign/[id]"
          options={{
            title: "Campaign",
          }}
        />

        <Stack.Screen
          name="campaign/[id]/transaction"
          options={{
            title: "Transaction",
          }}
        />

        <Stack.Screen
          name="campaign/[id]/ledger"
          options={{
            title: "Ledger",
          }}
        />

        <Stack.Screen
          name="campaign/[id]/party-fund"
          options={{
            title: "Party Fund",
          }}
        />
      </Stack>
    </CampaignProvider>
  );
}

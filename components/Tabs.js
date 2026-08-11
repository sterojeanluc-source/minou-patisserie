import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function Tabs({ tabs = [], activeTab, onTabPress }) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => onTabPress(tab.id)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingBottom: 4,
  },
  tab: {
    backgroundColor: '#1C2541',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A506B',
  },
  tabActive: {
    backgroundColor: '#FFCC00',
    borderColor: '#FFCC00',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8DA9C4',
  },
  tabTextActive: {
    color: '#0A1128',
  },
});

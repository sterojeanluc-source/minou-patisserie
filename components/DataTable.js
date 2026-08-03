import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function DataTable({ headers = [], data = [], emptyText = "Aucune donnée disponible." }) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Entêtes du tableau */}
          <View style={styles.headerRow}>
            {headers.map((h, i) => (
              <View key={i} style={[styles.headerCell, { flex: h.flex || 1, minWidth: h.width || 100 }]}>
                <Text style={styles.headerText}>{h.label}</Text>
              </View>
            ))}
          </View>

          {/* Lignes du tableau */}
          {data.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          ) : (
            data.map((row, rowIndex) => (
              <View key={rowIndex} style={[styles.row, rowIndex % 2 === 1 && styles.rowAlternative]}>
                {headers.map((h, cellIndex) => {
                  const val = row[h.key];
                  return (
                    <View key={cellIndex} style={[styles.cell, { flex: h.flex || 1, minWidth: h.width || 100 }]}>
                      {React.isValidElement(val) ? (
                        val
                      ) : (
                        <Text style={styles.cellText} numberOfLines={1}>
                          {val !== undefined && val !== null ? String(val) : '—'}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#131A35',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1C2541',
    marginVertical: 10,
  },
  table: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#1C2541',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#3A506B',
  },
  headerCell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  headerText: {
    color: '#8DA9C4',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1C2541',
    alignItems: 'center',
  },
  rowAlternative: {
    backgroundColor: 'rgba(28, 37, 65, 0.3)',
  },
  cell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  cellText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8DA9C4',
    fontSize: 13,
    fontStyle: 'italic',
  },
});

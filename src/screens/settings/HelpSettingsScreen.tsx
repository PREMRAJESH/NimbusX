import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

const SettingItem = ({ icon, title, onPress }: { icon: string; title: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <Icon name={icon} size={24} color={colors.textSecondary} />
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle}>{title}</Text>
    </View>
  </TouchableOpacity>
);

const HelpSettingsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <SettingItem icon="help-circle-outline" title="Help center" onPress={() => {}} />
          <SettingItem icon="people-outline" title="Contact us" onPress={() => {}} />
          <SettingItem icon="document-text-outline" title="Terms and Privacy Policy" onPress={() => {}} />
          <SettingItem icon="information-circle-outline" title="App info" onPress={() => {}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  section: {
    marginTop: spacing.s,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  itemContent: {
    flex: 1,
    marginLeft: spacing.l,
  },
  itemTitle: {
    fontSize: typography.fontSize.large,
    color: colors.textPrimary,
  },
});

export default HelpSettingsScreen;

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

const AccountSettingsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <SettingItem icon="lock-closed-outline" title="Privacy" onPress={() => {}} />
          <SettingItem icon="shield-checkmark-outline" title="Security" onPress={() => {}} />
          <SettingItem icon="phone-portrait-outline" title="Change number" onPress={() => {}} />
          <SettingItem icon="document-text-outline" title="Request account info" onPress={() => {}} />
          <SettingItem icon="trash-outline" title="Delete my account" onPress={() => {}} />
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

export default AccountSettingsScreen;

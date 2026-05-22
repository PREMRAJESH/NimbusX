import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

const SettingItem = ({ icon, title, subtitle, onPress, rightElement }: { icon: string; title: string; subtitle?: string; onPress?: () => void; rightElement?: React.ReactNode }) => (
  <TouchableOpacity style={styles.item} onPress={onPress} disabled={!onPress && !rightElement}>
    <Icon name={icon} size={24} color={colors.textSecondary} />
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle}>{title}</Text>
      {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement}
  </TouchableOpacity>
);

const ChatsSettingsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.section}>
          <SettingItem icon="moon-outline" title="Theme" subtitle="System default" onPress={() => {}} />
          <SettingItem icon="image-outline" title="Wallpaper" onPress={() => {}} />
        </View>

        <Text style={styles.sectionTitle}>Chat settings</Text>
        <View style={styles.section}>
          <SettingItem 
            icon="return-down-forward-outline" 
            title="Enter is send" 
            subtitle="Enter key will send your message" 
            rightElement={<Switch value={false} onValueChange={() => {}} thumbColor={colors.white} trackColor={{ true: colors.primaryAccent, false: colors.divider }} />} 
          />
          <SettingItem 
            icon="eye-outline" 
            title="Media visibility" 
            subtitle="Show newly downloaded media in your device's gallery" 
            rightElement={<Switch value={true} onValueChange={() => {}} thumbColor={colors.white} trackColor={{ true: colors.primaryAccent, false: colors.divider }} />} 
          />
        </View>

        <View style={styles.section}>
          <SettingItem icon="server-outline" title="Chat backup" onPress={() => {}} />
          <SettingItem icon="time-outline" title="Chat history" onPress={() => {}} />
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
  sectionTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginLeft: spacing.xl + 24 + spacing.m, // Align with text
    marginTop: spacing.l,
    marginBottom: spacing.xs,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
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
  itemSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default ChatsSettingsScreen;

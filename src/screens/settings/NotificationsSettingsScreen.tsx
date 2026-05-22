import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

const SettingItem = ({ title, subtitle, onPress, rightElement }: { title: string; subtitle?: string; onPress?: () => void; rightElement?: React.ReactNode }) => (
  <TouchableOpacity style={styles.item} onPress={onPress} disabled={!onPress && !rightElement}>
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle}>{title}</Text>
      {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement}
  </TouchableOpacity>
);

const NotificationsSettingsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={[styles.section, { borderTopWidth: 0, marginTop: 0 }]}>
          <SettingItem 
            title="Conversation tones" 
            subtitle="Play sounds for incoming and outgoing messages." 
            rightElement={<Switch value={true} onValueChange={() => {}} thumbColor={colors.white} trackColor={{ true: colors.primaryAccent, false: colors.divider }} />} 
          />
        </View>

        <Text style={styles.sectionTitle}>Messages</Text>
        <View style={styles.section}>
          <SettingItem title="Notification tone" subtitle="Default (ringtone)" onPress={() => {}} />
          <SettingItem title="Vibrate" subtitle="Default" onPress={() => {}} />
          <SettingItem title="Light" subtitle="White" onPress={() => {}} />
          <SettingItem 
            title="Use high priority notifications" 
            subtitle="Show previews of notifications at the top of the screen" 
            rightElement={<Switch value={true} onValueChange={() => {}} thumbColor={colors.white} trackColor={{ true: colors.primaryAccent, false: colors.divider }} />} 
          />
        </View>

        <Text style={styles.sectionTitle}>Groups</Text>
        <View style={styles.section}>
          <SettingItem title="Notification tone" subtitle="Default (ringtone)" onPress={() => {}} />
          <SettingItem title="Vibrate" subtitle="Default" onPress={() => {}} />
          <SettingItem title="Light" subtitle="White" onPress={() => {}} />
          <SettingItem 
            title="Use high priority notifications" 
            subtitle="Show previews of notifications at the top of the screen" 
            rightElement={<Switch value={true} onValueChange={() => {}} thumbColor={colors.white} trackColor={{ true: colors.primaryAccent, false: colors.divider }} />} 
          />
        </View>
        
        <Text style={styles.sectionTitle}>Calls</Text>
        <View style={styles.section}>
          <SettingItem title="Ringtone" subtitle="Default (ringtone)" onPress={() => {}} />
          <SettingItem title="Vibrate" subtitle="Default" onPress={() => {}} />
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
    marginLeft: spacing.xl,
    marginTop: spacing.xl,
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
    paddingLeft: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  itemContent: {
    flex: 1,
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

export default NotificationsSettingsScreen;

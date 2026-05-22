import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '@navigation/types';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logout } from '@store/slices/authSlice';
import { authService } from '@services/firebase/auth';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Avatar from '@components/common/Avatar';

import { persistor } from '@store/index';

type NavigationProp = StackNavigationProp<ChatStackParamList, 'Profile'>;

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
}

const SettingItem = React.memo(
  ({ icon, title, subtitle, color, onPress }: SettingItemProps) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Icon name={icon} size={24} color={color || colors.textSecondary} />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      <Icon name="chevron-forward" size={20} color={colors.divider} />
    </TouchableOpacity>
  )
);

const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const handleLogout = useCallback(async () => {
    await authService.signOut();
    dispatch(logout());
    // Purge all persisted data so contacts/messages don't leak to the next account
    await persistor.purge();
  }, [dispatch]);

  const goToProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <TouchableOpacity
          style={styles.profileHeader}
          onPress={goToProfile}
        >
          <Avatar
            uri={user?.avatarUrl}
            name={user?.displayName || 'User'}
            size={70}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.displayName || 'Set your name'}
            </Text>
            <Text style={styles.profileStatus}>
              {user?.email || 'No email'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <SettingItem
            icon="key-outline"
            title="Account"
            subtitle="Privacy, security, change number"
            onPress={() => navigation.navigate('AccountSettings' as any)}
          />
          <SettingItem
            icon="chatbubble-outline"
            title="Chats"
            subtitle="Theme, wallpapers, chat history"
            onPress={() => navigation.navigate('ChatsSettings' as any)}
          />
          <SettingItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Message, group & call tones"
            onPress={() => navigation.navigate('NotificationsSettings' as any)}
          />
          <SettingItem
            icon="help-circle-outline"
            title="Help"
            subtitle="Help center, contact us, privacy policy"
            onPress={() => navigation.navigate('HelpSettings' as any)}
          />
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="log-out-outline" size={24} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  profileInfo: {
    marginLeft: spacing.xl,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: typography.fontSize.xlarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  profileStatus: {
    fontSize: typography.fontSize.medium,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.xl,
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
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  logoutText: {
    fontSize: typography.fontSize.large,
    color: colors.error,
    fontWeight: 'bold',
    marginLeft: spacing.l,
  },
});

export default SettingsScreen;
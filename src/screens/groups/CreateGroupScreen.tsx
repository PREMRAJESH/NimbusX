import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '@navigation/types';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { firestoreService } from '@services/firebase/firestore';
import { useAppSelector } from '@store/hooks';
import Avatar from '@components/common/Avatar';
import { User } from '@types';

type NavigationProp = StackNavigationProp<ChatStackParamList, 'CreateGroup'>;

const MIN_MEMBERS = 2; // Minimum members *other than* the creator

const CreateGroupScreen = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAppSelector(state => state.auth.user);

  // Load contacts from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = firestoreService.listenContacts(currentUser.uid, setContacts);
    return () => unsubscribe();
  }, [currentUser]);

  // Toggle member selection
  const toggleMember = (uid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  // Filtered contacts based on search
  const filteredContacts = contacts.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.displayName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  const canCreate = name.trim().length > 0 && selectedIds.size >= MIN_MEMBERS;

  const handleCreate = async () => {
    if (!currentUser || !canCreate) return;

    setLoading(true);
    try {
      const allMembers = [currentUser.uid, ...Array.from(selectedIds)];

      // Initialize unreadCount and typing for all members
      const unreadCount: Record<string, number> = {};
      const typing: Record<string, boolean> = {};
      allMembers.forEach(uid => {
        unreadCount[uid] = 0;
        typing[uid] = false;
      });

      const chatId = await firestoreService.createChat({
        type: 'group',
        name: name.trim(),
        description: '',
        members: allMembers,
        admins: { [currentUser.uid]: true },
        createdBy: currentUser.uid,
        unreadCount,
        typing,
      });

      navigation.replace('GroupChat', {
        chatId,
        groupName: name.trim(),
      });
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Could not create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Selected members chips ──────────────────────────────────────────────
  const renderSelectedChips = () => {
    if (selectedIds.size === 0) return null;
    const selected = contacts.filter(c => selectedIds.has(c.uid));
    return (
      <View style={styles.chipsContainer}>
        {selected.map(user => (
          <TouchableOpacity
            key={user.uid}
            style={styles.chip}
            onPress={() => toggleMember(user.uid)}
          >
            <Avatar uri={user.avatarUrl} name={user.displayName || user.email} size={28} />
            <Text style={styles.chipName} numberOfLines={1}>
              {user.displayName || user.email}
            </Text>
            <Icon name="close-circle" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ── Contact item ────────────────────────────────────────────────────────
  const renderContact = ({ item }: { item: User }) => {
    const isSelected = selectedIds.has(item.uid);
    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected && styles.contactItemSelected]}
        onPress={() => toggleMember(item.uid)}
        activeOpacity={0.7}
      >
        <Avatar uri={item.avatarUrl} name={item.displayName || item.email} size={45} />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.displayName || item.email}</Text>
          <Text style={styles.contactStatus}>
            {item.status || 'Hey there! I am using NimbusX'}
          </Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Icon name="checkmark" size={14} color={colors.white} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Group name input */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarContainer}>
          <View style={styles.placeholderAvatar}>
            <Icon name="camera" size={30} color={colors.white} />
          </View>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.nameInput}
            placeholder="Type group name here..."
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Text style={styles.hint}>Please provide a group name and optional group icon</Text>
        </View>
      </View>

      {/* Member requirement notice */}
      <View style={styles.memberHeader}>
        <Text style={styles.sectionTitle}>
          ADD MEMBERS — {selectedIds.size} / {MIN_MEMBERS} min
        </Text>
        {selectedIds.size < MIN_MEMBERS && (
          <Text style={styles.memberWarning}>
            Select at least {MIN_MEMBERS} contacts
          </Text>
        )}
      </View>

      {/* Selected member chips */}
      {renderSelectedChips()}

      {/* Search contacts */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color={colors.textSecondary} style={{ marginRight: spacing.s }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close-circle" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Contact list */}
      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.uid || item.id}
        renderItem={renderContact}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="people-outline" size={40} color={colors.divider} />
            <Text style={styles.emptyTitle}>No contacts found</Text>
            <Text style={styles.emptyText}>
              Add contacts first from the new-chat screen to include them in a group.
            </Text>
          </View>
        }
      />

      {/* Create FAB */}
      <TouchableOpacity
        style={[styles.fab, !canCreate && styles.disabled]}
        onPress={handleCreate}
        disabled={!canCreate || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Icon name="checkmark" size={30} color={colors.white} />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  // ── Header / group name ──
  header: {
    flexDirection: 'row',
    padding: spacing.xxl,
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
  },
  avatarContainer: {
    marginRight: spacing.xl,
  },
  placeholderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
  },
  nameInput: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryAccent,
    paddingBottom: spacing.xs,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: spacing.s,
  },
  // ── Member header ──
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  memberWarning: {
    color: colors.warning || '#FFA726',
    fontSize: 11,
    fontWeight: '600',
  },
  // ── Selected chips ──
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    gap: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 20,
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    gap: spacing.xs,
    maxWidth: 160,
  },
  chipName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 80,
  },
  // ── Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    marginHorizontal: spacing.l,
    marginVertical: spacing.m,
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.regular,
    paddingVertical: spacing.s,
  },
  // ── Contact list ──
  listContent: {
    paddingBottom: 100, // room for FAB
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  contactItemSelected: {
    backgroundColor: 'rgba(29,161,242,0.08)',
  },
  contactInfo: {
    marginLeft: spacing.m,
    flex: 1,
  },
  contactName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    fontWeight: 'bold',
  },
  contactStatus: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  // ── Empty state ──
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: typography.fontSize.medium,
    marginTop: spacing.l,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
    textAlign: 'center',
    marginTop: spacing.s,
    lineHeight: 20,
  },
  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xxl,
    backgroundColor: colors.primaryAccent,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  disabled: {
    opacity: 0.35,
  },
});

export default CreateGroupScreen;

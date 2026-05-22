import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { ChatStackParamList } from '@navigation/types';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Avatar from '@components/common/Avatar';
import { useAppSelector } from '@store/hooks';
import { firestoreService } from '@services/firebase/firestore';
import { storageService } from '@services/firebase/storage';
import { User } from '@types';

type GroupInfoRouteProp = RouteProp<ChatStackParamList, 'GroupInfo'>;

// ── Member Item ─────────────────────────────────────────────────────────────
const MemberItem = React.memo(({
  member,
  isAdmin,
  isCurrentUser,
  isCurrentUserAdmin,
  onRemove,
}: {
  member: User;
  isAdmin: boolean;
  isCurrentUser: boolean;
  isCurrentUserAdmin: boolean;
  onRemove: () => void;
}) => (
  <View style={styles.memberItem}>
    <Avatar uri={member.avatarUrl} name={member.displayName || member.email} size={45} />
    <View style={styles.memberInfo}>
      <Text style={styles.memberName}>
        {member.displayName || member.email}
        {isCurrentUser ? ' (You)' : ''}
      </Text>
      <Text style={styles.memberEmail}>{member.email}</Text>
    </View>
    {isAdmin && (
      <View style={styles.adminBadge}>
        <Text style={styles.adminBadgeText}>Admin</Text>
      </View>
    )}
    {isCurrentUserAdmin && !isCurrentUser && (
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="remove-circle-outline" size={22} color={colors.error} />
      </TouchableOpacity>
    )}
  </View>
));

// ── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// ══════════════════════════════════════════════════════════════════════════════
const GroupInfoScreen = () => {
  const route = useRoute<GroupInfoRouteProp>();
  const navigation = useNavigation<any>();
  const { chatId } = route.params;
  const chat = useAppSelector(state => state.chats.entities[chatId]);
  const currentUser = useAppSelector(state => state.auth.user);

  // Member profiles
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Editable state
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isAdmin = !!(currentUser && chat?.admins?.[currentUser.uid]);

  // ── Load member profiles ────────────────────────────────────────────────
  useEffect(() => {
    if (!chat?.members?.length) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingMembers(true);
      const profiles: User[] = [];
      for (const uid of chat.members) {
        try {
          const u = await firestoreService.getUser(uid);
          if (u && !cancelled) profiles.push(u);
        } catch { /* skip */ }
      }
      if (!cancelled) {
        setMembers(profiles);
        setLoadingMembers(false);
      }
    })();

    return () => { cancelled = true; };
  }, [chat?.members]);

  // Keep editable values in sync
  useEffect(() => {
    setNameValue(chat?.name || '');
    setDescValue(chat?.description || '');
  }, [chat?.name, chat?.description]);

  // ── Save group name ─────────────────────────────────────────────────────
  const handleSaveName = useCallback(async () => {
    if (!nameValue.trim()) return;
    setSaving(true);
    try {
      await firestoreService.updateGroupDetails(chatId, { name: nameValue.trim() });
    } catch (e) {
      Alert.alert('Error', 'Could not update group name.');
    } finally {
      setEditingName(false);
      setSaving(false);
    }
  }, [chatId, nameValue]);

  // ── Save group description ──────────────────────────────────────────────
  const handleSaveDesc = useCallback(async () => {
    setSaving(true);
    try {
      await firestoreService.updateGroupDetails(chatId, { description: descValue.trim() });
    } catch (e) {
      Alert.alert('Error', 'Could not update description.');
    } finally {
      setEditingDesc(false);
      setSaving(false);
    }
  }, [chatId, descValue]);

  // ── Change group image ──────────────────────────────────────────────────
  const handleChangeAvatar = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      });
      if (result.didCancel || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset.uri) return;

      setUploadingAvatar(true);
      const url = await storageService.uploadAvatar(chatId, asset.uri, asset.type || 'image/jpeg');
      await firestoreService.updateGroupDetails(chatId, { avatarUrl: url });
    } catch (e) {
      Alert.alert('Error', 'Could not update group image.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [chatId, isAdmin]);

  // ── Remove member ───────────────────────────────────────────────────────
  const handleRemoveMember = useCallback((uid: string, name: string) => {
    Alert.alert(
      'Remove Member',
      `Remove ${name} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestoreService.removeGroupMember(chatId, uid);
            } catch (e) {
              Alert.alert('Error', 'Could not remove member.');
            }
          },
        },
      ]
    );
  }, [chatId]);

  // ── Leave group ─────────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    if (!currentUser) return;
    Alert.alert(
      'Exit Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestoreService.leaveGroup(chatId, currentUser.uid);
              navigation.popToTop();
            } catch (e) {
              Alert.alert('Error', 'Could not leave group.');
            }
          },
        },
      ]
    );
  }, [chatId, currentUser, navigation]);

  // ── Delete group (admin only) ───────────────────────────────────────────
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Group',
      'This will permanently delete the group and all messages for everyone. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestoreService.deleteGroup(chatId);
              navigation.popToTop();
            } catch (e) {
              Alert.alert('Error', 'Could not delete group.');
            }
          },
        },
      ]
    );
  }, [chatId, navigation]);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ── Group avatar + name header ─────────────────────────────────── */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={isAdmin ? handleChangeAvatar : undefined} activeOpacity={isAdmin ? 0.7 : 1}>
            <View>
              <Avatar uri={chat?.avatarUrl} name={chat?.name || 'Group'} size={100} />
              {isAdmin && (
                <View style={styles.cameraOverlay}>
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Icon name="camera" size={18} color={colors.white} />
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Group name */}
          {editingName ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={nameValue}
                onChangeText={setNameValue}
                autoFocus
                maxLength={50}
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity onPress={handleSaveName} disabled={saving}>
                <Icon name="checkmark-circle" size={26} color={colors.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingName(false); setNameValue(chat?.name || ''); }}>
                <Icon name="close-circle" size={26} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameRow}
              onPress={isAdmin ? () => setEditingName(true) : undefined}
              activeOpacity={isAdmin ? 0.6 : 1}
            >
              <Text style={styles.groupName}>{chat?.name || 'Group'}</Text>
              {isAdmin && <Icon name="pencil" size={16} color={colors.textSecondary} style={{ marginLeft: spacing.s }} />}
            </TouchableOpacity>
          )}

          <Text style={styles.groupMeta}>
            Group · {chat?.members?.length || 0} members
          </Text>
        </View>

        {/* ── Description section ────────────────────────────────────────── */}
        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailLabel}>Description</Text>
            {isAdmin && !editingDesc && (
              <TouchableOpacity onPress={() => setEditingDesc(true)}>
                <Icon name="pencil" size={16} color={colors.primaryAccent} />
              </TouchableOpacity>
            )}
          </View>
          {editingDesc ? (
            <View style={{ gap: spacing.s }}>
              <TextInput
                style={styles.descInput}
                value={descValue}
                onChangeText={setDescValue}
                multiline
                maxLength={500}
                placeholder="Add group description..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              <View style={styles.descActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDesc} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setEditingDesc(false); setDescValue(chat?.description || ''); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.descText}>
              {chat?.description || 'No description added.'}
            </Text>
          )}
          {!isAdmin && !editingDesc && (
            <Text style={styles.permHint}>Only admins can change the group description</Text>
          )}
        </View>

        {/* ── Media / Links / Docs (placeholder) ─────────────────────────── */}
        <TouchableOpacity style={styles.mediaRow}>
          <Icon name="images-outline" size={22} color={colors.primaryAccent} />
          <Text style={styles.mediaRowText}>Media, Links, and Docs</Text>
          <Icon name="chevron-forward" size={18} color={colors.divider} />
        </TouchableOpacity>

        {/* ── Members ────────────────────────────────────────────────────── */}
        <SectionHeader title={`${chat?.members?.length || 0} Members`} />

        {loadingMembers ? (
          <ActivityIndicator style={{ padding: spacing.xl }} color={colors.primaryAccent} />
        ) : (
          members.map(member => (
            <MemberItem
              key={member.uid}
              member={member}
              isAdmin={!!chat?.admins?.[member.uid]}
              isCurrentUser={member.uid === currentUser?.uid}
              isCurrentUserAdmin={isAdmin}
              onRemove={() => handleRemoveMember(member.uid, member.displayName || member.email)}
            />
          ))
        )}

        {/* ── Action buttons ─────────────────────────────────────────────── */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionRow} onPress={handleLeave}>
            <Icon name="log-out-outline" size={24} color={colors.error} />
            <Text style={styles.actionTextDanger}>Exit Group</Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
              <Icon name="trash-outline" size={24} color={colors.error} />
              <Text style={styles.actionTextDanger}>Delete Group</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Created by footer ──────────────────────────────────────────── */}
        <Text style={styles.createdText}>
          Created by {
            chat?.createdBy === currentUser?.uid
              ? 'You'
              : members.find(m => m.uid === chat?.createdBy)?.displayName || 'Unknown'
          }
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  // ── Header ──
  headerSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.secondaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryAccent,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondaryBackground,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.m,
  },
  groupName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxlarge,
    fontWeight: 'bold',
  },
  groupMeta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.regular,
    marginTop: spacing.xs,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.m,
    gap: spacing.s,
    width: '80%',
  },
  editInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryAccent,
    paddingVertical: spacing.xs,
  },
  // ── Description ──
  detailSection: {
    padding: spacing.xl,
    backgroundColor: colors.secondaryBackground,
    marginTop: spacing.m,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  detailLabel: {
    color: colors.primaryAccent,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  descText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.regular,
    lineHeight: 22,
  },
  descInput: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.regular,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    padding: spacing.m,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  descActions: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  saveBtn: {
    backgroundColor: colors.primaryAccent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.s,
    borderRadius: 8,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.s,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  permHint: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.s,
    fontStyle: 'italic',
  },
  // ── Media row ──
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.secondaryBackground,
    marginTop: spacing.m,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    gap: spacing.m,
  },
  mediaRowText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
  },
  // ── Section header ──
  sectionHeader: {
    padding: spacing.l,
    paddingBottom: spacing.s,
  },
  sectionTitle: {
    color: colors.primaryAccent,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  // ── Member item ──
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.l,
    backgroundColor: colors.secondaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memberInfo: {
    marginLeft: spacing.m,
    flex: 1,
  },
  memberName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  memberEmail: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
    marginTop: 1,
  },
  adminBadge: {
    borderWidth: 1,
    borderColor: colors.primaryAccent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: spacing.s,
  },
  adminBadgeText: {
    color: colors.primaryAccent,
    fontSize: 11,
    fontWeight: 'bold',
  },
  removeBtn: {
    padding: spacing.xs,
  },
  // ── Actions ──
  actionsSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.secondaryBackground,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  actionTextDanger: {
    color: colors.error,
    fontWeight: 'bold',
    fontSize: typography.fontSize.medium,
  },
  // ── Footer ──
  createdText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});

export default GroupInfoScreen;

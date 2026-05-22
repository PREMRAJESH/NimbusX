import firestore from '@react-native-firebase/firestore';
import { Chat, Message, User, Status } from '@types';
import { COLLECTIONS } from '@constants';

export const firestoreService = {
  /**
   * Listen to chats a user belongs to
   */
  listenUserChats(uid: string, callback: (chats: Chat[]) => void) {
    return firestore()
      .collection(COLLECTIONS.CHATS)
      .where('members', 'array-contains', uid)
      .onSnapshot(snapshot => {
        const chats = snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
            lastMessageAt: data.lastMessageAt?.toMillis ? data.lastMessageAt.toMillis() : (typeof data.lastMessageAt === 'number' ? data.lastMessageAt : undefined),
          };
        }) as Chat[];
        callback(chats);
      }, error => {
        console.error('Listen chats failed:', error);
      });
  },

  /**
   * Listen to messages in a specific chat
   */
  listenMessages(chatId: string, limit: number, callback: (messages: Message[]) => void) {
    return firestore()
      .collection(COLLECTIONS.CHATS)
      .doc(chatId)
      .collection(COLLECTIONS.MESSAGES)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .onSnapshot(snapshot => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
          };
        }) as Message[];
        callback(messages);
      }, error => {
        console.error('Listen messages failed:', error);
      });
  },

  /**
   * Send a message to a chat
   */
  async sendMessage(message: Partial<Message>) {
    const { chatId, ...rest } = message;
    if (!chatId) throw new Error('Chat ID is required');

    const msgRef = firestore()
      .collection(COLLECTIONS.CHATS)
      .doc(chatId)
      .collection(COLLECTIONS.MESSAGES)
      .doc();

    const batch = firestore().batch();
    
    // Add message
    batch.set(msgRef, {
      ...rest,
      id: msgRef.id,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Update chat summary
    batch.update(firestore().collection(COLLECTIONS.CHATS).doc(chatId), {
      lastMessage: message.text,
      lastMessageAt: firestore.FieldValue.serverTimestamp(),
      lastMessageSenderId: message.senderId,
    });

    return batch.commit();
  },

  /**
   * Delete a message
   */
  async deleteMessage(chatId: string, messageId: string) {
    if (!chatId || !messageId) return;
    return firestore()
      .collection(COLLECTIONS.CHATS)
      .doc(chatId)
      .collection(COLLECTIONS.MESSAGES)
      .doc(messageId)
      .delete();
  },

  /**
   * Create a new chat or group
   */
  async createChat(chatConfig: Partial<Chat>) {
    const chatRef = firestore().collection(COLLECTIONS.CHATS).doc();
    await chatRef.set({
      ...chatConfig,
      id: chatRef.id,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return chatRef.id;
  },

  /**
   * Delete a chat document (used to clean up duplicate chats)
   */
  async deleteChat(chatId: string) {
    return firestore().collection(COLLECTIONS.CHATS).doc(chatId).delete();
  },

  /**
   * Update or create a user profile in the database
   */
  async saveUser(userObj: Partial<User> & { uid: string }) {
    const { uid, ...data } = userObj;
    const normalised: any = {
      ...data,
    };

    if (data.email) {
      normalised.email = data.email.toLowerCase().trim();
    }

    await firestore().collection(COLLECTIONS.USERS).doc(uid).set(normalised, { merge: true });
  },

  /**
   * Get a user profile from the database
   */
  async getUser(uid: string): Promise<User | null> {
    const doc = await firestore().collection(COLLECTIONS.USERS).doc(uid).get();
    // @ts-ignore: `exists` is a property in v6 native runtime despite TS interface stating it as a function
    if (doc.exists) { 
      return { id: doc.id, uid: doc.id, ...doc.data() } as User;
    }
    return null;
  },

  /**
   * Search users by exact email
   */
  async searchUserByEmail(email: string): Promise<User | null> {
    const snapshot = await firestore()
      .collection(COLLECTIONS.USERS)
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();
      
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, uid: doc.id, ...doc.data() } as User;
    }
    return null;
  },

  /**
   * Add a contact to a user's contact list
   */
  async addContact(currentUid: string, contactData: User) {
    if (currentUid === contactData.uid) {
      throw new Error('Cannot add yourself as a contact');
    }

    await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(currentUid)
      .collection('contacts')
      .doc(contactData.uid)
      .set({
        ...contactData,
        addedAt: firestore.FieldValue.serverTimestamp()
      });
  },

  /**
   * Listen to a user's contacts
   */
  listenContacts(uid: string, callback: (contacts: User[]) => void) {
    return firestore()
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .collection('contacts')
      .orderBy('displayName', 'asc')
      .onSnapshot(snapshot => {
        const contacts = snapshot.docs.map(doc => ({
          ...doc.data()
        })) as User[];
        callback(contacts);
      }, error => {
        console.error('Listen contacts failed:', error);
      });
  },

  /**
   * Batch update message statuses
   */
  async updateMessageStatus(chatId: string, messageIds: string[], status: 'delivered' | 'read') {
    if (!messageIds || messageIds.length === 0) return;
    
    const batch = firestore().batch();
    const messagesRef = firestore()
      .collection(COLLECTIONS.CHATS)
      .doc(chatId)
      .collection(COLLECTIONS.MESSAGES);

    messageIds.forEach(id => {
      batch.update(messagesRef.doc(id), { status });
    });

    return batch.commit();
  },

  /**
   * Set typing status for a user in a chat
   */
  async setTypingStatus(chatId: string, uid: string, isTyping: boolean) {
    if (!chatId || !uid) return;
    
    return firestore()
      .collection(COLLECTIONS.CHATS)
      .doc(chatId)
      .set({
        typing: {
          [uid]: isTyping
        }
      }, { merge: true });
  },

  /**
   * Post a new status update (text and/or image).
   * Both createdAt and expiresAt are stored as plain number (ms since epoch)
   * so no composite Firestore index is needed.
   */
  async postStatus(status: Omit<Status, 'id'>): Promise<string> {
    const ref = firestore().collection(COLLECTIONS.STATUSES).doc();
    const now = Date.now();
    const TTL = 24 * 60 * 60 * 1000; // 24 hours
    await ref.set({
      ...status,
      id: ref.id,
      createdAt: now,
      expiresAt: status.expiresAt ?? now + TTL,
    });
    return ref.id;
  },

  /**
   * Listen to all active statuses.
   * Filters client-side to avoid needing a Firestore composite index.
   */
  listenStatuses(callback: (statuses: Status[]) => void) {
    return firestore()
      .collection(COLLECTIONS.STATUSES)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const now = Date.now();
        const statuses = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
              expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : Date.now() + 86400000,
            } as Status;
          })
          .filter(s => s.expiresAt > now); // client-side expiry filter
        callback(statuses);
      }, error => {
        console.error('Listen statuses failed:', error);
      });
  },

  /**
   * Update group details (name, description, avatarUrl).
   * Only admin should call this — permission check is done on the UI side.
   */
  async updateGroupDetails(chatId: string, data: { name?: string; description?: string; avatarUrl?: string }) {
    const updates: Record<string, any> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;

    return firestore().collection(COLLECTIONS.CHATS).doc(chatId).update(updates);
  },

  /**
   * Remove a member from a group
   */
  async removeGroupMember(chatId: string, uid: string) {
    return firestore().collection(COLLECTIONS.CHATS).doc(chatId).update({
      members: firestore.FieldValue.arrayRemove(uid),
      [`unreadCount.${uid}`]: firestore.FieldValue.delete(),
      [`typing.${uid}`]: firestore.FieldValue.delete(),
    });
  },

  /**
   * Leave a group (self-remove)
   */
  async leaveGroup(chatId: string, uid: string) {
    return this.removeGroupMember(chatId, uid);
  },

  /**
   * Delete a group and all its messages.
   * Messages are deleted in batches first (before the chat doc) because
   * message-level security rules call get() on the parent chat doc to
   * verify membership — deleting both in one batch would cause a race.
   */
  async deleteGroup(chatId: string) {
    const messagesRef = firestore()
      .collection(COLLECTIONS.CHATS)
      .doc(chatId)
      .collection(COLLECTIONS.MESSAGES);

    // Delete messages in batches of 400 (Firestore batch limit is 500)
    let snapshot = await messagesRef.limit(400).get();
    while (!snapshot.empty) {
      const batch = firestore().batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      snapshot = await messagesRef.limit(400).get();
    }

    // Now delete the chat document itself
    return firestore().collection(COLLECTIONS.CHATS).doc(chatId).delete();
  },
};

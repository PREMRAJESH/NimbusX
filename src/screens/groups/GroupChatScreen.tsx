import React, { useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { messagesSelectors, upsertMessage } from '@store/slices/messageSlice';
import { ChatStackParamList } from '@navigation/types';
import { useMessages } from '@hooks/useMessages';
import { firestoreService } from '@services/firebase/firestore';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

// Components
import MessageBubble from '@components/chat/MessageBubble';
import ChatInput from '@components/chat/ChatInput';

type GroupChatRouteProp = RouteProp<ChatStackParamList, 'GroupChat'>;

const HeaderRight = React.memo(({ chatId, navigation }: { chatId: string; navigation: any }) => (
  <TouchableOpacity 
    style={{ marginRight: spacing.m }}
    onPress={() => navigation.navigate('GroupInfo', { chatId })}
  >
    <Icon name="information-circle-outline" size={28} color={colors.textPrimary} />
  </TouchableOpacity>
));

const GroupChatScreen = () => {
  const route = useRoute<GroupChatRouteProp>();
  const navigation = useNavigation<any>();
  const { chatId, groupName } = route.params;
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  const messages = useAppSelector((state) => 
    messagesSelectors.selectAll(state).filter(m => m.chatId === chatId)
  ).sort((a, b) => b.createdAt - a.createdAt);

  const { loadMore } = useMessages(chatId);

  // Stable render function for headerRight
  const renderHeaderRight = useCallback(
    () => <HeaderRight chatId={chatId} navigation={navigation} />,
    [chatId, navigation]
  );

  // Set Header Title with Info Icon
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: groupName,
      headerRight: renderHeaderRight,
    });
  }, [navigation, groupName, renderHeaderRight]);

  const handleSend = async (text: string) => {
    if (!user) return;
    const tempMsg: any = {
      id: `temp_${Date.now()}`,
      chatId,
      senderId: user.uid,
      text,
      createdAt: Date.now(),
      status: 'pending',
    };
    dispatch(upsertMessage(tempMsg));
    try {
      await firestoreService.sendMessage({
        chatId,
        senderId: user.uid,
        text,
        createdAt: Date.now(),
        status: 'sent',
      });
      dispatch(upsertMessage({ ...tempMsg, status: 'sent' }));
    } catch (error) {
      console.error('Failed to send group message:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
    }
  };

  const handleSendGif = async (gif: { url: string }) => {
    if (!user) return;
    const tempMsg: any = {
      id: `temp_${Date.now()}`,
      chatId,
      senderId: user.uid,
      text: '',
      mediaUrl: gif.url,
      mediaType: 'gif',
      createdAt: Date.now(),
      status: 'pending',
    };
    dispatch(upsertMessage(tempMsg));
    try {
      await firestoreService.sendMessage({
        chatId, senderId: user.uid, text: '',
        mediaUrl: gif.url, mediaType: 'gif',
        createdAt: Date.now(), status: 'sent',
      });
      dispatch(upsertMessage({ ...tempMsg, status: 'sent' }));
    } catch (error) {
      console.error('Failed to send GIF:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
    }
  };

  const handleSendSticker = async (sticker: { url: string }) => {
    if (!user) return;
    const tempMsg: any = {
      id: `temp_${Date.now()}`,
      chatId,
      senderId: user.uid,
      text: '',
      mediaUrl: sticker.url,
      mediaType: 'sticker',
      createdAt: Date.now(),
      status: 'pending',
    };
    dispatch(upsertMessage(tempMsg));
    try {
      await firestoreService.sendMessage({
        chatId, senderId: user.uid, text: '',
        mediaUrl: sticker.url, mediaType: 'sticker',
        createdAt: Date.now(), status: 'sent',
      });
      dispatch(upsertMessage({ ...tempMsg, status: 'sent' }));
    } catch (error) {
      console.error('Failed to send sticker:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <View>
              {item.senderId !== user?.uid && (
                <Text style={styles.senderName}>User {item.senderId.substring(0, 4)}</Text>
              )}
              <MessageBubble 
                message={item} 
                isMine={item.senderId === user?.uid} 
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          inverted
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
        />
        <ChatInput
          onSend={handleSend}
          onTyping={() => {}}
          onSendGif={handleSendGif}
          onSendSticker={handleSendSticker}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.m,
  },
  senderName: {
    color: colors.primaryAccent,
    fontSize: 10,
    marginLeft: spacing.xl,
    marginBottom: -spacing.xs,
    fontWeight: 'bold',
  },
});

export default GroupChatScreen;

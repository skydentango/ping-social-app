import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, StatusBar, Platform, RefreshControl } from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ping, PingResponse, Group, User } from '../types';
import { getColors, typography, spacing, borderRadius, shadows } from '../utils/theme';
import Card from '../components/Card';

const HomeScreen = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);
  const [pings, setPings] = useState<Ping[]>([]);
  const [groups, setGroups] = useState<{[key: string]: Group}>({});
  const [users, setUsers] = useState<{[key: string]: User}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingTo, setRespondingTo] = useState<{[key: string]: string}>({}); // pingId -> responseType

  useEffect(() => {
    if (!user) return;

    // Load pings
    const pingsQuery = query(
      collection(db, 'pings'),
      orderBy('sentAt', 'desc')
    );

    const unsubscribePings = onSnapshot(pingsQuery, async (snapshot) => {
      const allPings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate() || new Date(),
        responses: doc.data().responses || []
      })) as Ping[];
      
      // Filter pings to only show ones the user should see
      const userPings = allPings.filter(ping => {
        // User should see pings where they are in the recipients array
        return ping.recipients && ping.recipients.includes(user.id);
      });
      
      // Load only the groups and users we need for these pings
      const groupIds = new Set<string>();
      const userIds = new Set<string>();
      
      userPings.forEach(ping => {
        if (ping.type === 'group' && ping.groupId) {
          groupIds.add(ping.groupId);
        }
        if (ping.recipients) {
          ping.recipients.forEach(userId => userIds.add(userId));
        }
      });

      // Load required groups
      const groupsMap: {[key: string]: Group} = {};
      for (const groupId of groupIds) {
        try {
          const groupDoc = await getDoc(doc(db, 'groups', groupId));
          if (groupDoc.exists()) {
            groupsMap[groupId] = {
              id: groupId,
              ...groupDoc.data(),
              createdAt: groupDoc.data().createdAt?.toDate() || new Date(),
              updatedAt: groupDoc.data().updatedAt?.toDate() || new Date(),
            } as Group;
          }
        } catch (error) {
          console.log('Could not load group:', groupId);
        }
      }

      // Load required users
      const usersMap: {[key: string]: User} = {};
      for (const userId of userIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            usersMap[userId] = {
              id: userId,
              ...userDoc.data(),
              createdAt: userDoc.data().createdAt?.toDate() || new Date(),
              updatedAt: userDoc.data().updatedAt?.toDate() || new Date(),
              status: {
                emoji: userDoc.data().status?.emoji || '🟢',
                text: userDoc.data().status?.text || 'Free',
                updatedAt: userDoc.data().status?.updatedAt?.toDate() || new Date(),
              }
            } as User;
          }
        } catch (error) {
          console.log('Could not load user:', userId);
        }
      }

      setGroups(groupsMap);
      setUsers(usersMap);
      setPings(userPings);
      setLoading(false);
    });

    return unsubscribePings;
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    // The onSnapshot listener will automatically update with fresh data
    // We just need to simulate a brief refresh period for user feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getPingRecipientText = (ping: Ping): string => {
    if (ping.type === 'group' && ping.groupId && groups[ping.groupId]) {
      return `👥 ${groups[ping.groupId].name}`;
    } else if (ping.type === 'friends' && ping.recipients) {
      // Filter out the sender from recipients to show only the actual friends
      const friendIds = ping.recipients.filter(id => id !== ping.senderId);
      const friendNames = friendIds.map(id => users[id]?.displayName || 'Friend').slice(0, 3);
      
      if (friendNames.length === 0) {
        return '👤 Friends';
      } else if (friendNames.length === 1) {
        return `👤 ${friendNames[0]}`;
      } else if (friendNames.length === 2) {
        return `👤 ${friendNames[0]} & ${friendNames[1]}`;
      } else {
        const remaining = friendIds.length - 2;
        return `👤 ${friendNames[0]}, ${friendNames[1]} & ${remaining} more`;
      }
    }
    
    // Fallback
    return ping.type === 'group' ? '👥 Group' : '👤 Friends';
  };

  const handleResponse = async (pingId: string, response: 'yes' | 'no' | 'maybe') => {
    if (!user) return;

    // Set loading state for this specific ping
    setRespondingTo(prev => ({ ...prev, [pingId]: response }));

    // Optimistic update - immediately update the UI
    const newResponse: PingResponse = {
      userId: user.id,
      response,
      respondedAt: new Date()
    };

    setPings(prevPings => 
      prevPings.map(ping => {
        if (ping.id === pingId) {
          const filteredResponses = ping.responses.filter(r => r.userId !== user.id);
          return {
            ...ping,
            responses: [...filteredResponses, newResponse]
          };
        }
        return ping;
      })
    );

    try {
      // Update Firebase in the background
      const pingRef = doc(db, 'pings', pingId);
      const ping = pings.find(p => p.id === pingId);
      if (ping) {
        const filteredResponses = ping.responses.filter(r => r.userId !== user.id);
        await updateDoc(pingRef, {
          responses: [...filteredResponses, newResponse]
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setPings(prevPings => 
        prevPings.map(ping => {
          if (ping.id === pingId) {
            return {
              ...ping,
              responses: ping.responses.filter(r => r.userId !== user.id)
            };
          }
          return ping;
        })
      );
      Alert.alert('Error', 'Failed to respond to ping. Please try again.');
    } finally {
      // Clear loading state
      setRespondingTo(prev => {
        const newState = { ...prev };
        delete newState[pingId];
        return newState;
      });
    }
  };

  const handleDeletePing = async (pingId: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Ping',
      'Are you sure you want to delete this ping? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic deletion - remove from UI immediately
              const originalPings = pings;
              setPings(prevPings => prevPings.filter(p => p.id !== pingId));
              
              try {
                await deleteDoc(doc(db, 'pings', pingId));
              } catch (deleteError) {
                // Revert optimistic deletion on error
                setPings(originalPings);
                throw deleteError;
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('Error', `Failed to delete ping: ${errorMessage}`);
            }
          },
        },
      ]
    );
  };

  const getUserResponse = (ping: Ping): PingResponse | undefined => {
    return ping.responses.find(r => r.userId === user?.id);
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderResponseButton = (
    ping: Ping, 
    responseType: 'yes' | 'no' | 'maybe', 
    icon: string, 
    color: string,
    label: string
  ) => {
    const userResponse = getUserResponse(ping);
    const isSelected = userResponse?.response === responseType;
    const count = ping.responses.filter(r => r.response === responseType).length;
    const isLoading = respondingTo[ping.id] === responseType;

    return (
      <TouchableOpacity
        style={[
          styles.responseButton,
          isSelected && { backgroundColor: color, borderColor: color },
          isLoading && styles.responseButtonLoading
        ]}
        onPress={() => handleResponse(ping.id, responseType)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Ionicons 
            name="hourglass" 
            size={16} 
            color={isSelected ? colors.white : color} 
          />
        ) : (
          <Ionicons 
            name={icon as any} 
            size={16} 
            color={isSelected ? colors.white : color} 
          />
        )}
        <Text style={[
          styles.responseButtonText,
          isSelected && { color: colors.white }
        ]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={[styles.responseBadge, { backgroundColor: isSelected ? colors.white : color }]}>
            <Text style={[styles.responseBadgeText, { color: isSelected ? color : colors.white }]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPing = ({ item }: { item: Ping }) => {
    const isMyPing = item.senderId === user?.id;
    


    return (
      <Card style={styles.pingCard} shadow="small">
        <View style={styles.pingHeader}>
          <View style={styles.pingInfo}>
            <View style={styles.pingMessageRow}>
              <Text style={styles.pingMessage}>{item.message}</Text>
              {isMyPing && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePing(item.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.pingMetaRow}>
              <View style={styles.pingTimeContainer}>
                <Text style={styles.pingTime}>{getTimeAgo(item.sentAt)}</Text>
                <Text style={styles.pingType}>
                  {getPingRecipientText(item)}
                </Text>
              </View>
              {isMyPing && (
                <Text style={styles.yourPingLabel}>Your ping</Text>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Your response</Text>
          <View style={styles.responseButtons}>
            {renderResponseButton(item, 'yes', 'checkmark-circle', colors.success, 'Yes')}
            {renderResponseButton(item, 'maybe', 'help-circle', colors.warning, 'Maybe')}
            {renderResponseButton(item, 'no', 'close-circle', colors.error, 'No')}
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubbles-outline" size={64} color={colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>No pings yet</Text>
      <Text style={styles.emptySubtitle}>
        When friends send pings, they'll appear here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pings...</Text>
        </View>
      ) : pings.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={pings}
          renderItem={renderPing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.xl,
  },
  pingCard: {
    marginBottom: spacing.md,
  },
  pingHeader: {
    marginBottom: spacing.sm,
  },
  pingInfo: {
    flex: 1,
  },
  pingMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  pingMessage: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    lineHeight: 22,
    marginRight: spacing.sm,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray50,
  },
  pingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pingTimeContainer: {
    flexDirection: 'column',
  },
  pingTime: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  pingType: {
    fontSize: typography.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  yourPingLabel: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.medium,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  responseContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.sm,
  },
  responseLabel: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginHorizontal: 2,
    position: 'relative',
    minHeight: 36,
  },
  responseButtonLoading: {
    opacity: 0.7,
  },
  responseButtonText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  responseBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseBadgeText: {
    fontSize: 10,
    fontWeight: typography.bold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HomeScreen; 
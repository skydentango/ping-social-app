import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getColors, typography, spacing, borderRadius, shadows } from '../utils/theme';
import Card from '../components/Card';

interface StatusOption {
  emoji: string;
  text: string;
  description: string;
  color: string;
}

const statusOptions: StatusOption[] = [
  {
    emoji: '🟢',
    text: 'Free',
    description: 'Available to hang out',
    color: '#00D4AA', // Green - works in both themes
  },
  {
    emoji: '🟡',
    text: 'Maybe',
    description: 'Might be free, ask me',
    color: '#FDCB6E', // Orange - works in both themes
  },
  {
    emoji: '🔴',
    text: 'Busy',
    description: 'Not available right now',
    color: '#E74C3C', // Red - works in both themes
  },
];

const StatusScreen = () => {
  const { user, updateUserStatus } = useAuth();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (statusOption: StatusOption) => {
    if (!user) return;

    setUpdating(true);
    try {
      await updateUserStatus({
        emoji: statusOption.emoji,
        text: statusOption.text,
        updatedAt: new Date(),
      });

      Alert.alert('Status Updated', `Your status is now "${statusOption.emoji} ${statusOption.text}"`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const renderStatusOption = (option: StatusOption) => {
    const isCurrentStatus = user?.status?.text === option.text;
    
    const cardStyle = isCurrentStatus 
      ? { ...styles.statusCard, borderColor: option.color, borderWidth: 2 }
      : styles.statusCard;

    return (
      <TouchableOpacity
        key={option.text}
        style={styles.statusOption}
        onPress={() => updateStatus(option)}
        disabled={updating || isCurrentStatus}
      >
        <Card 
          style={cardStyle}
          shadow={isCurrentStatus ? "medium" : "small"}
        >
          <View style={styles.statusContent}>
            <View style={styles.statusLeft}>
              <Text style={styles.statusEmoji}>{option.emoji}</Text>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusText, isCurrentStatus && { color: option.color }]}>
                  {option.text}
                </Text>
                <Text style={styles.statusDescription}>{option.description}</Text>
              </View>
            </View>
            
            {isCurrentStatus ? (
              <View style={[styles.currentBadge, { backgroundColor: option.color }]}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Current Status Display */}
        <Card style={styles.currentStatusCard} shadow="medium">
          <View style={styles.currentStatusHeader}>
            <Text style={styles.currentStatusLabel}>Your Current Status</Text>
            <Text style={styles.lastUpdated}>
              Updated {user?.status?.updatedAt ? 
                (user.status.updatedAt instanceof Date ? 
                  user.status.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                  new Date(user.status.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                ) : 'Never'}
            </Text>
          </View>
          
          <View style={styles.currentStatusDisplay}>
            <Text style={styles.currentStatusEmoji}>{user?.status?.emoji || '🟢'}</Text>
            <View style={styles.currentStatusInfo}>
              <Text style={styles.currentStatusText}>{user?.status?.text || 'Free'}</Text>
              <Text style={styles.currentStatusSubtext}>
                {statusOptions.find(opt => opt.text === user?.status?.text)?.description || 'Available to hang out'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Status Options */}
        <View style={styles.statusOptionsSection}>
          <Text style={styles.sectionTitle}>Choose Your Status</Text>
          <Text style={styles.sectionSubtitle}>
            Let your friends know what you're up to
          </Text>
          
          <View style={styles.statusOptions}>
            {statusOptions.map(renderStatusOption)}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  currentStatusCard: {
    marginBottom: spacing.lg,
  },
  currentStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  currentStatusLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lastUpdated: {
    fontSize: typography.xs,
    color: colors.textTertiary,
  },
  currentStatusDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentStatusEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  currentStatusInfo: {
    flex: 1,
  },
  currentStatusText: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  currentStatusSubtext: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  statusOptionsSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  statusOptions: {
    gap: spacing.sm,
  },
  statusOption: {
    marginBottom: spacing.xs,
  },
  statusCard: {
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  currentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.white,
  },
});

export default StatusScreen; 
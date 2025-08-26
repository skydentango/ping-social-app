import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, StatusBar, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../services/AuthContext';
import { uploadProfilePicture } from '../services/imageUpload';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';
import Card from '../components/Card';

const ProfileScreen = () => {
  const { user, logout, updateProfilePicture } = useAuth();
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const selectProfilePicture = () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to select your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Camera',
          onPress: () => pickImage(true),
        },
        {
          text: 'Photo Library',
          onPress: () => pickImage(false),
        },
      ]
    );
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      // Request permissions
      const { status } = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera/photo library permissions to change your profile picture.');
        return;
      }

      // Launch image picker
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: 'images' as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images' as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });

      if (!result.canceled && result.assets[0] && user) {
        setUploadingImage(true);
        
        try {
          // Upload image to Firebase Storage
          const downloadURL = await uploadProfilePicture(result.assets[0].uri, user.id);
          
          // Update user profile with the download URL
          await updateProfilePicture(downloadURL);
          
          Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
          console.error('Error updating profile picture:', error);
          Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setUploadingImage(false);
    }
  };

  const renderProfilePicture = () => {
    if (user?.profilePicture) {
      return (
        <Image 
          source={{ uri: user.profilePicture }} 
          style={styles.profileImage}
          onError={(error) => {
            console.error('Error loading profile image:', error);
          }}
        />
      );
    } else {
      return (
        <Text style={styles.avatarText}>
          {user?.displayName?.charAt(0).toUpperCase() || 'U'}
        </Text>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Profile Card */}
        <Card style={styles.profileCard} shadow="medium">
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={selectProfilePicture}
            disabled={uploadingImage}
          >
            <View style={styles.avatar}>
              {renderProfilePicture()}
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </View>
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.displayName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusEmoji}>{user?.status?.emoji || '🟢'}</Text>
            <Text style={styles.statusText}>{user?.status?.text || 'Free'}</Text>
          </View>
        </Card>

        {/* Account Section */}
        <Card style={styles.section} shadow="small">
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={selectProfilePicture}
            disabled={uploadingImage}
          >
            <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>Change Profile Picture</Text>
              <Text style={styles.menuItemSubtext}>
                {uploadingImage ? 'Uploading...' : 'Update your profile photo'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>Notifications</Text>
              <Text style={styles.menuItemSubtext}>Manage ping alerts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-outline" size={24} color={colors.textSecondary} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>Privacy</Text>
              <Text style={styles.menuItemSubtext}>Control your visibility</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]}>
            <Ionicons name="help-circle-outline" size={24} color={colors.textSecondary} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>Help & Support</Text>
              <Text style={styles.menuItemSubtext}>Get help using Ping</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
          </TouchableOpacity>
        </Card>

        {/* Ping Pro Section */}
        <Card style={styles.section} shadow="small">
          <Text style={styles.sectionTitle}>Ping Pro</Text>
          
          <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]}>
            <Ionicons name="star-outline" size={24} color="#FFD700" />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemText}>Upgrade to Pro</Text>
              <Text style={styles.menuItemSubtext}>Unlock premium features</Text>
            </View>
            <View style={styles.proTag}>
              <Text style={styles.proTagText}>PRO</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Ping v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: typography.bold,
    color: colors.white,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  uploadingText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  displayName: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  statusEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    padding: spacing.md,
    paddingBottom: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuItemText: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.textPrimary,
  },
  menuItemSubtext: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  proTag: {
    backgroundColor: '#FFD700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  proTagText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  logoutText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  version: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});

export default ProfileScreen; 
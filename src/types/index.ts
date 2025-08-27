export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string; // URL to profile picture
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStatus {
  emoji: string;
  text: string;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // User IDs
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface Ping {
  id: string;
  message: string;
  groupId?: string; // Optional - for group pings
  recipients: string[]; // User IDs - for individual friend pings or group members
  senderId: string;
  sentAt: Date;
  responses: PingResponse[];
  type: 'group' | 'friends'; // New field to distinguish ping types
}

export interface PingResponse {
  userId: string;
  response: 'yes' | 'no' | 'maybe';
  respondedAt: Date;
}

export type RootTabParamList = {
  Home: undefined;
  SendPing: undefined;
  Groups: undefined;
  Status: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
}; 
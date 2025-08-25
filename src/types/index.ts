export interface User {
  id: string;
  email: string;
  displayName: string;
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
  groupId: string;
  senderId: string;
  sentAt: Date;
  responses: PingResponse[];
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
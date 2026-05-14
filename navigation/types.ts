import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ClassWithStats } from '../types/domain';

export type ClassesStackParamList = {
  ClassesHome: undefined;
  ClassDashboard: { classRow: ClassWithStats };
  StudentDetail: { studentId: string };
};

export type AppTabsParamList = {
  Classes: NavigatorScreenParams<ClassesStackParamList> | undefined;
  Statistics: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Landing: undefined;
  LoginScreen: undefined;
};

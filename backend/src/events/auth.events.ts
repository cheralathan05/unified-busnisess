// auto-generated
import { eventBus } from "../core/events/eventBus";
import { Events } from "./types/event.types";

export const emitUserRegistered = (data: {
  userId: string;
  email: string;
}) => {
  eventBus.emit(Events.USER_REGISTERED, data);
};

export const emitUserLoggedIn = (data: {
  userId: string;
  ip: string;
  device: string;
}) => {
  eventBus.emit(Events.USER_LOGGED_IN, data);
};

export const emitFailedLogin = (data: {
  email: string;
  ip: string;
}) => {
  eventBus.emit(Events.FAILED_LOGIN, data);
};

export const emitPasswordResetRequested = (data: {
  email: string;
  otp: string;
}) => {
  eventBus.emit(Events.PASSWORD_RESET_REQUESTED, data);
};

export const emitPasswordResetSuccess = (data: {
  userId: string;
}) => {
  eventBus.emit(Events.PASSWORD_RESET_SUCCESS, data);
};
// auto-generated
import { emitUserRegistered, emitUserLoggedIn } from "../../events/auth.events";
import { emitAuditLog } from "../../events/audit.events";

export const onUserRegister = (user: any) => {
  emitUserRegistered({ userId: user.id, email: user.email });

  emitAuditLog({
    userId: user.id,
    action: "REGISTER",
  });
};

export const onUserLogin = (user: any, ip: string) => {
  emitUserLoggedIn({
    userId: user.id,
    ip,
    device: "unknown",
  });

  emitAuditLog({
    userId: user.id,
    action: "LOGIN",
    meta: { ip },
  });
};
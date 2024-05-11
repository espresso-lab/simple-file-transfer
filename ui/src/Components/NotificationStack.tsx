import { TechNotification as NotificationType } from "../Context";
import { Notification } from "./Notification";
import classes from "./NotificationStack.module.scss";

interface NotificationProps {
  notifications: NotificationType[];
  closeNotification: (id: number) => void;
}

export function NotificationStack({
  notifications,
  closeNotification,
}: NotificationProps) {
  return (
    <div className={classes.notificationStack}>
      {notifications.map(({ id, type, message, state }, index) => (
        <Notification
          key={`notification_${index}`}
          type={type}
          message={message}
          onClose={() => closeNotification(id)}
          state={state}
        />
      ))}
    </div>
  );
}

import { useEffect } from "react";
import { Notification as NotificationType } from "../Context";
import classes from "./Notification.module.scss";
import CloseIcon from "../Icons/close.svg";

interface NotificationProps extends NotificationType {
  duration?: number;
  onClose: () => void;
  state: "active" | "closing" | "closed";
}

export function Notification({
  type = "info",
  duration = 3000,
  onClose,
  message,
  state,
}: NotificationProps) {
  useEffect(() => {
    switch (state) {
      case "active":
        setTimeout(() => {
          onClose();
        }, duration);
        break;
    }
  }, [state, duration]);
  const classNames = [classes.notification, classes[type], classes[state]].join(
    " "
  );
  return (
    <div className={classNames}>
      {message}
      <button className={classes.button} onClick={onClose}>
        <img className={classes.icon} src={CloseIcon} />
      </button>
    </div>
  );
}

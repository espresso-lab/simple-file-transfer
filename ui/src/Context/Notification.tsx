import { createContext, useContext, useEffect, useState } from "react";
import { NotificationStack } from "../Components";

export interface Notification {
  message: string;
  type?: "error" | "success" | "info" | "warning";
  duration?: number;
}

export interface TechNotification extends Notification {
  id: number;
  state: "active" | "closing" | "closed";
}

interface NotificationProps {
  notifications: TechNotification[];
  notify: (notification: Notification) => void;
  closeNotification: (id: number) => void;
}

const NotificationsContext = createContext<NotificationProps>({
  notifications: [],
  notify: () => {},
  closeNotification: () => {},
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<TechNotification[]>([]);

  useEffect(
    function () {
      const active = notifications.filter((n) => n.state !== "closed");
      if (!active.length && notifications.length) {
        setNotifications([]);
      }
    },
    [closeNotification]
  );

  function notify(notification: Notification) {
    setNotifications((n) => [
      ...n,
      {
        ...notification,
        id: Date.now(),
        state: "active",
      },
    ]);
  }

  function closeNotification(id: number) {
    setNotifications((notifications) =>
      notifications.map((n) => (n.id === id ? { ...n, state: "closing" } : n))
    );
    setTimeout(() => {
      setNotifications((notifications) =>
        notifications.map((n) => (n.id === id ? { ...n, state: "closed" } : n))
      );
    }, 300);
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        notify,
        closeNotification,
      }}
    >
      <NotificationStack
        notifications={notifications}
        closeNotification={(id: number) => closeNotification(id)}
      />
      {children}
    </NotificationsContext.Provider>
  );
}

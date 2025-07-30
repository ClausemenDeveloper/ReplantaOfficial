import React, { useState } from 'react';

type NotificationSettingsProps = {
    initialEmail?: boolean;
    initialPush?: boolean;
    onSave?: (settings: { email: boolean; push: boolean }) => void;
};

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
    initialEmail = true,
    initialPush = true,
    onSave,
}) => {
    const [emailNotifications, setEmailNotifications] = useState(initialEmail);
    const [pushNotifications, setPushNotifications] = useState(initialPush);

    const handleSave = () => {
        if (onSave) {
            onSave({ email: emailNotifications, push: pushNotifications });
        }
    };

    return (
        <div>
            <h2>Configurações de Notificações</h2>
            <label>
                <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={() => setEmailNotifications(!emailNotifications)}
                />
                Notificações por Email
            </label>
            <br />
            <label>
                <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={() => setPushNotifications(!pushNotifications)}
                />
                Notificações Push
            </label>
            <br />
            <button onClick={handleSave}>Salvar</button>
        </div>
    );
};

export default NotificationSettings;
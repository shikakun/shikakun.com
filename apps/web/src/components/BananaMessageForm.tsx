import { Button, TextField } from '@shikakun/react';
import { useState } from 'react';
import styles from './BananaMessageForm.module.css';

type FeedbackType = {
  message: string;
  type: 'success' | 'error' | '';
};

type Props = {
  apiUrl: string;
  apiToken: string;
};

const sendMessage = async (
  apiUrl: string,
  payload: {
    from: string;
    message: string;
    name?: string;
    token: string;
  },
): Promise<boolean> => {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send message:', error);
    return false;
  }
};

const BananaMessageForm: React.FC<Props> = ({ apiUrl, apiToken }) => {
  const [feedback, setFeedback] = useState<FeedbackType>({ message: '', type: '' });
  const [formVisible, setFormVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageError, setMessageError] = useState<string | undefined>(undefined);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessageError(undefined);

    const formData = new FormData(event.currentTarget);
    const message = formData.get('message') as string;
    const name = formData.get('name') as string | null;

    if (!message.trim()) {
      setMessageError('本文を入力してください〜！');
      setIsSubmitting(false);
      return;
    }

    const success = await sendMessage(apiUrl, {
      from: 'バナナブレッドのラジオのおたより',
      message,
      name: name || undefined,
      token: apiToken,
    });

    if (success) {
      setFeedback({ message: '送信しました。おたより、ありがとうございました！', type: 'success' });
      setFormVisible(false);
    } else {
      setFeedback({
        message:
          'システムの不具合か、通信状況が悪くて送信できませんでした。せっかく書いてくれたのに、ごめんなさい…。お手数ですが、時間を置いてもういちど「送信」ボタンを押すか、メールまたはSNSのDMなど別の手段でお送りいただけると、うれしいです。',
        type: 'error',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      {formVisible && (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            label="本文"
            name="message"
            rows={8}
            required
            error={messageError !== undefined}
            errorMessage={messageError}
          />
          <div className={styles.footer}>
            <div className={styles.nameField}>
              <TextField label="ラジオネーム（空欄でもOK👌）" name="name" autoComplete="name" />
            </div>
            <div className={styles.action}>
              <Button
                type="submit"
                appearance="filled"
                color="primary"
                width="full"
                disabled={isSubmitting}
              >
                {isSubmitting ? '送信中...' : '送信'}
              </Button>
            </div>
          </div>
        </form>
      )}
      {feedback.message && (
        <p className={`${styles.feedback} ${styles[feedback.type]}`}>{feedback.message}</p>
      )}
    </>
  );
};

export default BananaMessageForm;
